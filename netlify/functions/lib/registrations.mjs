const API_ORIGIN = 'https://api.netlify.com';

export function registrationStudents(data) {
  if (!data || typeof data !== 'object' || data['parent-consent'] !== 'yes') return null;
  const count = data['student-count'] === undefined ? 1 : Number(data['student-count']);
  if (!Number.isInteger(count) || count < 1 || count > 4) return null;
  const students = [];
  for (let index = 1; index <= count; index += 1) {
    const first = data[index === 1 ? 'student-first-name' : `student-${index}-first-name`];
    const last = data[index === 1 ? 'student-last-name' : `student-${index}-last-name`];
    const school = data[index === 1 ? 'school' : `student-${index}-school`];
    const grade = Number(data[index === 1 ? 'grade' : `student-${index}-grade`]);
    const firstName = typeof first === 'string' ? first.trim().slice(0, 60) : '';
    const lastName = typeof last === 'string' ? last.trim().normalize('NFC').slice(0, 60) : '';
    if (![3, 4, 5].includes(grade) || !firstName || !lastName) return null;
    students.push({ firstName, lastName, grade, school: typeof school === 'string' ? school.trim().slice(0, 120) : '' });
  }
  return students;
}

export function publicRegistrations(submissions, updatedAt = new Date().toISOString()) {
  const byGrade = { 3: 0, 4: 0, 5: 0 };
  const participants = [];
  const seen = new Set();
  for (const submission of submissions) {
    const data = submission.data;
    if (!data || typeof data !== 'object' || submission.state === 'spam') continue;
    const students = registrationStudents(data);
    if (!students) continue;
    // Explicitly project each student; full names and schools stay server-side.
    const group = students.map(({ firstName, lastName, grade }) => ({ firstName, lastInitial: [...[...lastName][0].toLocaleUpperCase()][0], grade }));
    // Reusing the reference on a network retry prevents duplicate public entries.
    // Netlify still retains the original submissions for the organizer's review.
    const reference = typeof data['registration-reference'] === 'string' ? data['registration-reference'] : '';
    const key = reference || submission.id;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    participants.push(...group);
    group.forEach((student) => { byGrade[student.grade] += 1; });
  }
  participants.sort((a, b) => a.firstName.localeCompare(b.firstName) || a.lastInitial.localeCompare(b.lastInitial) || a.grade - b.grade);
  return { total: participants.length, byGrade, participants, updatedAt };
}

export async function fetchRegistrations({ token, formId, fetcher = fetch, signal = AbortSignal.timeout(15000) }) {
  if (!token || !formId) throw new Error('Registration service is not configured');
  const path = `/api/v1/forms/${encodeURIComponent(formId)}/submissions`;
  let url = `${API_ORIGIN}${path}?per_page=100&page=1`;
  const records = [];
  const visited = new Set();
  for (let page = 1; page <= 100; page += 1) {
    if (visited.has(url)) throw new Error('Repeated registration page');
    visited.add(url);
    const response = await fetcher(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': 'MathCompetition/1.0' }, signal, redirect: 'error' });
    if (!response.ok) throw new Error('Registration service request failed');
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Unexpected registration response');
    records.push(...batch);
    const nextMatch = response.headers.get('link')?.match(/<([^>]+)>\s*;\s*rel="next"/);
    if (nextMatch) {
      const nextUrl = new URL(nextMatch[1]);
      // The private token must never be forwarded to another server or endpoint.
      if (nextUrl.origin !== API_ORIGIN || nextUrl.pathname !== path) throw new Error('Unsafe registration pagination');
      url = nextUrl.href;
    } else if (batch.length === 100) {
      url = `${API_ORIGIN}${path}?per_page=100&page=${page + 1}`;
    } else {
      return publicRegistrations(records);
    }
  }
  throw new Error('Registration page limit exceeded');
}

export function createRegistrationHandler({ readEnvironment = () => process.env, fetcher = fetch, now = () => Date.now() } = {}) {
  let cached = null;
  let cacheExpires = 0;
  let pending = null;
  return async (request) => {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
    const reply = (body, status, cache = 'no-store') => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Cache-Control': cache } });
    if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...headers, Allow: 'GET', 'Cache-Control': 'no-store' } });
    const env = readEnvironment();
    if (!env.NETLIFY_FORMS_TOKEN || !env.REGISTRATION_FORM_ID) return reply({ error: 'Registration display is not configured.' }, 503);
    try {
      if (!cached || now() >= cacheExpires) {
        pending ??= fetchRegistrations({ token: env.NETLIFY_FORMS_TOKEN, formId: env.REGISTRATION_FORM_ID, fetcher });
        try { cached = await pending; cacheExpires = now() + 30000; }
        finally { pending = null; }
      }
      return reply(cached, 200, 'public, max-age=0, s-maxage=30');
    } catch {
      // Do not expose upstream response bodies, student records, or credentials.
      return reply({ error: 'Registrations are temporarily unavailable.' }, 502);
    }
  };
}
