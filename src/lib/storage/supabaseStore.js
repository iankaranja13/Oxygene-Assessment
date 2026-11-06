// The shared-state store backed by Supabase, so check-ins and votes sync across devices.
// It has exactly the same methods as createLocalStore (see localStore.js), so no screen
// knows which one it is talking to. appStore.js picks one at startup.
//
// How it stays live:
//   1. On first use it loads a full snapshot of the four tables.
//   2. It subscribes to Supabase Realtime; when any row changes, it re-fetches that table.
//   3. If Realtime drops, a slow safety-net poll keeps data fresh until it reconnects.
// Writes are "optimistic": the screen updates immediately, then rolls back with an
// error message if the server rejects the change.
import { createClient } from '@supabase/supabase-js';
import { CONNECTION_STATUS, STORE_ERRORS } from './localStore.js';
import { EMPTY_SHARED_STATE, createVotingRound, sanitizePollState } from './sharedState.js';
import {
  checkInToRow,
  checkInsFromRows,
  customPollsFromRows,
  pollStateFromRow,
  pollStateToRow,
  votesFromRows,
  walkInsFromRows,
} from './supabaseMapping.js';

const NETWORK_ERROR =
  "Couldn't reach the server, so this wasn't saved. Check the connection and try again.";
const OK = Object.freeze({ ok: true });
const POLL_STATE_ROW_ID = 1;
const SAFETY_NET_POLL_MS = 15_000;
// What the database functions return, mapped to the same errors the local store uses.
const VOTE_RESULTS = Object.freeze({
  ok: null,
  closed: STORE_ERRORS.POLL_CLOSED,
  'invalid-code': STORE_ERRORS.INVALID_CODE,
  'already-voted': STORE_ERRORS.ALREADY_VOTED,
  'invalid-option': STORE_ERRORS.INVALID_OPTION,
});
const DELETE_POLL_RESULTS = Object.freeze({
  ok: null,
  active: STORE_ERRORS.POLL_IS_ACTIVE,
  'has-votes': STORE_ERRORS.POLL_HAS_VOTES,
});
const CHANNEL_NAME = 'launchpad-shared-state';
const CHANNEL_FAILURES = ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'];

/** Which part of the shared state each table feeds. */
const TABLE_TO_SLICE = Object.freeze({
  check_ins: 'checkIns',
  walk_ins: 'walkIns',
  poll_state: 'pollState',
  votes: 'votes',
  polls: 'customPolls',
});

