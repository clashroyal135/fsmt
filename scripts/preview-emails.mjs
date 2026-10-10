import { mkdir, writeFile } from 'node:fs/promises';
import { site } from '../dist/content.js';
import { emailRegistration, registrationEmails } from '../netlify/functions/lib/registration-emails.mjs';

// Synthetic data only. This script renders files and never sends email.
const sample = {
  'registration-purpose': 'math-competition', 'registration-reference': 'FSMT-FALL2026-012345ABCDEF',
  'parent-consent': 'yes', 'student-count': '4', 'parent-name': 'Sample Family Contact', email: 'parent@example.org',
  'student-first-name': 'Avery', 'student-last-name': 'Johnson', grade: '3', school: 'Sample School',
  'student-2-first-name': 'Blake', 'student-2-last-name': 'Smith', 'student-2-grade': '3', 'student-2-school': 'Sample School',
  'student-3-first-name': 'Casey', 'student-3-last-name': 'Brown', 'student-3-grade': '4', 'student-3-school': 'Sample School',
  'student-4-first-name': 'Drew', 'student-4-last-name': 'Williams', 'student-4-grade': '5', 'student-4-school': 'Sample School'
};
const directory = new URL('../artifacts/emails/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const { role, message } of registrationEmails(emailRegistration(sample), site)) {
  const html = message.html.replace(/(<body[^>]*>)/, '$1<div style="text-align:center;background:#eeeaf3;color:#62517e;padding:12px;font:12px Arial,sans-serif">SAMPLE EMAIL PREVIEW · Fictional student details · Nothing has been sent</div>');
  await writeFile(new URL(`${role}.html`, directory), html, 'utf8');
  await writeFile(new URL(`${role}.txt`, directory), `SAMPLE ONLY — Nothing sent\nTo: ${message.to[0]}\nFrom: ${message.from}\nReply-To: ${message.reply_to}\nSubject: ${message.subject}\n\n${message.text}`, 'utf8');
}
console.log('Created sample parent and organizer email previews in artifacts/emails. No emails sent.');
