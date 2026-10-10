import { site } from './content.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const routes = ['home', 'competition', 'news', 'past-tournaments', 'faqs', 'register'];
let currentRoute = 'home';

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function fillAll(selector, text) { $$(selector).forEach((node) => { node.textContent = text; }); }
function safeUrl(value, hosts) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return !hosts || hosts.includes(url.hostname) ? url.href : null;
  } catch { return null; }
}
// Only Google Forms links are accepted for registration.
const googleFormHosts = ['docs.google.com', 'forms.gle'];
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
  fillAll('[data-registration-status]', site.registrationOpen ? `Registration is open until ${site.deadline}` : 'Registration is closed');
  $('#hero-description').textContent = site.description;
  fillAll('[data-contact-note]', site.contactEmail ? 'For questions or corrections, email:' : site.contactNote);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.contactEmail)) {
    $$('[data-contact-link]').forEach((link) => { link.href = `mailto:${site.contactEmail}`; link.textContent = site.contactEmail; link.hidden = false; });
  }
  $('#preview-banner').hidden = !localPreview;
  const formUrl = site.registrationOpen ? safeUrl(site.registrationFormUrl, googleFormHosts) : null;
  if (formUrl) { $('#registration-form-link').href = formUrl; $('#registration-form-link').hidden = false; }
  $('#registration-notice').hidden = !!formUrl;
  if (!formUrl && site.registrationOpen) $('#registration-notice').textContent = 'The registration form link will be posted here shortly.';
  const donationUrl = safeUrl(site.donationUrl);
  if (donationUrl) { $('#donation-link').href = donationUrl; $('#donation-link').hidden = false; }
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
function renderCompetitionInfo() {
  $('#rounds-list').replaceChildren(...(site.rounds || []).map((round) => {
    const item = element('div', undefined, 'round-item');
    item.append(element('h3', round.name), element('p', round.summary, 'round-summary'), element('p', round.description));
    return item;
  }));
  $('#schedule-list').replaceChildren(...(site.schedule || []).map((entry) => {
    const row = element('div');
    row.append(element('dt', entry.time), element('dd', entry.label));
    return row;
  }));
  $('#awards-list').replaceChildren(...(site.awards || []).map((award) => {
    const item = element('div', undefined, 'award-item');
    item.append(element('h3', award.title), element('p', award.description));
    return item;
  }));
  $('#team-scoring').replaceChildren(...(site.teamScoring || []).map((text) => element('li', text)));
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
  placeholder.append(icon, element('h4', title));
  if (description) placeholder.append(element('p', description));
  return placeholder;
}

function renderPastTournaments() {
  const tournaments = [...site.pastTournaments].sort((a, b) => b.year - a.year);
  fillAll('[data-archive-year]', tournaments[0]?.year ?? '✳');
  $('#past-tournaments-list').replaceChildren(...tournaments.map((tournament) => {
    const article = element('article', undefined, 'tournament-year');
    const header = element('header', undefined, 'archive-year-header');
    const year = element('h2', String(tournament.year), 'archive-year-number');
    const introduction = element('div');
    introduction.append(element('p', tournament.summary));
    header.append(year, introduction);

    const photos = element('section', undefined, 'archive-section');
    photos.append(element('h3', 'Photos'));
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
      photos.append(archiveEmpty('Coming soon', '', '▧'));
    }

    const details = element('div', undefined, 'archive-details-grid');
    const results = element('section', undefined, 'archive-section');
    results.append(element('h3', 'Results'));
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
      results.append(archiveEmpty('Coming soon', '', '≡'));
    }
    const awards = element('section', undefined, 'archive-section');
    awards.append(element('h3', 'Awards'));
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
      awards.append(archiveEmpty('Coming soon', '', '✧'));
    }
    details.append(results, awards);
    article.append(header, photos, details);
    return article;
  }));
}

function openInformation(kind) {
  const privacy = kind === 'privacy';
  $('#info-eyebrow').textContent = privacy ? 'YOUR INFORMATION' : 'FOR THE ORGANIZING TEAM';
  $('#info-title').textContent = privacy ? 'Privacy' : 'Managing registrations';
  const paragraphs = privacy ? [
    'Registration takes place on a Google Form run by Fulton Science Academy Mu Alpha Theta. It collects each student’s full name, grade, and school, plus one parent, guardian, or authorized group contact’s name and email address, a parent or guardian permission confirmation, and an optional photo and media choice. You can register up to four students in one form. The organizer uses these details to run the competition and contact families.',
    'Responses are stored in the organizer’s Google account and are visible only to the organizing team. Google processes the responses and emails the contact a copy of their answers. Student names and contact details are not published on this website.',
    'Photo and media permission is optional. Choosing yes gives permission for Fulton Science Academy Mu Alpha Theta to photograph and record every student in the registration during the tournament and publish the photos and videos on school or tournament websites, social media, newsletters, and promotional materials. Only choose yes if you have parent or guardian permission for every student. Students can participate without this permission. Contact the organizer to change your choice or to correct or remove a registration.',
    'Payment happens on the school’s donation website, under the school’s own payment and privacy policies. This website does not collect card details or automatically confirm a payment.'
  ] : [
    'Registrations are collected with the tournament’s Google Form. Open the form in Google Forms and choose Responses, or open the linked Google Sheet, to review, sort, and export registrations. Share access only with the organizing team.',
    'Check the photo and media permission answer before taking or publishing photos or videos of students. Only yes grants permission for every student in that registration.',
    'Payment must be confirmed using the school’s donation records. Match each donation to a registration using the parent or guardian name and the student names.',
    'To update event information, publish news, edit FAQs, or change the registration form link, edit dist/content.js and redeploy the website.'
  ];
  const nodes = paragraphs.map((text) => element('p', text));
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

configureContent();
renderCompetitionInfo();
renderNews();
renderPastTournaments();
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
window.addEventListener('hashchange', route);
route();
