import { describe, expect, it } from 'vitest';
import rawGuests from '../../data/guests.json';
import { normalizeGuests } from './normalizeGuests.js';
import { SIGN_IN_KINDS, identifySignIn } from './signIn.js';
import { STAFF_PINS, STAFF_ROLES } from './staffAccess.js';

const PINS = { [STAFF_ROLES.USHER]: '1111', [STAFF_ROLES.ORGANIZER]: '9999' };

describe('identifySignIn', () => {
  it('recognises staff PINs', () => {
    expect(identifySignIn(' 1111 ', PINS)).toEqual({ kind: 'staff', role: STAFF_ROLES.USHER });
    expect(identifySignIn('9999', PINS)).toEqual({ kind: 'staff', role: STAFF_ROLES.ORGANIZER });
  });

  it('treats anything else as a guest code, normalized', () => {
    expect(identifySignIn('oxy 1049', PINS)).toEqual({ kind: 'guest-code', code: 'OXY-1049' });
    expect(identifySignIn('1049', PINS)).toEqual({ kind: 'guest-code', code: 'OXY-1049' });
  });

  it('reports empty input', () => {
    expect(identifySignIn('   ', PINS).kind).toBe(SIGN_IN_KINDS.EMPTY);
  });

  it('never lets a real guest code collide with the staff PINs', () => {
    // If a guest's code matched a PIN, that guest would be signed in as staff.
    const { guests } = normalizeGuests(rawGuests);
    const guestCodes = new Set(guests.map((guest) => guest.checkInCode));
    for (const pin of Object.values(STAFF_PINS)) {
      expect(guestCodes.has(`OXY-${pin}`)).toBe(false);
    }
  });
});
