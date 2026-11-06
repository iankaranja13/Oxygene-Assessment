// Check-in rules, kept as pure functions so they can be tested without React or storage.
import { normalizeCheckInCode } from './normalizeGuests.js';

/** @typedef {import('./storage/sharedState.js').CheckInRecord} CheckInRecord */

/**
 * A guest's current status: a check-in recorded at the event (in shared state) wins;
 * otherwise we fall back to whatever the original guest list said.
 * @param {{ id: string, seedCheckIn: CheckInRecord }} guest
 * @param {Record<string, CheckInRecord>} checkIns shared-state overrides
 * @returns {CheckInRecord}
 */
export function getCheckInStatus(guest, checkIns) {
  return checkIns[guest.id] ?? guest.seedCheckIn;
}

/**
 * Counts checked-in guests for the dashboard and the usher header.
 * @returns {{ checkedIn: number, total: number, percent: number }} percent is 0 to 100, rounded
 */
export function countCheckIns(guests, checkIns) {
  const total = guests.length;
  const checkedIn = guests.filter((guest) => getCheckInStatus(guest, checkIns).checkedIn).length;
  const percent = total === 0 ? 0 : Math.round((checkedIn / total) * 100);
  return { checkedIn, total, percent };
}

/** The status that "undo check-in" restores for someone who wasn't checked in. */
export const NOT_CHECKED_IN = Object.freeze({ checkedIn: false, at: null });

/**
 * @param {Date} [now] injectable so tests get a predictable timestamp
 * @returns {CheckInRecord}
 */
export function createCheckInRecord(now = new Date()) {
  return { checkedIn: true, at: now.toISOString() };
}

/** Every possible result of typing a code at the door. */
export const CODE_OUTCOMES = Object.freeze({
  EMPTY: 'empty',
  NOT_FOUND: 'not-found',
  AMBIGUOUS: 'ambiguous',
  ALREADY_CHECKED_IN: 'already-checked-in',
  READY: 'ready',
});

/**
 * Decides what should happen when an usher types a code (standing in for a QR scan).
 * @param {{ checkInCode: string | null, status: CheckInRecord }[]} guests guests with status
 * @param {string} input whatever was typed: "1049", "oxy1049", "OXY-1049"...
 * @returns {{ outcome: string, code: string | null, guests: object[] }}
 *   READY / ALREADY_CHECKED_IN: exactly one guest. AMBIGUOUS: several share the code,
 *   so a person must choose: we never guess which guest to check in.
 */
export function resolveCodeEntry(guests, input) {
  const code = normalizeCheckInCode(input);
  if (!code) {
    return { outcome: CODE_OUTCOMES.EMPTY, code: null, guests: [] };
  }
  const matches = guests.filter((guest) => guest.checkInCode === code);
  if (matches.length === 0) {
    return { outcome: CODE_OUTCOMES.NOT_FOUND, code, guests: [] };
  }
  if (matches.length > 1) {
    return { outcome: CODE_OUTCOMES.AMBIGUOUS, code, guests: matches };
  }
  const outcome = matches[0].status.checkedIn
    ? CODE_OUTCOMES.ALREADY_CHECKED_IN
    : CODE_OUTCOMES.READY;
  return { outcome, code, guests: matches };
}
