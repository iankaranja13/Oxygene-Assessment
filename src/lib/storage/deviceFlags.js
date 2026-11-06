// Per-device memory of which polls this phone has voted in, used to prevent double voting.
// Deliberately always stored locally (even when votes go to Supabase): it describes this
// device, not the event. Clearing browser data clears it, a known, documented limitation.
import { browserLocalStorage } from './safeStorage.js';

const VOTED_POLLS_KEY = 'voted-polls';

function readVotedPollIds(storage) {
  const value = storage.readJson(VOTED_POLLS_KEY, []);
  return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : [];
}

/** @returns {boolean} */
export function hasVotedOnDevice(pollId, storage = browserLocalStorage) {
  return readVotedPollIds(storage).includes(pollId);
}

/** @returns {boolean} false if the flag couldn't be saved (storage blocked) */
export function markVotedOnDevice(pollId, storage = browserLocalStorage) {
  const votedPollIds = readVotedPollIds(storage);
  if (votedPollIds.includes(pollId)) return true;
  return storage.writeJson(VOTED_POLLS_KEY, [...votedPollIds, pollId]);
}

/** Used by "Reset demo data". */
export function clearVotedFlagsOnDevice(storage = browserLocalStorage) {
  return storage.remove(VOTED_POLLS_KEY);
}
