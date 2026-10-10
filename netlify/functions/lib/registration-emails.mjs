import { createHash } from 'node:crypto';
import { registrationStudents } from './registrations.mjs';

export const validEmail = (value) => typeof value === 'string' && value.length <= 254 && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/u.test(value);
const textValue = (value, length = 120) => typeof value === 'string' ? value.trim().slice(0, length) : '';
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function donationLink(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}

export function emailRegistration(data) {
  if (!data || data['registration-purpose'] !== 'math-competition') return null;
  const students = registrationStudents(data);
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const contactName = textValue(data['parent-name']);
  const reference = textValue(data['registration-reference'], 40);
  if (!students || students.some((student) => !student.school) || !validEmail(email) || !contactName || !/^FSMT-[A-F0-9]{12}$/.test(reference)) return null;
  return { students, email, contactName, reference, mediaConsent: data['media-consent'] === 'yes' };
}

export function registrationEmails(registration, site, { organizerEmail = site.contactEmail, fromEmail = site.senderEmail || site.contactEmail } = {}) {
  if (!validEmail(organizerEmail) || !validEmail(fromEmail)) throw new Error('Registration email addresses are not configured correctly.');
  const senderName = textValue(site.organizer).replace(/[<>"\r\n]/g, '');
  const from = `${senderName} <${fromEmail}>`;
  const count = registration.students.length;
  const studentLabel = count === 1 ? '1 student' : `${count} students`;
  const mediaConsent = registration.mediaConsent === true ? 'Granted for every student in this registration.' : 'Not granted.';
  const rosterText = registration.students.map((student, index) => `${index + 1}. ${student.firstName} ${student.lastName} — Grade ${student.grade} — ${student.school}`).join('\n');
  const rows = registration.students.map((student) => `<tr><td style="padding:12px;border-bottom:1px solid #dedfd3">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</td><td style="padding:12px;border-bottom:1px solid #dedfd3">${student.grade}</td><td style="padding:12px;border-bottom:1px solid #dedfd3">${escapeHtml(student.school)}</td></tr>`).join('');
  const rosterHtml = `<table style="width:100%;table-layout:fixed;border-collapse:collapse;text-align:left;font-size:13px;overflow-wrap:anywhere;word-break:break-word"><thead><tr style="background:#f8f7f0"><th style="padding:12px">Student</th><th style="padding:12px">Grade</th><th style="padding:12px">School</th></tr></thead><tbody>${rows}</tbody></table>`;
  const eventText = `Competition: ${site.name}\nOrganizer: ${site.organizer}\nFormat: ${site.format}\nDate: ${site.date}\nTime: ${site.time}\nLocation: ${site.location}\nPhoto and media permission: ${mediaConsent}`;
  const eventHtml = `<p><strong>${escapeHtml(site.name)}</strong><br>Format: ${escapeHtml(site.format)}<br>Date: ${escapeHtml(site.date)}<br>Time: ${escapeHtml(site.time)}<br>Location: ${escapeHtml(site.location)}</p><p><strong>Photo and media permission:</strong> ${mediaConsent}</p>`;
  const url = donationLink(site.donationUrl);
  const paymentText = `Payment is pending school confirmation. This email confirms registration, not payment.\nPayment amount: ${site.fee}\n${site.donationInstructions}\n${url ? `School donation page: ${url}` : 'The school donation link will be provided by the organizer.'}\nUse reference ${registration.reference} if the payment page has a notes field. Keep the school receipt.`;
  const paymentHtml = `<div style="background:#f8f7f0;padding:20px;border:1px solid #dedfd3;border-radius:10px;margin:24px 0"><h2 style="font-size:18px;margin-top:0">Next: payment through the school</h2><p>Payment is pending school confirmation. This email confirms registration, not payment.</p><p>Payment amount: <strong>${escapeHtml(site.fee)}</strong></p><p>${escapeHtml(site.donationInstructions)}</p>${url ? `<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#244c3b;color:white;padding:12px 18px;border-radius:6px;text-decoration:none">Continue to school donation page →</a></p>` : '<p>The school donation link will be provided by the organizer.</p>'}<p>Use reference <strong>${escapeHtml(registration.reference)}</strong> if the payment page has a notes field. Keep the school receipt.</p></div>`;
  const wrap = (heading, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head><body style="margin:0;background:#f8f7f0;font-family:Arial,sans-serif;color:#273a30;line-height:1.65"><div style="max-width:640px;margin:30px auto;padding:30px;background:#fffefb;border:1px solid #dedfd3;border-radius:16px"><p style="font-size:12px;font-weight:bold;color:#244c3b">${escapeHtml(site.organizer)}</p><h1 style="font-family:Georgia,serif;font-size:32px;line-height:1.15">${escapeHtml(heading)}</h1>${body}<p style="border-top:1px solid #dedfd3;padding-top:18px;font-size:12px;color:#677067">Questions or corrections? Contact <a href="mailto:${escapeHtml(organizerEmail)}">${escapeHtml(organizerEmail)}</a> and include your registration reference.</p></div></body></html>`;
  const refHtml = `<p style="background:#e7edb3;border-radius:8px;padding:16px">Registration reference: <strong>${escapeHtml(registration.reference)}</strong><br>${studentLabel} · One reference covers the whole registration.</p>`;
  const parentText = `Hello ${registration.contactName},\n\nYour registration for ${studentLabel} has been received.\nReference: ${registration.reference}\n\n${rosterText}\n\n${eventText}\n\n${paymentText}\n\nOnly first names, last initials, and grades appear on the public participant list.\nFor questions or corrections, contact ${organizerEmail} with your reference.\n\n${site.organizer}`;
  const organizerText = `New registration for ${studentLabel}.\nReference: ${registration.reference}\nContact: ${registration.contactName}\nEmail: ${registration.email}\n\n${rosterText}\n\n${eventText}\n\nPayment status: pending school confirmation. Match the reference against school donation records.\nReview private records in the Netlify Forms dashboard.\n\n${site.organizer}`;
  return [
    { role: 'parent', message: { from, to: [registration.email], reply_to: organizerEmail, subject: `${site.name} registration received — ${registration.reference}`, text: parentText, html: wrap('Registration received.', `<p>Hello ${escapeHtml(registration.contactName)},</p><p>Thank you for registering ${studentLabel}.</p>${refHtml}${rosterHtml}${eventHtml}${paymentHtml}<p style="font-size:12px;color:#677067">Only first names, last initials, and grades appear on the public participant list.</p>`) } },
    { role: 'organizer', message: { from, to: [organizerEmail], reply_to: registration.email, subject: `New ${site.name} registration — ${registration.reference}`, text: organizerText, html: wrap('A new registration is ready.', `${refHtml}<p>Contact: <strong>${escapeHtml(registration.contactName)}</strong><br>Email: <a href="mailto:${escapeHtml(registration.email)}">${escapeHtml(registration.email)}</a></p>${rosterHtml}${eventHtml}<p><strong>Payment status: pending school confirmation.</strong><br>Match this reference against the school's donation records.</p><p><a href="https://app.netlify.com/">Open the private Netlify Forms dashboard →</a></p>`) } }
  ];
}

export async function sendRegistrationEmail({ message, role, reference, apiKey, fetcher = fetch, pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  const recipientHash = createHash('sha256').update(message.to[0].toLowerCase()).digest('hex').slice(0, 20);
  const key = `math-registration/${reference}/${role}/${recipientHash}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let retry = true;
    try {
      const response = await fetcher('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(message) });
      const result = await response.json().catch(() => null);
      if (response.ok && typeof result?.id === 'string') return { role, id: result.id };
      retry = response.status === 429 || response.status >= 500 || (response.status === 409 && result?.name === 'concurrent_idempotent_requests');
    } catch { /* A network timeout may follow acceptance; reuse the same key. */ }
    if (!retry || attempt === 2) throw new Error(`Registration email request failed for ${role}.`);
    await pause(500 * (2 ** attempt));
  }
}

export function createNotificationHandler({ site, readEnvironment = () => process.env, fetcher = fetch, pause, logger = console } = {}) {
  return async (event) => {
    if (!site.registrationEmailsEnabled) return { skipped: 'disabled' };
    const registration = emailRegistration(event?.data);
    if (!registration) return { skipped: 'unrelated-or-invalid-registration' };
    const env = readEnvironment();
    if (!env.RESEND_API_KEY) throw new Error('Registration email service is not configured.');
    const emails = registrationEmails(registration, site, { organizerEmail: env.REGISTRATION_ORGANIZER_EMAIL || site.contactEmail, fromEmail: env.REGISTRATION_FROM_EMAIL || site.senderEmail || site.contactEmail });
    // Separate messages protect recipient privacy and isolate delivery failures.
    const outcomes = await Promise.allSettled(emails.map(({ role, message }) => sendRegistrationEmail({ message, role, reference: registration.reference, apiKey: env.RESEND_API_KEY, fetcher, pause })));
    const failedRoles = outcomes.flatMap((result, index) => result.status === 'rejected' ? [emails[index].role] : []);
    if (failedRoles.length) {
      logger.error('Registration notification failed.', { reference: registration.reference, failedRoles });
      throw new Error(`Registration notification failed for ${failedRoles.join(' and ')}.`);
    }
    logger.info('Registration notifications accepted by email provider.', { reference: registration.reference });
    return { accepted: outcomes.map((result) => result.value.role) };
  };
}
