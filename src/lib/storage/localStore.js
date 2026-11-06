// The shared-state store backed by localStorage. This is one implementation of the store
// interface the UI uses; a Supabase implementation with the same methods comes later, so
// screens never know (or care) where the data lives.
//
// Store interface:
//   getState()            -> SharedState (same object until something changes, for React)
//   subscribe(listener)   -> unsubscribe function; listener runs after every change,
//                            including changes made in other tabs of this browser
//   getConnectionStatus() -> one of CONNECTION_STATUS (see below)
//   setCheckIn(guestId, record), addWalkIn(walkIn),
//   castVote(pollId, optionIndex, voterCode), setPollState(changes) (merged into the
//   current poll state), createPoll(poll), deletePoll(pollId), resetAll()
//                         -> Promise<{ ok: true } | { ok: false, error: string }>
//   verifyAttendeeCode(code) -> Promise<{ ok: true, valid: boolean } | { ok: false, error }>
// Actions are async because a network-backed store has to be.

import { STORAGE_PREFIX, browserLocalStorage } from './safeStorage.js';
import {
  EMPTY_SHARED_STATE,
  addVote,
  createVotingRound,
  sanitizeCheckIns,
  sanitizeCustomPolls,
  sanitizePollState,
  sanitizeVotedCodes,
  sanitizeVotes,
  sanitizeWalkIns,
} from './sharedState.js';

/** Each part of the state lives under its own key, with its own validator. */
export const SLICES = Object.freeze({
  checkIns: { key: 'check-ins', sanitize: sanitizeCheckIns },
  walkIns: { key: 'walk-ins', sanitize: sanitizeWalkIns },
  pollState: { key: 'poll-state', sanitize: sanitizePollState },
  votes: { key: 'votes', sanitize: sanitizeVotes },
  customPolls: { key: 'custom-polls', sanitize: sanitizeCustomPolls },
  votedCodes: { key: 'voted-codes', sanitize: sanitizeVotedCodes },
});

// "Reset demo data" clears event activity but keeps polls the organizer prepared.
const SLICES_KEPT_ON_RESET = ['customPolls'];

export const STORE_ERRORS = Object.freeze({
  NOT_SAVED:
    "This browser wouldn't save the change. It's shown here but may be lost if the page reloads.",
  POLL_CLOSED: 'Voting is closed for this poll.',
  INVALID_OPTION: "That answer isn't one of the options.",
  INVALID_CODE: "We couldn't find that check-in code. Check your ticket, or ask an usher.",
  ALREADY_VOTED: 'This check-in code has already voted in this poll.',
  POLL_HAS_VOTES: 'This poll already has votes, so it can’t be deleted.',
  POLL_IS_ACTIVE: 'This poll is on attendees’ screens. Show a different poll first.',
});

/**
 * Local-mode check that a code belongs to a guest. It loads the guest list on demand
 * (a separate file), which is acceptable for a single-browser demo. With Supabase the
 * codes stay in the database and phones never receive them.
 */
async function isGuestCodeFromSeedData(code) {
  const { SEED_GUESTS } = await import('../../data/seedGuests.js');
  return SEED_GUESTS.some((guest) => guest.checkInCode === code);
}

const OK = Object.freeze({ ok: true });

/** Where shared data currently lives / whether it's syncing. Shown to staff in the UI. */
export const CONNECTION_STATUS = Object.freeze({
  LOCAL: 'local', // localStorage: syncs between tabs of this browser only
  CONNECTING: 'connecting', // network store: loading the first snapshot
  LIVE: 'live', // network store: connected and receiving updates
  OFFLINE: 'offline', // network store: lost connection; showing the last known data
});

const STORAGE_EVENT = 'storage';

/**
 * @param {object} [options]
 * @param {ReturnType<import('./safeStorage.js').createSafeStorage>} [options.storage]
 *   Injectable so tests can use an in-memory or deliberately broken storage.
 * @param {EventTarget | null} [options.eventTarget] where "storage" events arrive
 *   (window in the browser; a fake in tests; null to disable cross-tab sync).
 * @param {(code: string) => Promise<boolean>} [options.isGuestCode] checks attendee codes.
 */
