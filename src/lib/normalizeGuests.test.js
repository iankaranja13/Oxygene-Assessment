import { describe, expect, it } from 'vitest';
import rawGuests from '../../data/guests.json';
import {
  GUEST_FLAGS,
  NO_ORGANIZATION,
  SKIP_REASONS,
  TICKET_TYPES,
  UNNAMED_GUEST,
  normalizeCheckInCode,
  normalizeGuests,
  normalizeSeedCheckIn,
  normalizeTicketType,
} from './normalizeGuests.js';

const validGuest = {
  id: 'G1',
  name: 'Amina Hassan',
  organization: 'Safaricom',
  ticketType: 'VIP',
  checkInCode: 'OXY-1001',
};

describe('normalizeCheckInCode', () => {
  it.each([
    ['OXY-1049', 'OXY-1049'],
    ['oxy-1049', 'OXY-1049'],
    ['OXY1049', 'OXY-1049'],
    [' OXY 1049 ', 'OXY-1049'],
    ['1049', 'OXY-1049'],
    [1049, 'OXY-1049'],
  ])('converts %j to %s', (input, expected) => {
    expect(normalizeCheckInCode(input)).toBe(expected);
  });

  it('returns null when there is no code', () => {
    for (const input of ['', '   ', null, undefined, '---']) {
      expect(normalizeCheckInCode(input)).toBeNull();
    }
  });

  it('keeps unfamiliar formats in a comparable form', () => {
    expect(normalizeCheckInCode('vip-a7')).toBe('VIPA7');
  });
});

describe('normalizeTicketType', () => {
  it.each([
    ['vip', 'VIP'],
    ['VIP ', 'VIP'],
    ['Vip', 'VIP'],
    ['GA', 'General'],
    ['general admission', 'General'],
    ['press', 'Press'],
  ])('maps %j to %s', (input, expected) => {
    expect(normalizeTicketType(input)).toEqual({ ticketType: expected, isKnown: true });
  });

  it('uses "Unspecified" rather than guessing when the type is missing', () => {
    expect(normalizeTicketType(undefined).ticketType).toBe(TICKET_TYPES.UNSPECIFIED);
    expect(normalizeTicketType('  ').ticketType).toBe(TICKET_TYPES.UNSPECIFIED);
  });

  it('keeps unknown types but marks them unknown', () => {
    expect(normalizeTicketType('platinum')).toEqual({ ticketType: 'Platinum', isKnown: false });
  });
});

describe('normalizeSeedCheckIn', () => {
  it('accepts true, "yes" and a valid timestamp', () => {
    expect(normalizeSeedCheckIn(true, '2026-11-20T17:45:00+03:00')).toEqual({
      checkedIn: true,
      at: '2026-11-20T14:45:00.000Z',
    });
    expect(normalizeSeedCheckIn('yes', undefined)).toEqual({ checkedIn: true, at: null });
  });

  it('treats a bad timestamp as "checked in, time unknown"', () => {
    expect(normalizeSeedCheckIn(true, 'not a date')).toEqual({ checkedIn: true, at: null });
  });

  it('defaults to not checked in', () => {
    expect(normalizeSeedCheckIn(undefined, undefined)).toEqual({ checkedIn: false, at: null });
  });
});

