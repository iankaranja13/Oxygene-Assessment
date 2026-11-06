import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORE_ERRORS } from './localStore.js';
import { createSupabaseStore } from './supabaseStore.js';

const CHECKED_IN = { checkedIn: true, at: '2026-11-20T15:00:00.000Z' };

/**
 * A tiny stand-in for the Supabase client: every query resolves to { data, error }.
 * `tables` provides rows for reads; `failWrites` makes every write fail.
 */
function createFakeClient({ tables = {}, failWrites = false, rpcResults = {} } = {}) {
  const writes = [];
  function from(table) {
    let isWrite = false;
    const query = {
      select: () => query,
      order: () => query,
      eq: () => query,
      upsert: (row) => ((isWrite = true), writes.push(['upsert', table, row]), query),
      insert: (row) => ((isWrite = true), writes.push(['insert', table, row]), query),
      update: (row) => ((isWrite = true), writes.push(['update', table, row]), query),
      then(resolve, reject) {
        const result =
          isWrite && failWrites
            ? { data: null, error: new Error('network down') }
            : { data: tables[table] ?? [], error: null };
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return query;
  }
  async function rpc(name, args) {
    writes.push(['rpc', name, args]);
    if (failWrites) return { data: null, error: new Error('network down') };
    return { data: rpcResults[name] ?? null, error: null };
  }
  return { from, rpc, writes };
}

describe('createSupabaseStore', () => {
  afterEach(() => vi.restoreAllMocks());

  it('saves a check-in and shows it immediately', async () => {
    const client = createFakeClient();
    const store = createSupabaseStore({ client });
    const pending = store.setCheckIn('G1', CHECKED_IN);
    expect(store.getState().checkIns).toEqual({ G1: CHECKED_IN }); // optimistic
    expect(await pending).toEqual({ ok: true });
    expect(client.writes[0]).toEqual([
      'upsert',
      'check_ins',
      expect.objectContaining({ guest_id: 'G1', checked_in: true }),
    ]);
  });

  it('rolls back and reports an error when the server is unreachable', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createSupabaseStore({ client: createFakeClient({ failWrites: true }) });
    const result = await store.setCheckIn('G1', CHECKED_IN);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/couldn't reach the server/i);
    expect(store.getState().checkIns).toEqual({});
  });

  it('reports a closed poll when the database rejects the vote', async () => {
    const store = createSupabaseStore({
      client: createFakeClient({ rpcResults: { cast_vote: 'closed' } }),
    });
    expect(await store.castVote('poll-1', 0)).toEqual({
      ok: false,
      error: STORE_ERRORS.POLL_CLOSED,
    });
  });

  it('refreshes the counts after an accepted vote', async () => {
    const client = createFakeClient({
      rpcResults: { cast_vote: 'ok' },
      tables: { votes: [{ poll_id: 'poll-1', option_index: 1 }] },
    });
    const store = createSupabaseStore({ client });
    expect(await store.castVote('poll-1', 1)).toEqual({ ok: true });
    expect(store.getState().votes).toEqual({ 'poll-1': [0, 1] });
  });

  it('merges poll changes and resets with a new voting round', async () => {
    const client = createFakeClient();
    const store = createSupabaseStore({ client });
    await store.setPollState({ activePollId: 'poll-2', isOpen: true });
    expect(store.getState().pollState).toMatchObject({ activePollId: 'poll-2', isOpen: true });

    const roundBefore = store.getState().pollState.votingRound;
    expect(await store.resetAll()).toEqual({ ok: true });
    expect(store.getState().pollState.activePollId).toBeNull();
    expect(store.getState().pollState.votingRound).not.toBe(roundBefore);
    expect(client.writes.at(-1)).toEqual([
      'rpc',
      'reset_demo',
      { p_voting_round: expect.any(String) },
    ]);
  });
});
