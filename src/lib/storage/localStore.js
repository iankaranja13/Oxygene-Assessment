// The shared-state store backed by localStorage. This is one implementation of the store
// interface the UI uses; a Supabase implementation with the same methods comes later, so
// screens never know (or care) where the data lives.
//
// Store interface:
//   getState()            -> SharedState (same object until something changes, for React)
//   subscribe(listener)   -> unsubscribe function; listener runs after every change
//   setCheckIn(guestId, record), addWalkIn(walkIn), castVote(pollId, optionIndex),
//   setPollState(changes) (merged into the current poll state), resetAll()
//                         -> Promise<{ ok: true } | { ok: false, error: string }>
// Actions are async because a network-backed store has to be.

import { browserLocalStorage } from './safeStorage.js';
import {
  EMPTY_SHARED_STATE,
  addVote,
  createVotingRound,
  sanitizeCheckIns,
  sanitizePollState,
  sanitizeVotes,
  sanitizeWalkIns,
} from './sharedState.js';

/** Each part of the state lives under its own key, with its own validator. */
export const SLICES = Object.freeze({
  checkIns: { key: 'check-ins', sanitize: sanitizeCheckIns },
  walkIns: { key: 'walk-ins', sanitize: sanitizeWalkIns },
  pollState: { key: 'poll-state', sanitize: sanitizePollState },
  votes: { key: 'votes', sanitize: sanitizeVotes },
});

export const STORE_ERRORS = Object.freeze({
  NOT_SAVED:
    "This browser wouldn't save the change. It's shown here but may be lost if the page reloads.",
  POLL_CLOSED: 'Voting is closed for this poll.',
  INVALID_OPTION: "That answer isn't one of the options.",
});

const OK = Object.freeze({ ok: true });

/**
 * @param {{ storage?: ReturnType<import('./safeStorage.js').createSafeStorage> }} [options]
 *   Injectable so tests can use an in-memory or deliberately broken storage.
 */
export function createLocalStore({ storage = browserLocalStorage } = {}) {
  const listeners = new Set();
  let state = readAllSlices(EMPTY_SHARED_STATE);

  /** Reads every slice. The fallback (current memory) is used if storage is unreadable. */
  function readAllSlices(fallback) {
    const next = {};
    for (const [name, { key, sanitize }] of Object.entries(SLICES)) {
      next[name] = sanitize(storage.readJson(key, fallback[name]));
    }
    return next;
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  /**
   * Read-modify-write for one slice. It re-reads storage first so a change made in
   * another tab moments ago isn't overwritten. If saving fails, memory still updates so
   * the screen stays usable, and the caller gets an error to show.
   */
  function updateSlice(name, change) {
    const { key, sanitize } = SLICES[name];
    const latest = sanitize(storage.readJson(key, state[name]));
    const next = change(latest);
    const saved = storage.writeJson(key, next);
    state = { ...state, [name]: next };
    notify();
    return saved ? OK : { ok: false, error: STORE_ERRORS.NOT_SAVED };
  }

  return {
    getState() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async setCheckIn(guestId, record) {
      return updateSlice('checkIns', (checkIns) => ({ ...checkIns, [guestId]: record }));
    },

    async addWalkIn(walkIn) {
      return updateSlice('walkIns', (walkIns) => [...walkIns, walkIn]);
    },

    async castVote(pollId, optionIndex) {
      if (!Number.isInteger(optionIndex) || optionIndex < 0) {
        return { ok: false, error: STORE_ERRORS.INVALID_OPTION };
      }
      // Check the latest poll state, not this tab's copy: the organizer may have just closed it.
      const pollState = sanitizePollState(storage.readJson(SLICES.pollState.key, state.pollState));
      if (pollState.activePollId !== pollId || !pollState.isOpen) {
        return { ok: false, error: STORE_ERRORS.POLL_CLOSED };
      }
      return updateSlice('votes', (votes) => addVote(votes, pollId, optionIndex));
    },

    /** Merges changes, e.g. { isOpen: false }, so the voting round is never lost. */
    async setPollState(changes) {
      return updateSlice('pollState', (pollState) =>
        sanitizePollState({ ...pollState, ...changes }),
      );
    },

    /** Clears everything and starts a new voting round, so every device may vote again. */
    async resetAll() {
      const freshState = {
        ...EMPTY_SHARED_STATE,
        pollState: { ...EMPTY_SHARED_STATE.pollState, votingRound: createVotingRound() },
      };
      let allSaved = true;
      for (const [name, { key }] of Object.entries(SLICES)) {
        // Write empty values (rather than deleting keys) so other tabs see the change.
        allSaved = storage.writeJson(key, freshState[name]) && allSaved;
      }
      state = freshState;
      notify();
      return allSaved ? OK : { ok: false, error: STORE_ERRORS.NOT_SAVED };
    },
  };
}
