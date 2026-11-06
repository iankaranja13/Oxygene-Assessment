// Per-device memory of how this phone voted, used to prevent double voting and to show
// "You chose: X" after a reload. Always stored locally (even when votes go to Supabase):
// it describes this device, not the event.
//
// Votes are remembered per voting round. "Reset demo data" starts a new round, so old
// entries stop matching on every device, including phones the organizer can't reach.
// Known limitation: clearing browser data (or a private window) allows another vote.
import { browserLocalStorage } from './safeStorage.js';

const DEVICE_VOTES_KEY = 'device-votes';

function voteKey(votingRound, pollId) {
  return `${votingRound}/${pollId}`;
}

/** @returns {Record<string, number>} only well-formed entries */
function readDeviceVotes(storage) {
  const value = storage.readJson(DEVICE_VOTES_KEY, {});
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, optionIndex]) => Number.isInteger(optionIndex)),
  );
}

/** @returns {number | null} the option this device chose, or null if it hasn't voted */
export function getDeviceVote(votingRound, pollId, storage = browserLocalStorage) {
  return readDeviceVotes(storage)[voteKey(votingRound, pollId)] ?? null;
}

/** @returns {boolean} false if the flag couldn't be saved (storage blocked) */
export function recordDeviceVote(votingRound, pollId, optionIndex, storage = browserLocalStorage) {
  const deviceVotes = readDeviceVotes(storage);
  return storage.writeJson(DEVICE_VOTES_KEY, {
    ...deviceVotes,
    [voteKey(votingRound, pollId)]: optionIndex,
  });
}

/** Used by "Reset demo data" to tidy up this device (other devices rely on the new round). */
export function clearDeviceVotes(storage = browserLocalStorage) {
  return storage.remove(DEVICE_VOTES_KEY);
}
