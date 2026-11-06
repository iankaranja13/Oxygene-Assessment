import { describe, expect, it } from 'vitest';
import { normalizeGuests } from './normalizeGuests.js';
import { searchGuests, tokenize } from './search.js';

const { guests } = normalizeGuests([
  { id: '1', name: 'Grace Wambui', organization: 'Safaricom', checkInCode: 'OXY-1001' },
  { id: '2', name: 'Grace Wambui', organization: 'Equity Bank', checkInCode: 'OXY-1002' },
  { id: '3', name: 'José Núñez', organization: 'Andela', checkInCode: 'OXY-1049' },
  { id: '4', name: 'Mercy Gracewell', organization: 'iHub', checkInCode: 'OXY-2000' },
  { id: '5', name: 'Daniel Otieno', organization: 'Graceland Ltd', checkInCode: 'OXY-1490' },
  { id: '6', name: 'Amina Ali', organization: 'Andela' },
  { id: '7', name: 'Aaron Abel', organization: 'Sendy', checkInCode: 'OXY-10490' },
]);

const ids = (result) => result.results.map((guest) => guest.id);

describe('tokenize', () => {
  it('folds case, accents and spacing into words', () => {
    expect(tokenize('  José   NÚÑEZ ')).toEqual(['jose', 'nunez']);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('searchGuests', () => {
  it('returns nothing for an empty or blank query', () => {
    expect(searchGuests(guests, '')).toEqual({ results: [], totalMatches: 0 });
    expect(searchGuests(guests, '    ')).toEqual({ results: [], totalMatches: 0 });
  });

  it('ignores case, accents and extra spaces', () => {
    expect(ids(searchGuests(guests, 'jose nunez'))).toEqual(['3']);
    expect(ids(searchGuests(guests, '  JOSÉ  '))).toEqual(['3']);
  });

  it('searches organizations', () => {
    expect(ids(searchGuests(guests, 'andela'))).toEqual(['6', '3']);
  });

  it('matches words in any order across fields', () => {
    expect(ids(searchGuests(guests, 'equity grace'))).toEqual(['2']);
  });

  it('finds codes typed in any format', () => {
    for (const query of ['OXY-1049', 'oxy1049', 'oxy 1049', '1049']) {
      expect(ids(searchGuests(guests, query))[0]).toBe('3');
    }
  });

  it('puts an exact code match before partial code matches', () => {
    // "1049" also appears inside OXY-10490, and "Aaron" sorts first alphabetically,
    // but the exact code match must still come first.
    expect(ids(searchGuests(guests, '1049'))).toEqual(['3', '7']);
  });

  it('ranks names starting with the query before other matches', () => {
    // Both Graces (name starts), then Gracewell (a name word starts), then Graceland (org).
    expect(ids(searchGuests(guests, 'grace'))).toEqual(['1', '2', '4', '5']);
  });

  it('returns every match for duplicate names so the usher can choose', () => {
    expect(searchGuests(guests, 'grace wambui').totalMatches).toBe(2);
  });

  it('limits results but reports the full count', () => {
    const result = searchGuests(guests, 'a', { limit: 2 });
    expect(result.results).toHaveLength(2);
    expect(result.totalMatches).toBeGreaterThan(2);
  });

  it('returns nothing when no guest matches', () => {
    expect(searchGuests(guests, 'zzz')).toEqual({ results: [], totalMatches: 0 });
  });
});