/** Awaits a Supabase request and throws its error, so callers can use try/catch. */
async function rowsOf(request) {
  const { data, error } = await request;
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {{ url: string, key: string, client?: object }} options
 *   `client` is injectable for tests; normally it is created from the url and key.
 */
export function createSupabaseStore({ url, key, client = createClient(url, key) }) {
  const listeners = new Set();
  let state = EMPTY_SHARED_STATE;
  let hasLoaded = false;
  let isChannelLive = false;
  // Separate from "not live yet": only an actual failure should alarm staff with "Offline".
  let hasChannelFailed = false;
  let lastFetchFailed = false;
  let hasStarted = false;

  const fetchers = {
    checkIns: async () =>
      checkInsFromRows(await rowsOf(client.from('check_ins').select('guest_id, checked_in, at'))),
    walkIns: async () =>
      walkInsFromRows(await rowsOf(client.from('walk_ins').select('data').order('created_at'))),
    pollState: async () =>
      pollStateFromRow(
        (await rowsOf(client.from('poll_state').select('*').eq('id', POLL_STATE_ROW_ID)))[0],
      ),
    votes: async () =>
      votesFromRows(await rowsOf(client.from('votes').select('poll_id, option_index'))),
    customPolls: async () =>
      customPollsFromRows(
        await rowsOf(client.from('polls').select('id, question, options').order('created_at')),
      ),
  };

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function setState(changes) {
    state = { ...state, ...changes };
    notify();
  }

  async function refreshSlice(name) {
    try {
      const value = await fetchers[name]();
      lastFetchFailed = false;
      setState({ [name]: value });
    } catch (error) {
      console.warn(`Could not load ${name} from Supabase:`, error);
      lastFetchFailed = true;
      notify();
    }
  }

  async function refreshAll() {
    await Promise.all(Object.keys(fetchers).map(refreshSlice));
    hasLoaded = true;
    notify();
  }

  /** Connects once, the first time any screen subscribes. */
  function start() {
    hasStarted = true;
    const channel = client.channel(CHANNEL_NAME);
    for (const [table, slice] of Object.entries(TABLE_TO_SLICE)) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () =>
        refreshSlice(slice),
      );
    }
    channel.subscribe((channelStatus) => {
      if (channelStatus === 'SUBSCRIBED') {
        isChannelLive = true;
        hasChannelFailed = false;
        refreshAll(); // catch up on anything missed while disconnected
      } else if (CHANNEL_FAILURES.includes(channelStatus)) {
        isChannelLive = false;
        hasChannelFailed = true;
        notify();
      }
    });

    refreshAll();
    // Safety net: if Realtime is down, still pick up changes every few seconds.
    setInterval(() => {
      if (!isChannelLive) refreshAll();
    }, SAFETY_NET_POLL_MS);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', refreshAll);
    }
  }

  /** Calls a database function; returns its result, or throws on network/server error. */
  async function callFunction(name, args) {
    const { data, error } = await client.rpc(name, args);
    if (error) throw error;
    return data;
  }

  /**
   * Shows a change immediately, saves it, and rolls back if saving fails.
   * @param {object} optimisticChanges slices to show straight away
   * @param {() => Promise<void>} save throws on failure
   */
  async function saveOptimistically(optimisticChanges, save) {
    const previous = state;
    setState(optimisticChanges);
    try {
      await save();
      return OK;
    } catch (error) {
      console.warn('Supabase write failed:', error);
      state = previous;
      notify();
      return { ok: false, error: NETWORK_ERROR };
    }
  }

  return {
    getState() {
      return state;
    },

    subscribe(listener) {
      if (!hasStarted) start();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getConnectionStatus() {
      if (lastFetchFailed || hasChannelFailed) return CONNECTION_STATUS.OFFLINE;
      if (hasLoaded && isChannelLive) return CONNECTION_STATUS.LIVE;
      return CONNECTION_STATUS.CONNECTING;
    },

    async setCheckIn(guestId, record) {
      return saveOptimistically({ checkIns: { ...state.checkIns, [guestId]: record } }, () =>
        rowsOf(client.from('check_ins').upsert(checkInToRow(guestId, record))),
      );
    },

    async addWalkIn(walkIn) {
      return saveOptimistically({ walkIns: [...state.walkIns, walkIn] }, () =>
        rowsOf(client.from('walk_ins').insert({ id: walkIn.id, data: walkIn })),
      );
    },

    async verifyAttendeeCode(code) {
      try {
        // The database checks the private guest_codes table; the phone never sees it.
        return {
          ok: true,
          valid: (await callFunction('verify_attendee_code', { p_code: code })) === true,
        };
      } catch (error) {
        console.warn('Code check failed:', error);
        return { ok: false, error: NETWORK_ERROR };
      }
    },

    async castVote(pollId, optionIndex, voterCode) {
      if (!Number.isInteger(optionIndex) || optionIndex < 0) {
        return { ok: false, error: STORE_ERRORS.INVALID_OPTION };
      }
      try {
        // The database checks the code, that the poll is open, and one vote per code.
        const result = await callFunction('cast_vote', {
          p_poll_id: pollId,
          p_option_index: optionIndex,
          p_voter_code: voterCode,
        });
        const error = VOTE_RESULTS[result];
        if (error === undefined) throw new Error(`Unexpected vote result: ${result}`);
        if (error) return { ok: false, error };
        await refreshSlice('votes');
        return OK;
      } catch (error) {
        console.warn('Vote failed:', error);
        return { ok: false, error: NETWORK_ERROR };
      }
    },

    async createPoll(poll) {
      return saveOptimistically({ customPolls: [...state.customPolls, poll] }, () =>
        rowsOf(client.from('polls').insert(poll)),
      );
    },

    async deletePoll(pollId) {
      try {
        // The database refuses if the poll has votes or is on screen, so results are never lost.
        const result = await callFunction('delete_custom_poll', { p_poll_id: pollId });
        const error = DELETE_POLL_RESULTS[result];
        if (error === undefined) throw new Error(`Unexpected delete result: ${result}`);
        if (error) return { ok: false, error };
        await refreshSlice('customPolls');
        return OK;
      } catch (error) {
        console.warn('Delete poll failed:', error);
        return { ok: false, error: NETWORK_ERROR };
      }
    },

    async setPollState(changes) {
      const pollState = sanitizePollState({ ...state.pollState, ...changes });
      return saveOptimistically({ pollState }, () =>
        rowsOf(
          client.from('poll_state').update(pollStateToRow(pollState)).eq('id', POLL_STATE_ROW_ID),
        ),
      );
    },

    async resetAll() {
      const votingRound = createVotingRound();
      const freshState = {
        ...EMPTY_SHARED_STATE,
        pollState: { ...EMPTY_SHARED_STATE.pollState, votingRound },
        customPolls: state.customPolls, // prepared polls are kept
      };
      return saveOptimistically(freshState, () =>
        callFunction('reset_demo', { p_voting_round: votingRound }),
      );
    },
  };
}
