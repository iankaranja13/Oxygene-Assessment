import { describe, expect, it } from 'vitest';
import { ROUTES } from './constants.js';
import {
  ROUTE_ROLES,
  STAFF_ROLES,
  canAccess,
  roleForPin,
  staffRoutesForRole,
} from './staffAccess.js';

const PINS = { [STAFF_ROLES.USHER]: '1111', [STAFF_ROLES.ORGANIZER]: '9999' };

describe('roleForPin', () => {
  it('recognises each role by its PIN, ignoring spaces', () => {
    expect(roleForPin(' 1111 ', PINS)).toBe(STAFF_ROLES.USHER);
    expect(roleForPin('9999', PINS)).toBe(STAFF_ROLES.ORGANIZER);
  });

  it('rejects wrong or empty PINs', () => {
    for (const input of ['1234', '', '   ', undefined, null]) {
      expect(roleForPin(input, PINS)).toBeNull();
    }
  });

  it('prefers organizer if both PINs were configured the same', () => {
    expect(roleForPin('5555', { usher: '5555', organizer: '5555' })).toBe(STAFF_ROLES.ORGANIZER);
  });
});

describe('canAccess', () => {
  it('lets ushers into check-in but not the dashboard', () => {
    expect(canAccess(STAFF_ROLES.USHER, ROUTE_ROLES[ROUTES.usher])).toBe(true);
    expect(canAccess(STAFF_ROLES.USHER, ROUTE_ROLES[ROUTES.organizer])).toBe(false);
  });

  it('lets organizers in everywhere', () => {
    expect(canAccess(STAFF_ROLES.ORGANIZER, ROUTE_ROLES[ROUTES.usher])).toBe(true);
    expect(canAccess(STAFF_ROLES.ORGANIZER, ROUTE_ROLES[ROUTES.organizer])).toBe(true);
  });

  it('keeps everyone else out', () => {
    expect(canAccess(null, STAFF_ROLES.USHER)).toBe(false);
    expect(canAccess('attendee', STAFF_ROLES.USHER)).toBe(false);
  });
});

describe('staffRoutesForRole', () => {
  it('gives ushers check-in only, organizers the dashboard and check-in, others nothing', () => {
    expect(staffRoutesForRole(STAFF_ROLES.USHER)).toEqual([ROUTES.usher]);
    expect(staffRoutesForRole(STAFF_ROLES.ORGANIZER)).toEqual([ROUTES.organizer, ROUTES.usher]);
    expect(staffRoutesForRole(null)).toEqual([]);
  });
});
