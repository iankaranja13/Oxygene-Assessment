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
const VOTE_ACCEPTED = 'ok';
const CHANNEL_NAME = 'launchpad-shared-state';
const CHANNEL_FAILURES = ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'];

/** Which part of the shared state each table feeds. */
const TABLE_TO_SLICE = Object.freeze({
  check_ins: 'checkIns',
  walk_ins: 'walkIns',
  poll_state: 'pollState',
  votes: 'votes',
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

    async castVote(pollId, optionIndex) {
      if (!Number.isInteger(optionIndex) || optionIndex < 0) {
        return { ok: false, error: STORE_ERRORS.INVALID_OPTION };
      }
      try {
        // The database function checks the poll is active and open, then records the vote.
        const { data, error } = await client.rpc('cast_vote', {
          p_poll_id: pollId,
          p_option_index: optionIndex,
        });
        if (error) throw error;
        if (data !== VOTE_ACCEPTED) {
          return { ok: false, error: STORE_ERRORS.POLL_CLOSED };
        }
        await refreshSlice('votes');
        return OK;
      } catch (error) {
        console.warn('Vote failed:', error);
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
      };
      return saveOptimistically(freshState, async () => {
        const { error } = await client.rpc('reset_demo', { p_voting_round: votingRound });
        if (error) throw error;
      });
    },
  };
}
