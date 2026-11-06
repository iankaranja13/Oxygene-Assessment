// Staff PIN logic. This is a deterrent that keeps attendees out of staff screens,
// NOT security: the PIN ships inside the JavaScript bundle. See docs/DECISIONS.md (D8).

const DEFAULT_STAFF_PIN = '2026';
const STAFF_UNLOCKED_KEY = 'launchpad:v1:staff-unlocked';
const UNLOCKED_VALUE = 'true';

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

// sessionStorage can throw (e.g. Safari private mode, storage disabled), so failures
// fall back to "locked": the worst case is the usher re-enters the PIN.

/** @returns {boolean} whether staff screens were unlocked earlier in this browser session */
export function readStaffUnlocked() {
  try {
    return window.sessionStorage.getItem(STAFF_UNLOCKED_KEY) === UNLOCKED_VALUE;
  } catch (error) {
    console.warn('Could not read staff session flag:', error);
    return false;
  }
}

/** @param {boolean} unlocked */
export function writeStaffUnlocked(unlocked) {
  try {
    if (unlocked) {
      window.sessionStorage.setItem(STAFF_UNLOCKED_KEY, UNLOCKED_VALUE);
    } else {
      window.sessionStorage.removeItem(STAFF_UNLOCKED_KEY);
    }
  } catch (error) {
    console.warn('Could not save staff session flag:', error);
  }
}
