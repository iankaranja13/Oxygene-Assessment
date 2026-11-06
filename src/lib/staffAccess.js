// Staff roles and PINs. Two roles:
//   usher:     check-in screen (and previewing the poll)
//   organizer: everything an usher can do, plus the dashboard (poll controls, reset)
// This is a DETERRENT, not security: both PINs ship inside the JavaScript bundle.
// Real protection needs server-side logins (see docs/DECISIONS.md D8, D27).
import { browserSessionStorage } from './storage/safeStorage.js';
import { ROUTES } from './constants.js';

export const STAFF_ROLES = Object.freeze({
  USHER: 'usher',
  ORGANIZER: 'organizer',
});

/** Display names for the header badge and messages. */
export const ROLE_LABELS = Object.freeze({
  [STAFF_ROLES.USHER]: 'Usher',
  [STAFF_ROLES.ORGANIZER]: 'Organizer',
});

// Higher rank can do everything a lower rank can.
const ROLE_RANK = Object.freeze({
  [STAFF_ROLES.USHER]: 1,
  [STAFF_ROLES.ORGANIZER]: 2,
});

const DEFAULT_USHER_PIN = '2026';
const DEFAULT_ORGANIZER_PIN = '4826';

/** PINs come from env vars at build time, with demo defaults. */
export const STAFF_PINS = Object.freeze({
  [STAFF_ROLES.USHER]: import.meta.env.VITE_USHER_PIN || DEFAULT_USHER_PIN,
  [STAFF_ROLES.ORGANIZER]: import.meta.env.VITE_ORGANIZER_PIN || DEFAULT_ORGANIZER_PIN,
});

// sessionStorage, so unlocking lasts until the tab is closed.
const STAFF_ROLE_KEY = 'staff-role';

/**
 * Works out which role a typed PIN unlocks, ignoring surrounding spaces.
 * @param {string} input
 * @param {Record<string, string>} [pins] injectable for tests
 * @returns {string | null} a STAFF_ROLES value, or null for a wrong PIN
 */
export function roleForPin(input, pins = STAFF_PINS) {
  const pin = String(input ?? '').trim();
  if (!pin) return null;
  // Check the organizer first, in case both PINs were configured the same.
  if (pin === String(pins[STAFF_ROLES.ORGANIZER])) return STAFF_ROLES.ORGANIZER;
  if (pin === String(pins[STAFF_ROLES.USHER])) return STAFF_ROLES.USHER;
  return null;
}

/**
 * @param {string | null} role the current role (null = not unlocked)
 * @param {string} requiredRole the minimum role a screen needs
 * @returns {boolean}
 */
export function canAccess(role, requiredRole) {
  return Boolean(role) && (ROLE_RANK[role] ?? 0) >= ROLE_RANK[requiredRole];
}

/** Which staff screens each route needs. Routes not listed are public (home, poll). */
export const ROUTE_ROLES = Object.freeze({
  [ROUTES.usher]: STAFF_ROLES.USHER,
  [ROUTES.organizer]: STAFF_ROLES.ORGANIZER,
});

/**
 * The staff screens a role may open, in navigation order. Ushers: check-in only.
 * Organizers: dashboard and check-in (they oversee the door too).
 * @returns {string[]} route paths
 */
export function staffRoutesForRole(role) {
  return [ROUTES.organizer, ROUTES.usher].filter((route) => canAccess(role, ROUTE_ROLES[route]));
}

/** @returns {string | null} the role saved earlier in this browser session, if still valid */
export function readStaffRole() {
  const role = browserSessionStorage.readJson(STAFF_ROLE_KEY, null);
  return Object.values(STAFF_ROLES).includes(role) ? role : null;
}

/** @param {string | null} role null locks the device */
export function writeStaffRole(role) {
  if (role) {
    browserSessionStorage.writeJson(STAFF_ROLE_KEY, role);
  } else {
    browserSessionStorage.remove(STAFF_ROLE_KEY);
  }
}
