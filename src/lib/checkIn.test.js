import { describe, expect, it } from 'vitest';
import { countCheckIns, getCheckInStatus } from './checkIn.js';

const NOT_CHECKED_IN = { checkedIn: false, at: null };
const guest = (id, seedCheckIn = NOT_CHECKED_IN) => ({ id, seedCheckIn });

describe('getCheckInStatus', () => {
  it('uses the guest list status when nothing was recorded at the event', () => {
    expect(getCheckInStatus(guest('a'), {})).toEqual(NOT_CHECKED_IN);
    const early = { checkedIn: true, at: null };
    expect(getCheckInStatus(guest('b', early), {})).toEqual(early);
  });

  it('lets an event check-in (or undo) override the guest list', () => {
    const at = '2026-11-20T15:00:00.000Z';
    expect(getCheckInStatus(guest('a'), { a: { checkedIn: true, at } })).toEqual({
      checkedIn: true,
      at,
    });
    const early = { checkedIn: true, at: null };
    expect(getCheckInStatus(guest('b', early), { b: NOT_CHECKED_IN })).toEqual(NOT_CHECKED_IN);
  });
});

describe('countCheckIns', () => {
  it('counts and rounds the percentage', () => {
    const guests = [guest('a'), guest('b'), guest('c', { checkedIn: true, at: null })];
    expect(countCheckIns(guests, { a: { checkedIn: true, at: null } })).toEqual({
      checkedIn: 2,
      total: 3,
      percent: 67,
    });
  });

  it('handles an empty list without dividing by zero', () => {
    expect(countCheckIns([], {})).toEqual({ checkedIn: 0, total: 0, percent: 0 });
  });
});
