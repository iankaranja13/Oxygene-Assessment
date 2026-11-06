// Generates docs/poll-qr.png: a QR code attendees scan to open the live poll.
// Usage: node scripts/generate-poll-qr.mjs [url]   (defaults to the production URL)
import QRCode from 'qrcode';

const DEFAULT_POLL_URL = 'https://oxygene-assessment.vercel.app/poll';
const OUTPUT_PATH = 'docs/poll-qr.png';
const pollUrl = process.argv[2] ?? DEFAULT_POLL_URL;

await QRCode.toFile(OUTPUT_PATH, pollUrl, {
  width: 600, // large enough to print or project
  margin: 2,
  errorCorrectionLevel: 'M',
  color: { dark: '#14213d', light: '#ffffff' }, // brand ink on white: maximum contrast for scanners
});
console.log(`Saved ${OUTPUT_PATH} for ${pollUrl}`);
