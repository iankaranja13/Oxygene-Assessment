// Loads the guest list from /data and runs it through normalization.
// Only staff screens import this file. Because those screens are lazy-loaded (App.jsx),
// the guest list ends up in a separate chunk that attendees on /poll never download.
// See docs/DECISIONS.md D11 and D27.
import rawGuests from '../../data/guests.json';
import { normalizeGuests } from '../lib/normalizeGuests.js';

const guestResult = normalizeGuests(rawGuests);

/** Clean guest records from the supplied list (walk-ins are added at runtime). */
export const SEED_GUESTS = guestResult.guests;

/** What normalization found: skipped rows, merged duplicates, clashes. Shown to organizers. */
export const GUEST_DATA_REPORT = guestResult.report;

if (import.meta.env.DEV) {
  // Handy during development: shows exactly what the data clean-up did.
  console.info('[LaunchPad] Guest data report', GUEST_DATA_REPORT);
}
