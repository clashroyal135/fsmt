# Fulton Science Math Tournament website

The website for the Fulton Science Math Tournament, organized by Fulton Science Academy Mu Alpha Theta. Students in grades 3–5 compete in Individual, Team, and Relay rounds on October 31, 2026 (rescheduled from October 10 due to Hurricane Isaias) at Fulton Science Academy, 3035 Fanfare Way, Alpharetta, GA 30009. The fee is $25 per person or $100 for a group of 4.

It is a static site hosted on Netlify: plain HTML, CSS, and JavaScript, with no packages to install. Registration happens on a **Google Form**, and payment happens on the school's GiveCampus donation page.

## Preview locally

Use Node.js 22 or newer:

```
node scripts/preview.mjs
```

Open the printed `http://127.0.0.1:4173` URL. Stop it with Ctrl+C.

## Editing site content

Everything families read (event details, the schedule, round rules, awards, the registration form link, the donation link, news, FAQs, past tournaments) lives in `dist/content.js`. Edit that file and redeploy. News articles support a title, category, optional date (`YYYY-MM-DD`), summary, and paragraphs, and are shown in file order, so put the latest first.

Key settings:

```js
registrationOpen: true,
registrationFormUrl: "https://forms.gle/QsQDTrrTADWsS3K49",
deadline: "October 29, 2026 at 11:59 PM",
fee: "$25 per person · $100 for a team of 4",
donationUrl: "https://www.givecampus.com/...",
contactEmail: "fsmt@fultonscienceacademy.org",
```

### Past tournaments

The **Past tournaments** page (`#past-tournaments`) is linked from the navigation, homepage, and footer. The 2025 entry is ready for last year's photos, results, and awards. Empty sections show "coming soon".

Edit `pastTournaments` in `dist/content.js`:

- Each year has `year`, `title`, `summary`, `photos`, `results`, and `awards`. The page shows the newest year first.
- Put photo files in `dist/assets/tournaments/2025/`. Each `photos` entry has `src` (for example `/assets/tournaments/2025/team-photo.jpg`), descriptive `alt` text, and an optional `caption`. JPEG, PNG, and WebP are supported.
- Each `results` entry has `category`, `placement`, `participant` (public display name), and an optional `score`.
- Each `awards` entry has `title`, `recipient` (public display name), and an optional `description`.

Only publish photos and names that are authorized for that tournament. This year's media permission does not cover last year's photos.

## Registration with Google Forms

The website's Registration page explains the three steps (fill out the form, check email, pay) and shows two buttons: **Open the registration form** (from `registrationFormUrl`) and **Continue to school donation page** (from `donationUrl`). If `registrationFormUrl` is empty, the page says the link is coming soon instead. Only `docs.google.com/forms/...` and `forms.gle/...` links are accepted.

### Building the form

Create the form in Google Forms. If you can, use the school's Google Workspace account rather than a personal one, since it collects children's information.

**Section 1: Registration contact**

- Form title: *Fulton Science Math Tournament Registration*
- Description: date, location, grades 3–5, fee ($25 per person, $100 for a group of 4), the deadline, and a note that four students registered together form a team, and the organizer helps smaller groups form a team.
- *Parent or guardian name* (short answer, required)
- The contact's email is collected automatically (see Form settings below).

**Section 2: Student 1**

- *First name* (short answer, required)
- *Last name* (short answer, required)
- *Grade* (multiple choice: 3, 4, 5, required)
- *School* (short answer, required)
- *Add another student?* (multiple choice, required). Open the question's ⋮ menu and choose **Go to section based on answer**:
  - "Yes, add another student" → Section 3 (Student 2)
  - "No, continue" → Section 6 (Permissions)

**Sections 3 and 4: Student 2, Student 3.** Use the section's ⋮ menu → **Duplicate section** to copy Student 1, rename it, and point "Yes" at the next student section and "No" at Permissions.

**Section 5: Student 4.** Same four questions, but no "Add another student?" question. Set "After section 5" to continue to the next section.

**Section 6: Permissions**

- *Permission* (checkboxes, required, one option): "I am a parent, guardian, or authorized group contact and have parent or guardian permission for every student in this registration."
- *Photo and media permission* (multiple choice, required):
  - "Yes, I give permission for every student in this registration for Fulton Science Academy Mu Alpha Theta to take photos and videos during the tournament and publish them on school or tournament websites, social media, newsletters, and promotional materials."
  - "No, I do not give photo and media permission."

  Add the description: "Optional. Students can participate either way."

### Form settings

In the **Settings** tab:

- **Responses → Collect email addresses: Responder input.** Families type their email; no Google account is needed.
- **Send responders a copy of their response: Always.** This is the confirmation email.
- **Allow response editing: On**, so families can fix mistakes.
- **Limit to 1 response: Off** (turning it on forces a Google sign-in).
- If the form is in a school account, turn **off** "Restrict to users in [school] and its trusted organizations", or outside parents will be blocked.
- **Presentation → Confirmation message:** "Thank you! Your registration was received and a copy was emailed to you. Next step: pay $25 per student or $100 for a group of 4 at https://www.givecampus.com/schools/FultonScienceAcademyPrivateSchool/events/fsmt-fall-2026 and put the parent or guardian name and student names in the notes field."

In the **Responses** tab:

- **Link to Sheets** to keep a spreadsheet of registrations.
- ⋮ → **Get email notifications for new responses** for the organizer notification.

### Connecting it to the website

1. Click **Send** → the link icon → check **Shorten URL** → **Copy**.
2. Paste it into `registrationFormUrl` in `dist/content.js`. Use the share link, not the editor link ending in `/edit`.
3. Run `node scripts/check.mjs` and redeploy.
4. Submit one test registration and confirm the receipt email arrives and the response appears in the Sheet. Then delete the test response.

### Closing registration

After the deadline, turn off **Accepting responses** in the form's Responses tab, and set `registrationOpen: false` in `dist/content.js`.

## Payment

Families pay on the school's donation page after registering. The website and form never collect card details, and nothing confirms payment automatically. Match each donation to a registration using the parent or guardian name and student names in the donation notes, using the school's records.

## Deploy on Netlify

Connect this repository to a Netlify project. `netlify.toml` sets:

- Build command: `node scripts/check.mjs`
- Publish directory: `dist`
- Node version: 22

There are no server functions or environment variables anymore. If the project still has `NETLIFY_FORMS_TOKEN`, `REGISTRATION_FORM_ID`, `RESEND_API_KEY`, `REGISTRATION_FROM_EMAIL`, or `REGISTRATION_ORGANIZER_EMAIL` set in Netlify, delete them, and revoke the Netlify personal access token that was created for the old setup. Download any existing submissions under **Forms → math-registration** as CSV before cleaning up.

## Checks

```
node scripts/check.mjs
```

This checks JavaScript syntax, the content settings (including that the form link is a Google Forms share link and that required event details are set while registration is open), past tournament photos, duplicate HTML ids, and that every page element the script uses exists in `index.html`.
