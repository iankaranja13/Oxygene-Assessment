// Guest search: instant, case-insensitive, accent-insensitive, tolerant of extra spaces.
// About 200 guests means a simple scan on every keystroke takes well under a millisecond,
// so there is no index and no debounce (see docs/DECISIONS.md D15).

import { normalizeCheckInCode } from './normalizeGuests.js';
import { foldForSearch } from './text.js';

/** Caps how many cards render at once; the usher is told to keep typing beyond this. */
export const MAX_SEARCH_RESULTS = 50;

// Lower rank = shown first.
const RANK = Object.freeze({
  EXACT_CODE: 0,
  NAME_STARTS_WITH_QUERY: 1,
  NAME_WORD_STARTS_WITH_QUERY: 2,
  OTHER_MATCH: 3,
});

/**
 * Splits a query into folded words: "  José   NÚÑEZ " -> ["jose", "nunez"].
 * @param {string} query
 * @returns {string[]}
 */
export function tokenize(query) {
  return foldForSearch(query).split(' ').filter(Boolean);
}

/**
 * A guest matches when every word of the query appears somewhere in their name,
 * organization or code, in any order: "safaricom grace" finds Grace Wambui at Safaricom.
 */
function matchesAllTokens(guest, tokens) {
  return tokens.every((token) => guest.searchText.includes(token));
}

function rankMatch(guest, foldedQuery, queryAsCode) {
  if (queryAsCode && guest.checkInCode === queryAsCode) return RANK.EXACT_CODE;
  const foldedName = foldForSearch(guest.name);
  if (foldedName.startsWith(foldedQuery)) return RANK.NAME_STARTS_WITH_QUERY;
  if (foldedName.split(' ').some((word) => word.startsWith(foldedQuery))) {
    return RANK.NAME_WORD_STARTS_WITH_QUERY;
  }
  return RANK.OTHER_MATCH;
}

/**
 * @template {{ name: string, checkInCode: string | null, searchText: string }} Guest
 * @param {Guest[]} guests
 * @param {string} query
 * @param {{ limit?: number }} [options]
 * @returns {{ results: Guest[], totalMatches: number }}
 *   Best matches first: exact code, then names starting with the query, then the rest,
 *   alphabetically within each group. An empty query returns no results.
 */
export function searchGuests(guests, query, { limit = MAX_SEARCH_RESULTS } = {}) {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return { results: [], totalMatches: 0 };
  }

  const foldedQuery = tokens.join(' ');
  const queryAsCode = normalizeCheckInCode(query);

  const ranked = guests
    .filter((guest) => matchesAllTokens(guest, tokens))
    .map((guest) => ({ guest, rank: rankMatch(guest, foldedQuery, queryAsCode) }))
    .sort((a, b) => a.rank - b.rank || a.guest.name.localeCompare(b.guest.name));

  return {
    results: ranked.slice(0, limit).map(({ guest }) => guest),
    totalMatches: ranked.length,
  };
}
