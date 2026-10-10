import { site } from './content.js';
document.querySelector('#complete-instructions').textContent = site.donationInstructions;
document.querySelector('#complete-fee').textContent = site.fee;
const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
try {
  const url = new URL(site.donationUrl);
  if (url.protocol === 'https:' && !url.username && !url.password && !local) {
    document.querySelector('#complete-donation').href = url.href;
    document.querySelector('#complete-donation').hidden = false;
    document.querySelector('#complete-unavailable').hidden = true;
  }
} catch { /* Keep the honest unavailable message when the school URL is missing. */ }
if (local) document.querySelector('#complete-unavailable').textContent = 'Payment is unavailable in this local preview.';
