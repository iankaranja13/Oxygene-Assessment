// Staff PIN logic. This is a deterrent that keeps attendees out of staff screens,
// NOT security: the PIN ships inside the JavaScript bundle. See docs/DECISIONS.md (D8).
import { browserSessionStorage } from './storage/safeStorage.js';

const DEFAULT_STAFF_PIN = '2026';
// sessionStorage, so unlocking lasts until the tab is closed.
const STAFF_UNLOCKED_KEY = 'staff-unlocked';

/** The PIN comes from the VITE_STAFF_PIN env var at build time, with a demo default. */
export const STAFF_PIN = import.meta.env.VITE_STAFF_PIN || DEFAULT_STAFF_PIN;

/**
 * Compares a typed PIN with the expected one, ignoring surrounding spaces.
 * @param {string} input
 * @param {string} expected
 * @returns {boolean}
 */
export function isCorrectPin(input, expected) {
  return String(input ?? '').trim() === String(expected);
}

// If storage is blocked these fall back to "locked": the worst case is re-entering the PIN.

/** @returns {boolean} whether staff screens were unlocked earlier in this browser session */
export function readStaffUnlocked() {
  return browserSessionStorage.readJson(STAFF_UNLOCKED_KEY, false) === true;
}

/** @param {boolean} unlocked */
export function writeStaffUnlocked(unlocked) {
  if (unlocked) {
    browserSessionStorage.writeJson(STAFF_UNLOCKED_KEY, true);
  } else {
    browserSessionStorage.remove(STAFF_UNLOCKED_KEY);
  }
}