describe('normalizeGuests', () => {
  it('never throws on data that is not a list', () => {
    for (const input of [null, undefined, 'guests', { guests: [] }, 42]) {
      const { guests, report } = normalizeGuests(input);
      expect(guests).toEqual([]);
      expect(report.error).toMatch(/not a list/);
    }
  });

  it('cleans a valid record into the standard shape', () => {
    const { guests } = normalizeGuests([
      { ...validGuest, name: '  AMINA   HASSAN ', checkInCode: 'oxy1001' },
    ]);
    expect(guests[0]).toMatchObject({
      id: 'G1',
      name: 'Amina Hassan',
      organization: 'Safaricom',
      ticketType: 'VIP',
      checkInCode: 'OXY-1001',
      seedCheckIn: { checkedIn: false, at: null },
      flags: [],
    });
    expect(guests[0].searchText).toContain('amina hassan');
    expect(guests[0].searchText).toContain('oxy1001');
  });

  it('fills safe defaults and flags missing fields', () => {
    const { guests } = normalizeGuests([
      { checkInCode: 'OXY-2000', organization: 'N/A' },
      { name: 'No Code Person' },
    ]);
    expect(guests[0].name).toBe(UNNAMED_GUEST);
    expect(guests[0].organization).toBe(NO_ORGANIZATION);
    expect(guests[0].ticketType).toBe(TICKET_TYPES.UNSPECIFIED);
    expect(guests[0].flags).toEqual(
      expect.arrayContaining([GUEST_FLAGS.MISSING_NAME, GUEST_FLAGS.MISSING_ORGANIZATION]),
    );
    expect(guests[1].checkInCode).toBeNull();
    expect(guests[1].flags).toContain(GUEST_FLAGS.MISSING_CODE);
  });

  it('reads alternative field names from other export formats', () => {
    const { guests } = normalizeGuests([
      { full_name: 'Baraka Omondi', org: 'iHub', ticket_type: 'press', code: 'OXY-3000' },
    ]);
    expect(guests[0]).toMatchObject({
      name: 'Baraka Omondi',
      organization: 'iHub',
      ticketType: 'Press',
      checkInCode: 'OXY-3000',
    });
  });

  it('skips unusable records and says why', () => {
    const { guests, report } = normalizeGuests([null, 'a string', {}, validGuest]);
    expect(guests).toHaveLength(1);
    expect(report.skipped).toEqual([
      { index: 0, reason: SKIP_REASONS.NOT_AN_OBJECT },
      { index: 1, reason: SKIP_REASONS.NOT_AN_OBJECT },
      { index: 2, reason: SKIP_REASONS.NO_NAME_OR_CODE },
    ]);
  });

  it('merges records that are identical after cleaning', () => {
    const { guests, report } = normalizeGuests([
      validGuest,
      { ...validGuest, id: 'G2', name: 'AMINA HASSAN ' },
    ]);
    expect(guests).toHaveLength(1);
    expect(guests[0].id).toBe('G1');
    expect(report.mergedDuplicates).toBe(1);
  });

  it('keeps a check-in recorded only on the duplicate', () => {
    const { guests } = normalizeGuests([validGuest, { ...validGuest, checkedIn: true }]);
    expect(guests[0].seedCheckIn.checkedIn).toBe(true);
  });

  it('keeps but flags different guests who share a code or a name', () => {
    const { guests, report } = normalizeGuests([
      validGuest,
      { ...validGuest, id: 'G2', name: 'Someone Else' },
      { ...validGuest, id: 'G3', organization: 'Equity Bank', checkInCode: 'OXY-1002' },
    ]);
    expect(guests).toHaveLength(3);
    expect(guests[0].flags).toEqual([GUEST_FLAGS.SHARED_CODE, GUEST_FLAGS.SAME_NAME]);
    expect(guests[1].flags).toEqual([GUEST_FLAGS.SHARED_CODE]);
    expect(guests[2].flags).toEqual([GUEST_FLAGS.SAME_NAME]);
    expect(report.sharedCodeGroups).toBe(1);
    expect(report.sameNameGroups).toBe(1);
  });

  it('generates unique, repeatable ids when ids are missing or clash', () => {
    const input = [
      { name: 'Joy Moyo', checkInCode: 'OXY-4000' },
      { ...validGuest, id: 'G1' },
      { ...validGuest, id: 'G1', name: 'Different Person', checkInCode: 'OXY-4001' },
    ];
    const first = normalizeGuests(input).guests.map((guest) => guest.id);
    const second = normalizeGuests(input).guests.map((guest) => guest.id);
    expect(first).toEqual(['guest-oxy-4000', 'G1', 'G1-2']);
    expect(second).toEqual(first);
  });
});

describe('normalizeGuests with the sample data file', () => {
  const { guests, report } = normalizeGuests(rawGuests);

  it('loads every usable guest without crashing', () => {
    expect(report.totalRecords).toBe(152);
    expect(report.skipped).toHaveLength(3);
    expect(report.mergedDuplicates).toBe(3);
    expect(guests).toHaveLength(152 - 3 - 3);
  });

  it('gives every guest a unique id and the same shape', () => {
    expect(new Set(guests.map((guest) => guest.id)).size).toBe(guests.length);
    for (const guest of guests) {
      expect(typeof guest.name).toBe('string');
      expect(guest.name.length).toBeGreaterThan(0);
      expect(typeof guest.organization).toBe('string');
      const isKnownType = Object.values(TICKET_TYPES).includes(guest.ticketType);
      expect(isKnownType).toBe(!guest.flags.includes(GUEST_FLAGS.UNKNOWN_TICKET_TYPE));
    }
  });

  it('flags the shared code and the two different Grace Wambuis', () => {
    const sharedCode = guests.filter((guest) => guest.checkInCode === 'OXY-1252');
    expect(sharedCode).toHaveLength(2);
    sharedCode.forEach((guest) => expect(guest.flags).toContain(GUEST_FLAGS.SHARED_CODE));

    const graces = guests.filter((guest) => guest.name === 'Grace Wambui');
    expect(graces).toHaveLength(2);
    graces.forEach((guest) => expect(guest.flags).toContain(GUEST_FLAGS.SAME_NAME));
  });
});
