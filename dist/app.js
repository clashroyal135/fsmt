import { site } from './content.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const routes = ['home', 'competition', 'news', 'past-tournaments', 'faqs', 'register'];
let currentRoute = 'home';
let participants = [];
let rosterAvailable = false;
let gradeFilter = 'all';
let loadingRoster = false;
let submitting = false;
let lastRefresh = null;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function fillAll(selector, text) { $$(selector).forEach((node) => { node.textContent = text; }); }
function safeDonationUrl() {
  try {
    const url = new URL(site.donationUrl);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
function configureContent() {
  document.title = `${site.name} · Grades 3–5`;
  $('.brand[aria-label]').setAttribute('aria-label', `${site.name} home`);
  fillAll('[data-site-name]', site.name);
  fillAll('[data-event-organizer]', site.organizer);
  fillAll('[data-event-date]', site.date);
  fillAll('[data-event-date-notice]', site.dateNotice);
  fillAll('[data-event-format]', site.format);
  fillAll('[data-team-formation]', site.teamFormation);
  fillAll('[data-event-time]', site.time);
  fillAll('[data-event-location]', site.location);
  fillAll('[data-event-deadline]', site.deadline);
  fillAll('[data-event-fee]', site.fee);
  fillAll('[data-donation-instructions]', site.donationInstructions);
  fillAll('[data-registration-status]', site.registrationOpen ? 'Registration is open' : 'Registration details coming soon');
  $('#hero-description').textContent = site.description;
  fillAll('[data-contact-note]', site.contactEmail ? 'Send a note to the competition organizer.' : site.contactNote);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.contactEmail)) {
    $$('[data-contact-link]').forEach((link) => { link.href = `mailto:${site.contactEmail}`; link.textContent = site.contactEmail; link.hidden = false; });
  }
  $('#preview-banner').hidden = !localPreview;
  $('#registration-fields').disabled = !(localPreview || site.registrationOpen);
  $('#form-notice').hidden = site.registrationOpen && !localPreview;
  if (localPreview) {
    $('#form-notice').textContent = 'Try the registration flow with sample details. This local preview does not save registrations or send emails.';
    $('#submit-registration').textContent = 'Preview confirmation ↗';
  }
  if (!site.registrationEmailsEnabled && !localPreview) $('#email-help').textContent = 'Automatic confirmation emails are being connected before registration opens.';
  const donationUrl = safeDonationUrl();
  $('#donation-link').hidden = !donationUrl || localPreview;
  if (donationUrl && !localPreview) $('#donation-link').href = donationUrl;
  $('#donation-unavailable').hidden = !!donationUrl && !localPreview;
  if (localPreview) $('#donation-unavailable').textContent = donationUrl ? 'Payment links are disabled in this local preview.' : 'The school donation link has not been added yet. Payment is unavailable in this preview.';
}

