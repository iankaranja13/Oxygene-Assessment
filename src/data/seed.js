// Loads the guest list and poll questions from /data and runs them through normalization.
// The JSON is bundled into the app at build time (see docs/DECISIONS.md D11), so the
// guest list is available instantly and keeps working if venue Wi-Fi drops.
import rawGuests from '../../data/guests.json';
import rawPolls from '../../data/polls.json';
import { normalizeGuests } from '../lib/normalizeGuests.js';
import { normalizePolls } from '../lib/normalizePolls.js';

const guestResult = normalizeGuests(rawGuests);
const pollResult = normalizePolls(rawPolls);

/** Clean guest records from the supplied list (walk-ins are added at runtime). */
export const SEED_GUESTS = guestResult.guests;

/** What normalization found: skipped rows, merged duplicates, clashes. Shown to organizers. */
export const GUEST_DATA_REPORT = guestResult.report;

export const SEED_POLLS = pollResult.polls;
export const SKIPPED_POLLS = pollResult.skipped;

if (import.meta.env.DEV) {
  // Handy during development: shows exactly what the data clean-up did.
  console.info('[LaunchPad] Guest data report', GUEST_DATA_REPORT);
  if (SKIPPED_POLLS.length) console.warn('[LaunchPad] Skipped polls', SKIPPED_POLLS);
}
