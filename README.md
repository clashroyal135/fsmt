# Fulton Science Math Tournament website

A custom website designed for Netlify, with general information, news, FAQs, registration, a public participant list, grade counts, and payment through the school's donation website. No third-party package installation is needed.

## Preview locally

Use Node.js 22 or newer:

```powershell
node scripts/preview.mjs
```

Open the printed `http://127.0.0.1:4173` URL. The local preview allows the form and confirmation flow to be tried using sample details. It does **not** submit or save registrations, send emails, fabricate participant counts, or enable payment. Its HTTP server rejects POST requests. Stop it with Ctrl+C.

## Publish information through Codex

Public event settings, news articles, and FAQs are in `dist/content.js`. Ask Codex to update that file and redeploy the site. Articles support a title, category, optional date (`YYYY-MM-DD`), summary, and paragraphs. The news section displays articles in file order, so put the latest first.

### Past tournaments

The **Past tournaments** page (`#past-tournaments`) is linked from the navigation, homepage, and footer. The 2025 entry is ready for last year's photos, results, and awards. Empty sections show “coming soon”; no sample winners or photos are published.

Edit `pastTournaments` in `dist/content.js` to add content:

- Each year has `year`, `title`, `summary`, `photos`, `results`, and `awards`. Add another entry for another year; the page shows the newest year first.
- Put photo files in `dist/assets/tournaments/2025/`. Each `photos` entry has `src` (for example `/assets/tournaments/2025/team-photo.jpg`), descriptive `alt` text, and an optional `caption`. JPEG, PNG, and WebP are supported. Photos open at full size in a new tab.
- Each `results` entry has `category` (round or grade), `placement`, `participant` (the public student or team display name), and an optional `score`. The score column appears only when scores are provided.
- Each `awards` entry has `title`, `recipient` (the public display name), and an optional `description`.

Use photos and student display names authorized for publication for that tournament; this year's media consent does not establish permission for last year's photos. These archive entries are public content, separate from private registration records. Run `node scripts/check.mjs` before deploying; it also checks photo paths, files, and alt text.

The Fulton Science Math Tournament is organized by Fulton Science Academy Mu Alpha Theta and features Individual, Team, and Relay rounds for grades 3–5. It takes place on October 31, 2026, rescheduled from October 10 due to Hurricane Isaias, at Fulton Science Academy, 3035 Fanfare Way, Alpharetta, GA 30009. The fee is $25 per person or $100 for a group of 4. The schedule, registration deadline, and donation URL still need to be supplied; detailed round rules have not yet been announced.

## Registration and public display

Parents can register 1–4 students in one submission. Four students registered together automatically form a competition team; for registrations of 1–3 students, the organizer helps form a team. The shared registration record preserves the submitted group for organizers.

1. The static `math-registration` form supports individual registrations and groups of 2–4 students. Each student has their own first/last names, grade, and school. Netlify Forms stores all selected student fields, the student count, registration type, one shared parent/guardian/authorized contact name and email, permission acknowledgment, one group reference, and pending-payment status. The additional student slots are present in the HTML for Netlify form detection, but hidden and disabled until selected; inactive slots are excluded from the submission.
2. Authorized organizers sign in to their **Netlify project → Forms → math-registration** to review full records and download a CSV. The website does not contain a public endpoint for full records.
3. The server function at `/api/registrations` reads verified form submissions privately and returns only `{ firstName, lastInitial, grade }`, total student count, counts for grades 3/4/5, and an update timestamp. A group of four generates four public entries and increments each student's grade count. Older single-student records remain supported. Invalid group sizes and incomplete groups are excluded rather than partially published.
4. The public participant page refreshes about once a minute. Server results are cached for 30 seconds and may also be cached by Netlify for 30 seconds. Updates can take around one to two minutes. Spam-held submissions appear after verification. Removing an entry or moving it to spam updates the public list after cache expiration. To correct an entry, remove the original and have the parent submit a corrected registration; this setup does not offer in-place editing of Netlify submission fields.
5. A form retry keeps the same registration reference. The public list counts that group once, including all its students; Netlify may retain multiple raw submissions with that reference. Review duplicates in the private dashboard before reconciling payments. To cancel or correct one member of a stored group, remove the original group submission and have the authorized contact resubmit the corrected roster.

