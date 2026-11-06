// Check-in rules, kept as pure functions so they can be tested without React or storage.

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
