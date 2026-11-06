import { describe, expect, it } from 'vitest';
import {
  CODE_OUTCOMES,
  countCheckIns,
  createCheckInRecord,
  getCheckInStatus,
  resolveCodeEntry,
} from './checkIn.js';

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

describe('createCheckInRecord', () => {
  it('records the current time', () => {
    expect(createCheckInRecord(new Date('2026-11-20T15:00:00.000Z'))).toEqual({
      checkedIn: true,
      at: '2026-11-20T15:00:00.000Z',
    });
  });
});

describe('resolveCodeEntry', () => {
  const withStatus = (id, code, checkedIn = false) => ({
    id,
    checkInCode: code,
    status: { checkedIn, at: null },
  });
  const guests = [
    withStatus('a', 'OXY-1001'),
    withStatus('b', 'OXY-1002', true),
    withStatus('c', 'OXY-1252'),
    withStatus('d', 'OXY-1252'),
    withStatus('e', null),
  ];
  const resolve = (input) => resolveCodeEntry(guests, input);

  it('is empty when nothing usable was typed', () => {
    expect(resolve('  ').outcome).toBe(CODE_OUTCOMES.EMPTY);
    expect(resolve('--').outcome).toBe(CODE_OUTCOMES.EMPTY);
  });

  it('finds a single guest ready to check in, whatever the code format', () => {
    for (const input of ['1001', 'oxy1001', ' OXY-1001 ']) {
      const result = resolve(input);
      expect(result.outcome).toBe(CODE_OUTCOMES.READY);
      expect(result.guests.map((guest) => guest.id)).toEqual(['a']);
    }
  });

  it('reports a guest who is already checked in', () => {
    expect(resolve('1002').outcome).toBe(CODE_OUTCOMES.ALREADY_CHECKED_IN);
  });

  it('reports codes nobody has', () => {
    expect(resolve('9999')).toEqual({
      outcome: CODE_OUTCOMES.NOT_FOUND,
      code: 'OXY-9999',
      guests: [],
    });
  });

  it('refuses to guess when guests share a code', () => {
    const result = resolve('1252');
    expect(result.outcome).toBe(CODE_OUTCOMES.AMBIGUOUS);
    expect(result.guests.map((guest) => guest.id)).toEqual(['c', 'd']);
  });
});