Parents acknowledge the public name/grade display before submitting. School information, parent details, full last names, references, and payment status are excluded from the public API. Never put tokens or private registration exports in `dist/`.

Photo and media permission is a separate, optional checkbox, unchecked by default. It covers every student in the registration and requires parent or guardian permission for each student. It allows the organizer to take tournament photos/videos and publish them on school or tournament websites, social media, newsletters, and promotional materials. Families may register without granting it. The form stores `media-consent` as `yes` or `no`, displays the choice during review, and includes it in both confirmation emails. A missing field on older records means permission was not granted. This field is private and never appears in the public roster. Organizers must check it before taking or publishing media and coordinate any changes directly with the registration contact.

## Deploy on Netlify

Connect this repository to a Netlify project and use its `netlify.toml` settings:

- Build command: `node scripts/check.mjs`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Node version: 22

Use a repository deployment or the Netlify CLI so the server function deploys with the website. A drag-and-drop upload of `dist` alone does not include the public-registration function.

Keep registration closed for the initial deployment. In Netlify, open **Forms → Enable form detection**, then redeploy so Netlify detects `math-registration`. Confirm the form exists before enabling registration.

Add these environment variables in Netlify's settings. Select the **Functions** scope when your plan supports limiting variable scopes; on plans without scope controls, keep the variables server-side and never copy them into the public build:

- `NETLIFY_FORMS_TOKEN`: A Netlify personal access token created by the authorized organizer account. Keep it server-side. Prefer an organizer account with access limited to this project where your Netlify plan supports that arrangement.
- `REGISTRATION_FORM_ID`: The ID of the detected `math-registration` form. This can be obtained using Netlify's API (`GET /api/v1/sites/{project_id}/forms`) from a trusted environment; do not place the token in a browser URL, source file, or chat message.

Redeploy after configuring runtime variables. Empty configuration deliberately returns an unavailable status rather than fake counts. The token is used only by the server function and is never returned to the browser.

Grant dashboard access only to the organizing team using the platform's account controls. The custom notification function below already sends the organizer email; enabling Netlify's built-in email notification to the same address would create an additional organizer message.

When event details are final, update `dist/content.js`:

```js
registrationOpen: true,
registrationEmailsEnabled: true, // Only after sender verification and a hosted delivery test.
date: 'The confirmed event date',
location: 'The confirmed venue',
deadline: 'The confirmed registration deadline',
fee: '$25 per student', // Example only: use the school-approved amount.
donationUrl: 'https://the-school.example/donate', // Replace with the actual school URL.
contactEmail: 'organizer@the-school.example', // Replace with the actual contact.
```

The check script prevents opening registration with missing event/payment/contact details or disabled automatic email delivery. Redeploy, submit one authorized test registration on the hosted site, confirm it appears in the private dashboard, verify that the public page shows only the intended fields, and check both email inboxes. This final hosted test requires connected Netlify and Resend accounts; local tests do not prove form detection, persistence, or actual inbox delivery.

## Automatic registration emails

The school organizer is **Fulton Science Academy Mu Alpha Theta**, and the organizer notification address is **fsmt@fultonscienceacademy.org**. The proposed sender is `Fulton Science Academy Mu Alpha Theta <fsmt@fultonscienceacademy.org>`, subject to school domain verification. Parent replies go to the organizer; organizer replies go to the registration contact.

`netlify/functions/registration-notifications.mjs` subscribes to Netlify's `formSubmitted` platform event. Netlify verifies event signatures, and the function exposes no public HTTP mail endpoint. Only the marked math registration form, a complete group of 1–4 students, a valid reference/email, and parent/guardian permission acknowledgment are eligible. Emails are triggered after Netlify verifies the submission through its spam checks. A spam-held registration does not trigger mail until verified.

Each eligible registration produces two separate messages through **Resend**:

- The shared parent/guardian/group contact receives the student roster, event details, shared reference, school donation instructions/link, and an explicit statement that payment is pending confirmation.
- The school organizer receives the roster, shared contact, reference, and pending payment status, with a private dashboard link.

No CC list is used. Messages for other groups are never included. Resend processes recipients and message contents to deliver these transactional emails; the website privacy notice discloses this. User-provided text is escaped in HTML, only HTTPS donation links are allowed, and API keys and provider error bodies are excluded from logs.

To activate delivery:

1. Have the school authorize and verify the sending domain in Resend using its required DNS records. If the school prefers a dedicated subdomain, use a verified sender address on that subdomain and keep replies directed to `fsmt@fultonscienceacademy.org`.
2. Create a **sending-only Resend API key**, restricted to the verified sender domain where supported. Store it in Netlify settings; do not paste it into chat or public source.
3. Set `RESEND_API_KEY`. Optionally set `REGISTRATION_FROM_EMAIL` to the verified bare sender address and `REGISTRATION_ORGANIZER_EMAIL` to override the organizer recipient. Both default to the configured public organizer contact address.
4. Set `registrationEmailsEnabled: true` in `dist/content.js`, then redeploy. Verify both messages with an authorized test before opening registration to families.

Sending failures are independent: a parent error does not prevent the organizer request. The function retries temporary provider/network failures up to three attempts and throws if either recipient request still fails. Netlify background invocation retries can then retry the event. All attempts reuse separate recipient-specific Resend idempotency keys, which suppress duplicate sends for **24 hours**. This is not a permanent exactly-once guarantee; a manual replay after that window can send another message.

Provider acceptance is not proof of inbox delivery. Use Resend's delivery/bounce records and Netlify's function logs to investigate failed messages. A prolonged outage after the retry window requires organizer follow-up. The registration remains saved even if email delivery fails, so families should keep their reference.

To review sample emails without sending anything:

```powershell
node scripts/preview-emails.mjs
```

This writes fictional four-student HTML/text previews to `artifacts/emails/`. While the local preview server is running, open `/email-preview/parent.html` and `/email-preview/organizer.html`. These routes exist only in the local preview server and are excluded from the published website.

## School donation payment

The site saves the registration first, shows its shared group reference, then offers a button to the configured HTTPS school donation page. It does not pass student/contact information to that URL or add unsupported query parameters. If the school supports a payment notes field, ask families to include the registration reference. The organizer matches school receipts to registration references. Groups follow the school's payment instructions for all included students; this website does not invent a group discount or payment amount.

Redirecting to the school is not proof of payment. Every registration is initially marked `pending-school-confirmation`, and the public list does not claim that participants have paid. Payment verification is handled using the school's records. A future automatic payment check would require integration support from the school's donation provider.

## Checks

```powershell
node scripts/check.mjs
```

This validates JavaScript syntax, public content, registration-open configuration, the HTML form contract (including all four static student slots), and the privacy/API/email tests. Tests cover group counts and limits, older single records, public field projection, pagination, caching/removal, email recipient isolation, HTML escaping, address validation, missing configuration, stable retry keys, transient failure retries, and failure reporting without private data. Email tests use mocked requests; they do not send email.

Primary integration references: [Netlify Forms setup](https://docs.netlify.com/manage/forms/setup/), [private submissions and CSV export](https://docs.netlify.com/manage/forms/submissions/), [Forms API](https://www.netlify.com/blog/2021/12/17/handling-form-submissions-via-the-netlify-api/), [API pagination](https://docs.netlify.com/api-and-cli-guides/api-guides/get-started-with-api/), [Functions routing](https://docs.netlify.com/build/functions/configuration/), [signed form events](https://docs.netlify.com/build/functions/trigger-on-events/), [Resend sender verification](https://resend.com/docs/dashboard/domains/introduction), [Resend send API](https://resend.com/docs/api-reference/emails/send-email), [24-hour duplicate suppression](https://resend.com/docs/dashboard/emails/idempotency-keys).
