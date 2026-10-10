import { site } from '../../dist/content.js';
import { createNotificationHandler } from './lib/registration-emails.mjs';

// Netlify verifies platform-event signatures before invoking this handler.
// There is deliberately no public HTTP fetch handler for sending mail.
export default { formSubmitted: createNotificationHandler({ site }) };