export function createLocalStore({
  storage = browserLocalStorage,
  eventTarget = typeof window === 'undefined' ? null : window,
  isGuestCode = isGuestCodeFromSeedData,
} = {}) {
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

  // Cross-tab sync: the browser fires a "storage" event in every OTHER tab of this
  // browser when localStorage changes. We reload our copy and re-render.
  // (key === null means another tab cleared all storage.)
  const sliceKeys = Object.values(SLICES).map(({ key }) => `${STORAGE_PREFIX}${key}`);
  function handleStorageEvent(event) {
    if (event.key === null || sliceKeys.includes(event.key)) {
      state = readAllSlices(state);
      notify();
    }
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
      // Only listen for other tabs while something on screen cares.
      if (listeners.size === 0) eventTarget?.addEventListener(STORAGE_EVENT, handleStorageEvent);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          eventTarget?.removeEventListener(STORAGE_EVENT, handleStorageEvent);
        }
      };
    },

    getConnectionStatus() {
      return CONNECTION_STATUS.LOCAL;
    },

    async setCheckIn(guestId, record) {
      return updateSlice('checkIns', (checkIns) => ({ ...checkIns, [guestId]: record }));
    },

    async addWalkIn(walkIn) {
      return updateSlice('walkIns', (walkIns) => [...walkIns, walkIn]);
    },

    async verifyAttendeeCode(code) {
      return { ok: true, valid: Boolean(code) && (await isGuestCode(code)) };
    },

    /** One vote per check-in code per poll, only while that poll is active and open. */
    async castVote(pollId, optionIndex, voterCode) {
      if (!Number.isInteger(optionIndex) || optionIndex < 0) {
        return { ok: false, error: STORE_ERRORS.INVALID_OPTION };
      }
      if (!voterCode || !(await isGuestCode(voterCode))) {
        return { ok: false, error: STORE_ERRORS.INVALID_CODE };
      }
      // Check the latest poll state, not this tab's copy: the organizer may have just closed it.
      const pollState = sanitizePollState(storage.readJson(SLICES.pollState.key, state.pollState));
      if (pollState.activePollId !== pollId || !pollState.isOpen) {
        return { ok: false, error: STORE_ERRORS.POLL_CLOSED };
      }
      const votedCodes = sanitizeVotedCodes(
        storage.readJson(SLICES.votedCodes.key, state.votedCodes),
      );
      if (votedCodes[pollId]?.includes(voterCode)) {
        return { ok: false, error: STORE_ERRORS.ALREADY_VOTED };
      }
      updateSlice('votedCodes', (codes) => ({
        ...codes,
        [pollId]: [...(codes[pollId] ?? []), voterCode],
      }));
      return updateSlice('votes', (votes) => addVote(votes, pollId, optionIndex));
    },

    async createPoll(poll) {
      return updateSlice('customPolls', (polls) => [...polls, poll]);
    },

    /** Only polls with no votes that aren't on screen can be deleted, so no results are lost. */
    async deletePoll(pollId) {
      if (state.pollState.activePollId === pollId) {
        return { ok: false, error: STORE_ERRORS.POLL_IS_ACTIVE };
      }
      if ((state.votes[pollId] ?? []).some((count) => count > 0)) {
        return { ok: false, error: STORE_ERRORS.POLL_HAS_VOTES };
      }
      return updateSlice('customPolls', (polls) => polls.filter((poll) => poll.id !== pollId));
    },

    /** Merges changes, e.g. { isOpen: false }, so the voting round is never lost. */
    async setPollState(changes) {
      return updateSlice('pollState', (pollState) =>
        sanitizePollState({ ...pollState, ...changes }),
      );
    },

    /** Clears event activity and starts a new voting round, so everyone may vote again. */
    async resetAll() {
      const freshState = {
        ...EMPTY_SHARED_STATE,
        pollState: { ...EMPTY_SHARED_STATE.pollState, votingRound: createVotingRound() },
        customPolls: state.customPolls,
      };
      let allSaved = true;
      for (const [name, { key }] of Object.entries(SLICES)) {
        if (SLICES_KEPT_ON_RESET.includes(name)) continue;
        // Write empty values (rather than deleting keys) so other tabs see the change.
        allSaved = storage.writeJson(key, freshState[name]) && allSaved;
      }
      state = freshState;
      notify();
      return allSaved ? OK : { ok: false, error: STORE_ERRORS.NOT_SAVED };
    },
  };
}
