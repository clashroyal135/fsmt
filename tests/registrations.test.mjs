import test from 'node:test';
import assert from 'node:assert/strict';
import { publicRegistrations, fetchRegistrations, createRegistrationHandler } from '../netlify/functions/lib/registrations.mjs';

const record = (id, grade = '3', overrides = {}) => ({ id, data: { 'student-first-name': 'Avery', 'student-last-name': 'Johnson', grade, 'school': 'Private School', 'parent-name': 'Private Parent', email: 'private@example.org', 'parent-consent': 'yes', 'registration-reference': `MATH-${id}`, ...overrides } });
const groupRecord = (id, overrides = {}) => record(id, '3', {
  'student-count': '4', 'registration-type': 'group',
  'student-2-first-name': 'Blake', 'student-2-last-name': 'Smith', 'student-2-grade': '3', 'student-2-school': 'Private School Two',
  'student-3-first-name': 'Casey', 'student-3-last-name': 'Brown', 'student-3-grade': '4', 'student-3-school': 'Private School Three',
  'student-4-first-name': 'Drew', 'student-4-last-name': 'Williams', 'student-4-grade': '5', 'student-4-school': 'Private School Four',
  ...overrides
});
const response = (data, headers = {}, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const request = (method = 'GET') => new Request('https://competition.example/api/registrations', { method });

test('public response contains only allowed student fields and aggregate counts', () => {
  const result = publicRegistrations([record('one'), record('two', '4', { 'student-first-name': 'Jordan', 'student-last-name': 'Éclair' }), record('three', '5')], '2026-10-09T00:00:00Z');
  assert.deepEqual(result.byGrade, { 3: 1, 4: 1, 5: 1 });
  assert.equal(result.total, 3);
  assert.deepEqual(Object.keys(result.participants[0]).sort(), ['firstName', 'grade', 'lastInitial']);
  assert.equal(result.participants.find((p) => p.firstName === 'Jordan').lastInitial, 'É');
  const serialized = JSON.stringify(result);
  for (const privateValue of ['Johnson', 'Éclair', 'Private School', 'Private Parent', 'private@example.org', 'MATH-one']) assert.ok(!serialized.includes(privateValue));
});
test('invalid grades, incomplete entries, and entries without parent consent are excluded', () => {
  const result = publicRegistrations([record('ok'), record('bad-grade', '6'), record('missing-first', '3', { 'student-first-name': ' ' }), record('no-consent', '4', { 'parent-consent': 'no' }), { id: 'empty' }, { ...record('spam'), state: 'spam' }]);
  assert.equal(result.total, 1);
});
test('photo permission stays private and does not affect public registration eligibility', () => {
  for (const permission of ['yes', 'no', undefined]) {
    const result = publicRegistrations([groupRecord('media', { 'media-consent': permission })]);
    assert.equal(result.total, 4);
    assert.deepEqual(Object.keys(result).sort(), ['byGrade', 'participants', 'total', 'updatedAt']);
    for (const student of result.participants) assert.deepEqual(Object.keys(student).sort(), ['firstName', 'grade', 'lastInitial']);
  }
});
test('network retries with the same reference are counted once', () => {
  assert.equal(publicRegistrations([record('a'), record('b', '3', { 'registration-reference': 'MATH-a' })]).total, 1);
});
test('one four-student submission publishes four limited entries and counts individual grades', () => {
  const result = publicRegistrations([groupRecord('group')]);
  assert.equal(result.total, 4);
  assert.deepEqual(result.byGrade, { 3: 2, 4: 1, 5: 1 });
  assert.deepEqual(result.participants, [
    { firstName: 'Avery', lastInitial: 'J', grade: 3 },
    { firstName: 'Blake', lastInitial: 'S', grade: 3 },
    { firstName: 'Casey', lastInitial: 'B', grade: 4 },
    { firstName: 'Drew', lastInitial: 'W', grade: 5 }
  ]);
  const serialized = JSON.stringify(result);
  for (const privateValue of ['Johnson', 'Smith', 'Brown', 'Williams', 'Private School', 'Private Parent', 'private@example.org', 'MATH-group']) assert.ok(!serialized.includes(privateValue));
});
test('a group retry reuses its reference without duplicating its four students', () => {
  const duplicate = groupRecord('duplicate', { 'registration-reference': 'MATH-group' });
  assert.equal(publicRegistrations([groupRecord('group'), duplicate]).total, 4);
});
test('groups cannot exceed four students or silently accept an incomplete roster', () => {
  for (const count of ['0', '5', '2.5', 'invalid']) assert.equal(publicRegistrations([groupRecord('invalid-size', { 'student-count': count })]).total, 0);
  assert.equal(publicRegistrations([groupRecord('missing-fourth', { 'student-4-first-name': '' })]).total, 0);
  assert.equal(publicRegistrations([groupRecord('invalid-grade', { 'student-4-grade': '6' })]).total, 0);
});
test('only selected student slots count, including two-student groups and individual submissions', () => {
  const pair = groupRecord('pair', { 'student-count': '2' });
  assert.equal(publicRegistrations([pair]).total, 2);
  const single = groupRecord('single', { 'student-count': '1', 'registration-type': 'individual' });
  assert.equal(publicRegistrations([single]).total, 1);
});
test('legacy single registrations and new groups combine into student totals', () => {
  const result = publicRegistrations([record('legacy', '5'), groupRecord('group')]);
  assert.equal(result.total, 5);
  assert.deepEqual(result.byGrade, { 3: 2, 4: 1, 5: 2 });
});
test('student names are preserved as data, including Unicode, without exposing last names', () => {
  const result = publicRegistrations([record('unicode', '5', { 'student-first-name': '李', 'student-last-name': '王' })]);
  assert.deepEqual(result.participants, [{ firstName: '李', lastInitial: '王', grade: 5 }]);
  const expanded = publicRegistrations([record('initial', '4', { 'student-last-name': 'ßtest' })]);
  assert.equal(expanded.participants[0].lastInitial, 'S');
});
test('API pagination follows every page and returns only the public projection', async () => {
  const urls = [];
  const fetcher = async (url, options) => {
    urls.push(url);
    assert.equal(options.headers.Authorization, 'Bearer server-only-secret');
    assert.equal(options.redirect, 'error');
    if (urls.length === 1) return response([record('first')], { Link: '<https://api.netlify.com/api/v1/forms/form-1/submissions?per_page=100&page=2>; rel="next"' });
    return response([record('second', '5')]);
  };
  const result = await fetchRegistrations({ token: 'server-only-secret', formId: 'form-1', fetcher });
  assert.equal(urls.length, 2);
  assert.equal(result.total, 2);
  assert.ok(!JSON.stringify(result).includes('server-only-secret'));
});
test('a full page without a Link header does not truncate registrations at 100', async () => {
  let calls = 0;
  const fetcher = async () => { calls += 1; return response(calls === 1 ? Array.from({ length: 100 }, (_, i) => record(`page1-${i}`)) : [record('page2')]); };
  const result = await fetchRegistrations({ token: 'secret', formId: 'form-1', fetcher });
  assert.equal(result.total, 101);
  assert.equal(calls, 2);
});
test('private credentials cannot follow a malicious pagination link', async () => {
  let calls = 0;
  await assert.rejects(fetchRegistrations({ token: 'secret', formId: 'form-1', fetcher: async () => { calls += 1; return response([record('a')], { Link: '<https://untrusted.example/data>; rel="next"' }); } }), /Unsafe registration pagination/);
  assert.equal(calls, 1);
});
test('API failure never returns partial registration counts', async () => {
  let calls = 0;
  await assert.rejects(fetchRegistrations({ token: 'secret', formId: 'form-1', fetcher: async () => { calls += 1; return calls === 1 ? response([record('a')], { Link: '<https://api.netlify.com/api/v1/forms/form-1/submissions?page=2>; rel="next"' }) : response({ private: 'private@example.org' }, {}, 401); } }));
});
test('unconfigured public endpoint returns unavailable, never invented zero counts', async () => {
  const handler = createRegistrationHandler({ readEnvironment: () => ({}) });
  const result = await handler(request());
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await result.json(), { error: 'Registration display is not configured.' });
});
test('the public endpoint accepts reads only', async () => {
  const result = await createRegistrationHandler()(request('POST'));
  assert.equal(result.status, 405);
  assert.equal(result.headers.get('allow'), 'GET');
});
test('public response caches the limited projection and reflects removal after expiration', async () => {
  let timestamp = 0;
  let calls = 0;
  const handler = createRegistrationHandler({ readEnvironment: () => ({ NETLIFY_FORMS_TOKEN: 'secret', REGISTRATION_FORM_ID: 'form-1' }), now: () => timestamp, fetcher: async () => { calls += 1; return response(calls === 1 ? [record('a')] : []); } });
  assert.equal((await (await handler(request())).json()).total, 1);
  timestamp = 10000;
  assert.equal((await (await handler(request())).json()).total, 1);
  assert.equal(calls, 1);
  timestamp = 31000;
  assert.equal((await (await handler(request())).json()).total, 0);
  assert.equal(calls, 2);
});
test('upstream failures never leak credentials, upstream bodies, or student records', async () => {
  const handler = createRegistrationHandler({ readEnvironment: () => ({ NETLIFY_FORMS_TOKEN: 'private-token', REGISTRATION_FORM_ID: 'form-1' }), fetcher: async () => response({ email: 'private@example.org', token: 'private-token' }, {}, 403) });
  const result = await handler(request());
  assert.equal(result.status, 502);
  const body = await result.text();
  assert.ok(!body.includes('private@example.org') && !body.includes('private-token'));
});
