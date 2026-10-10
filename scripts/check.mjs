import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { site } from '../dist/content.js';

const project = fileURLToPath(new URL('../', import.meta.url));
for (const path of ['dist/app.js', 'dist/content.js', 'dist/complete.js', 'netlify/functions/registrations.mjs', 'netlify/functions/lib/registrations.mjs', 'netlify/functions/registration-notifications.mjs', 'netlify/functions/lib/registration-emails.mjs', 'scripts/preview.mjs', 'scripts/preview-emails.mjs']) {
  const result = spawnSync(process.execPath, ['--check', path], { cwd: project, encoding: 'utf8' });
  assert.equal(result.status, 0, `${path}: ${result.stderr}`);
}
assert.ok(site.name.trim(), 'Site name is required');
assert.equal(typeof site.registrationOpen, 'boolean');
assert.equal(typeof site.registrationEmailsEnabled, 'boolean');
assert.ok(Array.isArray(site.news) && Array.isArray(site.faqs));
if (site.donationUrl) {
  const url = new URL(site.donationUrl);
  assert.equal(url.protocol, 'https:', 'Donation URL must use HTTPS');
  assert.ok(!url.username && !url.password, 'Donation URL must not contain credentials');
}
if (site.registrationOpen) {
  assert.equal(site.registrationEmailsEnabled, true, 'Enable and verify automatic email delivery before opening registration');
  assert.ok(site.donationUrl, 'Add the school donation URL before opening registration');
  for (const key of ['date', 'location', 'deadline', 'fee']) assert.ok(site[key] && !/announced|coming soon/i.test(site[key]), `Set ${key} before opening registration`);
  assert.match(site.contactEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Set organizer contact email before opening registration');
}
for (const article of site.news) {
  assert.ok(article.id && article.title && article.category && article.summary && article.paragraphs.length, 'News article is incomplete');
  if (article.date) assert.match(article.date, /^\d{4}-\d{2}-\d{2}$/);
}
for (const faq of site.faqs) assert.ok(faq.question && faq.answer, 'FAQ is incomplete');
assert.ok(Array.isArray(site.pastTournaments), 'Past tournaments must be an array');
assert.equal(new Set(site.pastTournaments.map((tournament) => tournament.year)).size, site.pastTournaments.length, 'Past tournament years must be unique');
for (const tournament of site.pastTournaments) {
  assert.ok(Number.isInteger(tournament.year) && tournament.title && tournament.summary, 'Past tournament details are incomplete');
  assert.ok(Array.isArray(tournament.photos) && Array.isArray(tournament.results) && Array.isArray(tournament.awards), 'Past tournament sections must be arrays');
  for (const photo of tournament.photos) {
    assert.match(photo.src, /^\/assets\/tournaments\/[^?#]+\.(?:jpe?g|png|webp)$/i, 'Use a local tournament photo');
    assert.ok(typeof photo.alt === 'string' && photo.alt.trim(), 'Tournament photos need descriptive alt text');
    assert.ok((await stat(new URL(`../dist${photo.src}`, import.meta.url))).isFile(), `Missing tournament photo: ${photo.src}`);
  }
  for (const result of tournament.results) assert.ok(result.category && result.placement && result.participant, 'Tournament result is incomplete');
  for (const award of tournament.awards) assert.ok(award.title && award.recipient, 'Tournament award is incomplete');
}
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
assert.match(html, /data-netlify="true"/);
assert.match(html, /name="form-name" value="math-registration"/);
const mediaCheckbox = html.match(/<input\b[^>]*name="media-consent"[^>]*>/)?.[0];
assert.ok(mediaCheckbox, 'Photo and media consent must be detected by Netlify Forms');
assert.match(mediaCheckbox, /type="checkbox"/);
assert.match(mediaCheckbox, /value="yes"/);
assert.doesNotMatch(mediaCheckbox, /\s(?:required|checked)(?:[\s=>])/, 'Photo and media consent must be optional and unchecked');
for (const field of ['student-first-name', 'student-last-name', 'grade', 'parent-name', 'email', 'school', 'parent-consent', 'registration-reference', 'registration-type', 'registration-purpose', 'student-count', 'payment-status', 'website']) assert.ok(html.includes(`name="${field}"`), `Missing form field: ${field}`);
for (const index of [2, 3, 4]) for (const suffix of ['first-name', 'last-name', 'grade', 'school']) assert.ok(html.includes(`name="student-${index}-${suffix}"`), `Missing group field: student-${index}-${suffix}`);
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML ids');
const test = spawnSync(process.execPath, ['--test', 'tests/registrations.test.mjs', 'tests/registration-emails.test.mjs'], { cwd: project, encoding: 'utf8' });
process.stdout.write(test.stdout);
assert.equal(test.status, 0, test.stderr);
console.log('Website checks passed. Registration is ' + (site.registrationOpen ? 'open.' : 'closed until the organizer supplies event details.'));
