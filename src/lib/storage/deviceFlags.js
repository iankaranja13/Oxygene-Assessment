// Per-device memory of how this phone voted, so it can show "You chose: X" after a
// reload without asking the server. The real one-vote rule is enforced by the store
// (per check-in code, in the database with Supabase); this is just a display cache.
//
// Entries are keyed by voting round, poll and check-in code. "Reset demo data" starts a
// new round, so old entries stop matching on every device. Two guests sharing a phone
// each get their own entry.
import { browserLocalStorage } from './safeStorage.js';

const DEVICE_VOTES_KEY = 'device-votes';

/** Stored when the server says this code already voted (e.g. from another phone). */
export const VOTED_ELSEWHERE = -1;

/** @param {{ votingRound: string, pollId: string, voterCode: string }} vote */
function voteKey({ votingRound, pollId, voterCode }) {
  return `${votingRound}/${pollId}/${voterCode}`;
}

/** @returns {Record<string, number>} only well-formed entries */
function readDeviceVotes(storage) {
  const value = storage.readJson(DEVICE_VOTES_KEY, {});
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, optionIndex]) => Number.isInteger(optionIndex)),
  );
}

/**
 * @param {{ votingRound: string, pollId: string, voterCode: string }} vote
 * @returns {number | null} the option chosen, VOTED_ELSEWHERE, or null if not voted
 */
export function getDeviceVote(vote, storage = browserLocalStorage) {
  return readDeviceVotes(storage)[voteKey(vote)] ?? null;
}

/** @returns {boolean} false if it couldn't be saved (storage blocked) */
export function recordDeviceVote(vote, optionIndex, storage = browserLocalStorage) {
  return storage.writeJson(DEVICE_VOTES_KEY, {
    ...readDeviceVotes(storage),
    [voteKey(vote)]: optionIndex,
  });
}

/** Used by "Reset demo data" to tidy up this device (other devices rely on the new round). */
export function clearDeviceVotes(storage = browserLocalStorage) {
  return storage.remove(DEVICE_VOTES_KEY);
}