function makeNewsCard(article) {
  const card = element('article', undefined, 'news-card');
  const meta = element('div', undefined, 'news-meta');
  meta.append(element('span', article.category, 'news-category'));
  if (article.date) {
    const date = element('time', new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${article.date}T12:00:00Z`)));
    date.dateTime = article.date;
    meta.append(date);
  }
  const read = element('button', 'Read update →', 'text-button');
  read.type = 'button';
  read.setAttribute('aria-label', `Read update: ${article.title}`);
  read.addEventListener('click', () => {
    $('#article-category').textContent = article.category;
    $('#article-title').textContent = article.title;
    $('#article-body').replaceChildren(...article.paragraphs.map((text) => element('p', text)));
    $('#article-dialog').showModal();
  });
  card.append(meta, element('h3', article.title), element('p', article.summary), read);
  return card;
}
function renderNews() {
  $('#home-news').replaceChildren(...site.news.slice(0, 2).map(makeNewsCard));
  $('#all-news').replaceChildren(...site.news.map(makeNewsCard));
  $('#faq-list').replaceChildren(...site.faqs.map((faq) => {
    const details = element('details');
    details.append(element('summary', faq.question), element('p', faq.answer));
    return details;
  }));
}

function archiveEmpty(title, description, symbol) {
  const placeholder = element('div', undefined, 'archive-empty');
  const icon = element('span', symbol, 'archive-empty-symbol');
  icon.setAttribute('aria-hidden', 'true');
  placeholder.append(icon, element('h4', title), element('p', description));
  return placeholder;
}

function renderPastTournaments() {
  const tournaments = [...site.pastTournaments].sort((a, b) => b.year - a.year);
  fillAll('[data-archive-year]', tournaments[0]?.year ?? '✳');
  $('#past-tournaments-list').replaceChildren(...tournaments.map((tournament) => {
    const article = element('article', undefined, 'tournament-year');
    const header = element('header', undefined, 'archive-year-header');
    const year = element('span', String(tournament.year), 'archive-year-number');
    const introduction = element('div');
    introduction.append(element('div', 'FROM THE ARCHIVE', 'eyebrow'), element('h2', tournament.title), element('p', tournament.summary));
    header.append(year, introduction);

    const photos = element('section', undefined, 'archive-section');
    photos.append(element('h3', 'Photo gallery'));
    if (tournament.photos.length) {
      const gallery = element('div', undefined, 'archive-gallery');
      for (const photo of tournament.photos) {
        const figure = element('figure');
        const link = element('a');
        link.href = photo.src;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `View full photo: ${photo.alt} (opens in a new tab)`);
        const image = element('img');
        image.src = photo.src;
        image.alt = photo.alt;
        image.loading = 'lazy';
        image.decoding = 'async';
        link.append(image);
        figure.append(link);
        if (photo.caption) figure.append(element('figcaption', photo.caption));
        gallery.append(figure);
      }
      photos.append(gallery);
    } else {
      photos.append(archiveEmpty('Photos coming soon', 'A place for tournament-day moments, teamwork, and celebrations.', '▧'));
    }

    const details = element('div', undefined, 'archive-details-grid');
    const results = element('section', undefined, 'archive-section');
    results.append(element('h3', 'Tournament results'));
    if (tournament.results.length) {
      const scroll = element('div', undefined, 'table-scroll archive-results');
      scroll.tabIndex = 0;
      scroll.setAttribute('role', 'region');
      scroll.setAttribute('aria-label', `${tournament.year} tournament results`);
      const table = element('table');
      table.append(element('caption', `${tournament.year} tournament results`, 'sr-only'));
      const head = element('thead');
      const headings = element('tr');
      const showScores = tournament.results.some((result) => result.score !== undefined && result.score !== '');
      for (const label of ['Category', 'Place', 'Student / team', ...(showScores ? ['Score'] : [])]) {
        const cell = element('th', label);
        cell.scope = 'col';
        headings.append(cell);
      }
      head.append(headings);
      const body = element('tbody');
      for (const result of tournament.results) {
        const row = element('tr');
        for (const value of [result.category, result.placement, result.participant, ...(showScores ? [result.score ?? '—'] : [])]) row.append(element('td', value));
        body.append(row);
      }
      table.append(head, body);
      scroll.append(table);
      results.append(scroll);
    } else {
      results.append(archiveEmpty('Results coming soon', 'Published standings for students and teams will appear here.', '≡'));
    }
    const awards = element('section', undefined, 'archive-section');
    awards.append(element('h3', 'Awards & recognition'));
    if (tournament.awards.length) {
      const list = element('ul', undefined, 'archive-awards');
      for (const award of tournament.awards) {
        const item = element('li');
        item.append(element('h4', award.title), element('p', award.recipient, 'award-recipient'));
        if (award.description) item.append(element('p', award.description));
        list.append(item);
      }
      awards.append(list);
    } else {
      awards.append(archiveEmpty('Awards coming soon', 'Celebrating the achievements of our tournament participants.', '✧'));
    }
    details.append(results, awards);
    article.append(header, photos, details);
    return article;
  }));
}

function openInformation(kind) {
  const privacy = kind === 'privacy';
  $('#info-eyebrow').textContent = privacy ? 'YOUR INFORMATION' : 'FOR THE ORGANIZING TEAM';
  $('#info-title').textContent = privacy ? 'A clear view of privacy.' : 'Manage registrations.';
  const paragraphs = privacy ? [
    'A registration collects each student’s full name, grade, and school, plus one shared parent, guardian, or authorized group contact’s name and email address. You can register up to four students in one form. The organizer uses these details to run the competition and contact families.',
    'The public participant list shows only the student’s first name, last initial, and grade. Parent contact information, school details, full last names, and registration references are not included in the public list.',
    'Photo and media permission is optional and starts unchecked. Checking it gives permission for Fulton Science Academy Mu Alpha Theta to photograph and record every student in the registration during the tournament and publish the photos and videos on school or tournament websites, social media, newsletters, and promotional materials. Only check it if you have parent or guardian permission for every student. Students can participate without this permission. The choice is stored privately with the registration and included in confirmation emails; it does not appear on the public participant list. Contact the organizer with your registration reference to update your choice.',
    'Registration records are stored in the organizer’s private Netlify Forms dashboard. When automatic email delivery is enabled, Resend processes the registration details to send a confirmation to the shared contact and a separate notification to the school organizer. Organizers with account access can review and export records. Contact the organizer to correct or remove a registration.',
    'Payment happens on the school’s donation website, under the school’s own payment and privacy policies. This website does not collect card details or automatically confirm a payment.'
  ] : [
    'Sign in to the Netlify account that hosts this website, open this project, and choose Forms → math-registration. Full registration details are available there to authorized organizers.',
    'You can review submissions, correct their spam classification, export verified registrations as CSV, or remove records. Public participant names and grade counts refresh automatically from verified submissions.',
    'Check the media-consent field before taking or publishing photos or videos of students. Only yes grants permission for every student in that registration; no or a missing value does not grant permission. Keep this preference private and coordinate any changes directly with the registration contact.',
    'When automatic email delivery is enabled, each verified registration triggers one email to the shared registration contact and a separate email to the school organizer. A group shares one confirmation containing every included student. Registration references help match entries to school donation receipts. Payment must be confirmed using the school’s records.',
    'To update event information, publish news, or edit FAQs, ask Codex to update this website. The organizer dashboard becomes available after the site is deployed and form detection is enabled.'
  ];
  const nodes = paragraphs.map((text) => element('p', text));
  if (!privacy) {
    const link = element('a', 'Open Netlify organizer dashboard ↗', 'text-link');
    link.href = 'https://app.netlify.com/';
    link.rel = 'noopener noreferrer';
    nodes.push(link);
  }
  $('#info-body').replaceChildren(...nodes);
  if (!$('#info-dialog').open) $('#info-dialog').showModal();
}
function route() {
  const requested = location.hash.slice(1) || 'home';
  if (['privacy', 'organizers'].includes(requested)) { openInformation(requested); return; }
  if (!routes.includes(requested)) { location.hash = 'home'; return; }
  const changed = currentRoute !== requested;
  currentRoute = requested;
  $$('.page').forEach((page) => { page.hidden = page.dataset.route !== requested; });
  $$('[data-page]').forEach((link) => { if (link.dataset.page === requested) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  $('#main-nav').classList.remove('open');
  $('#menu-toggle').setAttribute('aria-expanded', 'false');
  const title = { home: 'Grades 3–5', competition: 'The competition', news: 'News & updates', 'past-tournaments': 'Past tournaments', faqs: 'FAQs', register: 'Student registration' };
  document.title = `${site.name} · ${title[requested]}`;
  if (changed) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const heading = $(`[data-route="${requested}"] h1`);
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}

function renderRoster() {
  const search = $('#roster-search').value.trim().toLocaleLowerCase();
  const visible = participants.filter((student) => (gradeFilter === 'all' || String(student.grade) === gradeFilter) && `${student.firstName} ${student.lastInitial}.`.toLocaleLowerCase().includes(search));
  $('#roster-body').replaceChildren(...visible.map((student) => {
    const row = element('tr');
    const name = element('td', `${student.firstName} ${student.lastInitial}.`);
    const grade = element('td');
    grade.append(element('span', `Grade ${student.grade}`, 'grade-pill'));
    row.append(name, grade);
    return row;
  }));
  $('#roster-table-wrap').hidden = !rosterAvailable || visible.length === 0;
  $('#roster-empty').hidden = rosterAvailable && visible.length > 0;
  if (rosterAvailable && visible.length === 0) {
    $('#empty-title').textContent = participants.length ? 'No matching participants.' : 'The adventure starts here.';
    $('#empty-copy').textContent = participants.length ? 'Try another first name or choose a different grade.' : 'Verified registrations will appear here automatically.';
  }
}
async function loadRegistrations() {
  if (loadingRoster) return;
  loadingRoster = true;
  $('#refresh-roster').disabled = true;
  $('#roster-status').textContent = 'Refreshing registrations…';
  try {
    const response = await fetch('/api/registrations', { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Unavailable');
    const data = await response.json();
    if (!Array.isArray(data.participants) || !data.byGrade || !Number.isSafeInteger(data.total)) throw new Error('Invalid response');
    // Only the public projection is returned by the server. Render all values as text.
    participants = data.participants.filter((p) => typeof p.firstName === 'string' && typeof p.lastInitial === 'string' && [3, 4, 5].includes(Number(p.grade)));
    rosterAvailable = true;
    lastRefresh = new Date(data.updatedAt);
    $('#count-total').textContent = String(data.total);
    [3, 4, 5].forEach((grade) => { $(`#count-${grade}`).textContent = String(data.byGrade[grade]); });
    $('#roster-status').textContent = `Updated ${lastRefresh.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · Refreshes automatically about once a minute`;
  } catch {
    if (!rosterAvailable) {
      $('#empty-title').textContent = localPreview ? 'The participant list is getting ready.' : 'The participant list is temporarily unavailable.';
      $('#empty-copy').textContent = localPreview ? 'Live names and grade counts will appear when the site is connected to registration storage. Preview registrations are not saved.' : 'Please try refreshing in a little while. Registration records remain private with the organizer.';
      $('#roster-status').textContent = localPreview ? 'Local preview · No live registration data' : 'Unable to load current registrations. Please try again.';
    } else {
      $('#roster-status').textContent = 'Refresh unavailable · Showing the last loaded list. Please try again.';
    }
  } finally {
    loadingRoster = false;
    $('#refresh-roster').disabled = false;
    renderRoster();
  }
}

function generateReference() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `FSMT-${[...bytes].map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
function value(name) { return $('#registration-form').elements.namedItem(name).value.trim(); }
function registrationStudents() {
  const count = Number(value('student-count'));
  return Array.from({ length: count }, (_, slot) => {
    const index = slot + 1;
    return {
      firstName: value(index === 1 ? 'student-first-name' : `student-${index}-first-name`),
      lastName: value(index === 1 ? 'student-last-name' : `student-${index}-last-name`),
      grade: value(index === 1 ? 'grade' : `student-${index}-grade`),
      school: value(index === 1 ? 'school' : `student-${index}-school`)
    };
  });
}
function syncStudentCount() {
  const count = Number(value('student-count'));
  $$('[data-student-slot]').forEach((card) => {
    const active = Number(card.dataset.studentSlot) <= count;
    card.hidden = !active;
    card.disabled = !active;
  });
  $('#registration-type').value = count === 1 ? 'individual' : 'group';
  if (!$('#form-fields').hidden) $('#form-heading').textContent = count === 1 ? 'A little about your student.' : `A little about your ${count} students.`;
}
function showFormError(message) { $('#form-error').textContent = message; $('#form-error').hidden = false; }
function validateForm() {
  $$('#registration-form [aria-invalid]').forEach((input) => input.removeAttribute('aria-invalid'));
  $$('#registration-form input:not([type="checkbox"]):not([type="hidden"])').forEach((input) => { input.value = input.value.trim(); });
  const invalid = $$('#registration-fields input, #registration-fields select').find((input) => !input.checkValidity());
  if (invalid) { invalid.setAttribute('aria-invalid', 'true'); invalid.reportValidity(); invalid.focus(); return false; }
  return true;
}
function reviewRegistration() {
  if (!validateForm()) return;
  $('#form-error').hidden = true;
  if (!$('#registration-reference').value) $('#registration-reference').value = generateReference();
  const students = registrationStudents();
  const rows = students.map((student, index) => {
    const row = element('div', undefined, 'review-student');
    row.append(element('dt', `Student ${index + 1} · ${student.firstName} ${student.lastName}`), element('dd', `Grade ${student.grade} · ${student.school}`));
    return row;
  });
  const entries = [
    ['Registration', students.length === 1 ? '1 student · Individual' : `${students.length} students · Group`],
    ['Shared contact', value('parent-name')],
    ['Email', value('email')],
    ['Photo and media permission', $('#media-consent').checked ? 'Granted for every student in this registration' : 'Not granted']
  ];
  rows.push(...entries.map(([label, text]) => { const row = element('div'); row.append(element('dt', label), element('dd', text)); return row; }));
  $('#review-details').replaceChildren(...rows);
  $('#form-fields').hidden = true;
  $('#form-review').hidden = false;
  $('#form-heading').textContent = 'One last look.';
  $('#form-subtitle').textContent = 'Check the details before submitting your registration.';
  $('#step-one-label').classList.remove('active');
  $('#step-two-label').classList.add('active');
  $('#form-heading').setAttribute('tabindex', '-1');
  $('#form-heading').focus();
}
function editRegistration() {
  $('#form-fields').hidden = false;
  $('#form-review').hidden = true;
  syncStudentCount();
  $('#form-subtitle').textContent = 'Required fields are marked with an asterisk.';
  $('#step-one-label').classList.add('active');
  $('#step-two-label').classList.remove('active');
  $('#student-first-name').focus();
}
function showConfirmation(reference) {
  $('#registration-card').hidden = true;
  $('#registration-confirmation').hidden = false;
  $('#confirmation-reference').textContent = reference;
  $('#confirmation-eyebrow').textContent = localPreview ? 'PREVIEW ONLY' : 'REGISTRATION SUBMITTED';
  $('#confirmation-title').textContent = localPreview ? 'Your preview is complete.' : 'A new adventure awaits.';
  const students = registrationStudents();
  const groupSummary = students.length === 1 ? `${students[0].firstName}'s grade ${students[0].grade} registration` : `Your group registration for ${students.length} students`;
  const emailNote = site.registrationEmailsEnabled ? ` A confirmation email is requested for ${value('email')} after spam verification, with a separate notification to the school organizer. Check your inbox and spam folder; contact the organizer if it does not arrive.` : ' Automatic confirmation emails are not enabled yet. Keep your registration reference.';
  $('#confirmation-description').textContent = localPreview ? `This is the confirmation for ${students.length} ${students.length === 1 ? 'student' : 'students'}. No registration has been submitted or saved, and no emails have been sent. One reference covers everyone in this registration.` : `${groupSummary} has been submitted. One reference covers everyone in this registration.${emailNote}`;
  $('#registration-confirmation').focus();
  $('#registration-confirmation').scrollIntoView({ block: 'start', behavior: 'smooth' });
}
async function submitRegistration(event) {
  event.preventDefault();
  if (submitting) return;
  if (!localPreview && !site.registrationOpen) { showFormError('Registration is not open yet. Please check the competition updates.'); return; }
  if (!validateForm()) return;
  if ($('#form-review').hidden) { reviewRegistration(); return; }
  submitting = true;
  $('#form-error').hidden = true;
  const reference = $('#registration-reference').value || generateReference();
  $('#registration-reference').value = reference;
  const formData = new FormData($('#registration-form'));
  formData.set('media-consent', $('#media-consent').checked ? 'yes' : 'no');
  const body = new URLSearchParams(formData).toString();
  $('#registration-fields').disabled = true;
  $('#submit-registration').textContent = localPreview ? 'Preparing preview…' : 'Submitting…';
  try {
    if (!localPreview) {
      const response = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error('Submission failed');
    }
    showConfirmation(reference);
  } catch {
    showFormError('We could not confirm that your registration was received. Your details are still here. If you retry, the same reference will be used. Contact the organizer if you are unsure.');
  } finally {
    submitting = false;
    $('#registration-fields').disabled = !(localPreview || site.registrationOpen);
    $('#submit-registration').textContent = localPreview ? 'Preview confirmation ↗' : 'Submit registration ↗';
  }
}
function registerAnother() {
  $('#registration-form').reset();
  $('#registration-reference').value = '';
  $('#registration-confirmation').hidden = true;
  $('#registration-card').hidden = false;
  $('#form-error').hidden = true;
  $('#copy-reference').textContent = 'Copy reference';
  editRegistration();
}

configureContent();
renderNews();
renderPastTournaments();
syncStudentCount();
$('#student-count').addEventListener('change', syncStudentCount);
$('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  $('#main').setAttribute('tabindex', '-1');
  $('#main').focus();
  $('#main').scrollIntoView({ block: 'start' });
});
$('#menu-toggle').addEventListener('click', () => {
  const open = $('#main-nav').classList.toggle('open');
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
});
$('#close-article').addEventListener('click', () => $('#article-dialog').close());
$('#close-info').addEventListener('click', () => $('#info-dialog').close());
$('#info-dialog').addEventListener('close', () => { if (['privacy', 'organizers'].includes(location.hash.slice(1))) location.hash = currentRoute; });
$('#review-registration').addEventListener('click', reviewRegistration);
$('#edit-registration').addEventListener('click', editRegistration);
$('#registration-form').addEventListener('submit', submitRegistration);
$('#register-another').addEventListener('click', registerAnother);
$('#copy-reference').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#confirmation-reference').textContent); $('#copy-reference').textContent = 'Copied!'; }
  catch { $('#copy-reference').textContent = 'Select the reference above to copy it.'; }
});
window.addEventListener('hashchange', route);
route();
