import { describe, expect, it } from 'vitest';
import {
  checkInToRow,
  checkInsFromRows,
  pollStateFromRow,
  pollStateToRow,
  votesFromRows,
  walkInsFromRows,
} from './supabaseMapping.js';

describe('supabase row mapping', () => {
  it('maps check-in rows to the shared state shape', () => {
    expect(
      checkInsFromRows([
        { guest_id: 'G1', checked_in: true, at: '2026-11-20T15:00:00.000Z' },
        { guest_id: 'G2', checked_in: false, at: null },
        { guest_id: 'G3', checked_in: 'maybe', at: null },
      ]),
    ).toEqual({
      G1: { checkedIn: true, at: '2026-11-20T15:00:00.000Z' },
      G2: { checkedIn: false, at: null },
    });
  });

  it('round-trips a check-in through a row', () => {
    const row = checkInToRow('G1', { checkedIn: true, at: '2026-11-20T15:00:00.000Z' });
    expect(row).toMatchObject({ guest_id: 'G1', checked_in: true, at: '2026-11-20T15:00:00.000Z' });
    expect(checkInsFromRows([row])).toEqual({
      G1: { checkedIn: true, at: '2026-11-20T15:00:00.000Z' },
    });
  });

  it('unwraps walk-ins and drops malformed ones', () => {
    expect(walkInsFromRows([{ data: { id: 'w1', name: 'A' } }, { data: null }])).toEqual([
      { id: 'w1', name: 'A' },
    ]);
  });

  it('maps the poll state row both ways, with safe defaults', () => {
    const row = { active_poll_id: 'poll-1', is_open: true, voting_round: 'r1' };
    expect(pollStateFromRow(row)).toEqual({
      activePollId: 'poll-1',
      isOpen: true,
      votingRound: 'r1',
    });
    expect(pollStateToRow(pollStateFromRow(row))).toEqual(row);
    expect(pollStateFromRow(undefined)).toEqual({
      activePollId: null,
      isOpen: false,
      votingRound: 'initial',
    });
  });

  it('counts vote rows per poll and option, ignoring bad rows', () => {
    expect(
      votesFromRows([
        { poll_id: 'p1', option_index: 1 },
        { poll_id: 'p1', option_index: 1 },
        { poll_id: 'p1', option_index: 0 },
        { poll_id: 'p2', option_index: 2 },
        { poll_id: 'p2', option_index: -1 },
        { poll_id: null, option_index: 0 },
      ]),
    ).toEqual({ p1: [1, 2], p2: [0, 0, 1] });
  });
});
