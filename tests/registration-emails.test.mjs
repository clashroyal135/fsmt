import test from 'node:test';
import assert from 'node:assert/strict';
import { site } from '../dist/content.js';
import eventHandler from '../netlify/functions/registration-notifications.mjs';
import { emailRegistration, registrationEmails, createNotificationHandler } from '../netlify/functions/lib/registration-emails.mjs';

const data = (overrides = {}) => ({
  'registration-purpose': 'math-competition', 'registration-reference': 'FSMT-FALL2026-012345ABCDEF',
  'parent-consent': 'yes', 'student-count': '4', 'parent-name': 'Sample Contact', email: 'parent@example.org',
  'student-first-name': 'Avery', 'student-last-name': 'Johnson', grade: '3', school: 'Sample School',
  'student-2-first-name': 'Blake', 'student-2-last-name': 'Smith', 'student-2-grade': '3', 'student-2-school': 'Sample School',
  'student-3-first-name': 'Casey', 'student-3-last-name': 'Brown', 'student-3-grade': '4', 'student-3-school': 'Sample School',
  'student-4-first-name': 'Drew', 'student-4-last-name': 'Williams', 'student-4-grade': '5', 'student-4-school': 'Sample School',
  ...overrides
});
const enabled = { ...site, registrationEmailsEnabled: true };
const env = () => ({ RESEND_API_KEY: 'private-test-secret' });
const quietLogger = { info() {}, error() {} };
const accepted = () => new Response(JSON.stringify({ id: 'email-id' }), { status: 200 });
const handler = (options = {}) => createNotificationHandler({ site: enabled, readEnvironment: env, logger: quietLogger, pause: async () => {}, ...options });

