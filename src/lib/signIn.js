// Decides who someone is from the single box on the welcome screen:
//   organizer PIN -> organizer, usher PIN -> usher, anything else -> a guest's check-in code.
// Staff PINs are checked first. A test guarantees no guest's code equals a staff PIN,
// so a guest can never be mistaken for staff.
import { normalizeCheckInCode } from './normalizeGuests.js';
import { STAFF_PINS, STAFF_ROLES, roleForPin } from './staffAccess.js';

export const SIGN_IN_KINDS = Object.freeze({
  EMPTY: 'empty',
  STAFF: 'staff',
  GUEST_CODE: 'guest-code',
});

/**
 * @param {string} input what was typed
 * @param {Record<string, string>} [pins] injectable for tests
 * @returns {{ kind: 'empty' } | { kind: 'staff', role: string } | { kind: 'guest-code', code: string }}
 *   A guest code still has to be verified by the store before it's accepted.
 */
export function identifySignIn(input, pins = STAFF_PINS) {
  const role = roleForPin(input, pins);
  if (role) {
    return { kind: SIGN_IN_KINDS.STAFF, role };
  }
  const code = normalizeCheckInCode(input);
  return code ? { kind: SIGN_IN_KINDS.GUEST_CODE, code } : { kind: SIGN_IN_KINDS.EMPTY };
}

/** Where each kind of person lands after signing in. */
export const HOME_ROUTE_FOR_ROLE = Object.freeze({
  [STAFF_ROLES.USHER]: '/usher',
  [STAFF_ROLES.ORGANIZER]: '/organizer',
});
