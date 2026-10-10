import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { site } from '../dist/content.js';

const project = fileURLToPath(new URL('../', import.meta.url));
for (const path of ['dist/app.js', 'dist/content.js', 'scripts/preview.mjs']) {
  const result = spawnSync(process.execPath, ['--check', path], { cwd: project, encoding: 'utf8' });
  assert.equal(result.status, 0, `${path}: ${result.stderr}`);
}
assert.ok(site.name.trim(), 'Site name is required');
assert.equal(typeof site.registrationOpen, 'boolean');
assert.ok(Array.isArray(site.news) && Array.isArray(site.faqs));
if (site.donationUrl) {
  const url = new URL(site.donationUrl);
  assert.equal(url.protocol, 'https:', 'Donation URL must use HTTPS');
  assert.ok(!url.username && !url.password, 'Donation URL must not contain credentials');
}
const googleFormHosts = ['docs.google.com', 'forms.gle'];
if (site.registrationFormUrl) {
  const url = new URL(site.registrationFormUrl);
  assert.equal(url.protocol, 'https:', 'Registration form URL must use HTTPS');
  assert.ok(googleFormHosts.includes(url.hostname), 'Registration form URL must be a Google Forms link (docs.google.com/forms/... or forms.gle/...)');
  if (url.hostname === 'docs.google.com') assert.match(url.pathname, /^\/forms\//, 'Registration form URL must be a Google Forms link');
  assert.doesNotMatch(url.pathname, /\/edit\b/, 'Use the form share link, not the editor link ending in /edit');
}
if (site.registrationOpen) {
  if (!site.registrationFormUrl) console.warn('Warning: registration is open but registrationFormUrl is empty. The Registration page will say the link is coming soon.');
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
const app = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
assert.doesNotMatch(html, /data-netlify/, 'Registration uses Google Forms; remove any Netlify form');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML ids');
for (const [, id] of app.matchAll(/\$\('#([\w-]+)/g)) assert.ok(ids.includes(id), `app.js uses #${id}, which is missing from index.html`);
console.log('Website checks passed. Registration is ' + (site.registrationOpen ? 'open.' : 'closed.'));