test('mail function is a platform event handler with no public send endpoint', () => {
  assert.equal(typeof eventHandler.formSubmitted, 'function');
  assert.equal(eventHandler.fetch, undefined);
});
test('four students share one parent confirmation and one separate organizer notification', () => {
  const messages = registrationEmails(emailRegistration(data()), { ...enabled, donationUrl: 'https://school.example/donate?campaign=math&year=2026' });
  assert.equal(messages.length, 2);
  assert.deepEqual(messages[0].message.to, ['parent@example.org']);
  assert.deepEqual(messages[1].message.to, ['chrisgaorb@gmail.com']);
  assert.equal(messages[0].message.reply_to, 'chrisgaorb@gmail.com');
  assert.equal(messages[1].message.reply_to, 'parent@example.org');
  for (const { message } of messages) {
    assert.equal(message.from, 'Fulton Science Academy Mu Alpha Theta <fsmt@fultonscienceacademy.org>');
    assert.equal(message.cc, undefined);
    assert.equal(message.bcc, undefined);
    for (const name of ['Avery Johnson', 'Blake Smith', 'Casey Brown', 'Drew Williams']) assert.ok(message.text.includes(name));
    assert.ok(message.text.includes('FSMT-FALL2026-012345ABCDEF'));
    assert.ok(message.text.includes('pending school confirmation'));
  }
  assert.ok(messages[0].message.html.includes('https://school.example/donate?campaign=math&amp;year=2026'));
});
test('single-student email excludes inactive group slots', () => {
  const messages = registrationEmails(emailRegistration(data({ 'student-count': '1' })), enabled);
  assert.ok(messages[0].message.text.includes('1 student'));
  assert.ok(!messages[0].message.text.includes('Blake Smith'));
});
test('photo permission requires an explicit yes and is reported in both emails', () => {
  for (const value of ['yes', 'no', undefined, '', 'true', true, ['yes']]) {
    const registration = emailRegistration(data({ 'media-consent': value }));
    assert.ok(registration, 'Declining media permission must not prevent registration');
    assert.equal(registration.mediaConsent, value === 'yes');
    const expected = value === 'yes' ? 'Granted for every student in this registration.' : 'Not granted.';
    for (const { message } of registrationEmails(registration, enabled)) {
      assert.ok(message.text.includes(`Photo and media permission: ${expected}`));
      assert.ok(message.html.includes(`<strong>Photo and media permission:</strong> ${expected}`));
    }
  }
});
test('user-supplied HTML is escaped in email content', () => {
  const registration = emailRegistration(data({ 'parent-name': '<script>bad()</script>', 'student-first-name': '<img src=x onerror=bad()>', school: '<b>School</b>' }));
  for (const { message } of registrationEmails(registration, enabled)) {
    assert.ok(!message.html.includes('<script>') && !message.html.includes('<img src=x'));
    assert.ok(message.html.includes('&lt;img'));
    assert.ok(message.html.includes('&lt;b&gt;School&lt;/b&gt;'));
  }
});
test('unsafe donation URLs never become email links', () => {
  for (const donationUrl of ['javascript:alert(1)', 'http://school.example/donate', 'https://user:pass@school.example/']) {
    const parent = registrationEmails(emailRegistration(data()), { ...enabled, donationUrl })[0].message;
    assert.ok(!parent.html.includes('Continue to school donation page'));
    assert.ok(parent.text.includes('provided by the organizer'));
  }
});
test('invalid contact addresses, references, consent, groups, and unrelated forms are not mailed', () => {
  for (const overrides of [{ email: 'one@example.org,two@example.org' }, { email: 'one@example.org\r\nBcc:someone@example.org' }, { 'registration-reference': 'wrong' }, { 'parent-consent': 'no' }, { 'student-count': '5' }, { 'student-4-grade': '' }, { 'registration-purpose': 'unrelated' }]) assert.equal(emailRegistration(data(overrides)), null);
});
test('disabled or unrelated events do not make any email API requests', async () => {
  let requests = 0;
  const fetcher = async () => { requests += 1; return accepted(); };
  assert.deepEqual(await createNotificationHandler({ site: { ...site, registrationEmailsEnabled: false }, fetcher })({ data: data() }), { skipped: 'disabled' });
  assert.deepEqual(await handler({ fetcher })({ data: data({ 'registration-purpose': 'unrelated' }) }), { skipped: 'unrelated-or-invalid-registration' });
  assert.equal(requests, 0);
});
test('missing email credentials fail before transmitting anything', async () => {
  let requests = 0;
  await assert.rejects(handler({ readEnvironment: () => ({}), fetcher: async () => { requests += 1; return accepted(); } })({ data: data() }), /not configured/);
  assert.equal(requests, 0);
});
test('recipient-specific idempotency keys stay stable across event retries and omit email addresses', async () => {
  const requests = [];
  const processEvent = handler({ fetcher: async (url, options) => { requests.push({ url, options, body: JSON.parse(options.body) }); return accepted(); } });
  await processEvent({ data: data() });
  await processEvent({ data: data() });
  assert.equal(requests.length, 4);
  for (const request of requests) {
    assert.equal(request.url, 'https://api.resend.com/emails');
    assert.equal(request.options.redirect, 'error');
    assert.equal(request.options.headers.Authorization, 'Bearer private-test-secret');
    assert.ok(!request.options.headers['Idempotency-Key'].includes('@'));
    assert.ok(!JSON.stringify(request.body).includes('private-test-secret'));
    assert.equal(request.body.to.length, 1);
  }
  assert.equal(requests[0].options.headers['Idempotency-Key'], requests[2].options.headers['Idempotency-Key']);
  assert.equal(requests[1].options.headers['Idempotency-Key'], requests[3].options.headers['Idempotency-Key']);
  assert.notEqual(requests[0].options.headers['Idempotency-Key'], requests[1].options.headers['Idempotency-Key']);
});
test('transient provider failures retry using the same message key', async () => {
  const attempts = new Map();
  const keys = [];
  await handler({ fetcher: async (url, options) => {
    const key = options.headers['Idempotency-Key'];
    keys.push(key);
    const count = (attempts.get(key) || 0) + 1;
    attempts.set(key, count);
    return count === 1 ? new Response('{}', { status: 503 }) : accepted();
  } })({ data: data() });
  assert.equal(attempts.size, 2);
  assert.deepEqual([...attempts.values()], [2, 2]);
  assert.equal(keys.length, 4);
});
test('one recipient failure does not prevent the other request and is reported without private data', async () => {
  const requests = [];
  const logs = [];
  await assert.rejects(handler({ logger: { info() {}, error(...args) { logs.push(args); } }, fetcher: async (url, options) => {
    const message = JSON.parse(options.body);
    requests.push(message.to[0]);
    return message.to[0] === 'parent@example.org' ? new Response(JSON.stringify({ message: 'parent@example.org private-test-secret' }), { status: 403 }) : accepted();
  } })({ data: data() }), /failed for parent/);
  assert.deepEqual(requests.sort(), ['chrisgaorb@gmail.com', 'parent@example.org']);
  const serialized = JSON.stringify(logs);
  assert.ok(!serialized.includes('parent@example.org') && !serialized.includes('private-test-secret') && !serialized.includes('Avery Johnson'));
});
