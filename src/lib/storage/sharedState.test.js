import { describe, expect, it } from 'vitest';
import {
  EMPTY_SHARED_STATE,
  INITIAL_VOTING_ROUND,
  addVote,
  sanitizeCheckIns,
  sanitizePollState,
  sanitizeVotes,
  sanitizeWalkIns,
} from './sharedState.js';

describe('sanitizers', () => {
  it('fall back to empty values for the wrong type', () => {
    expect(sanitizeCheckIns('oops')).toEqual({});
    expect(sanitizeWalkIns({})).toEqual([]);
    expect(sanitizePollState(null)).toEqual(EMPTY_SHARED_STATE.pollState);
    expect(sanitizeVotes([1, 2])).toEqual({});
  });

  it('drop malformed check-ins and bad timestamps', () => {
    expect(
      sanitizeCheckIns({
        a: { checkedIn: true, at: '2026-11-20T15:00:00.000Z' },
        b: { checkedIn: true, at: 'yesterday-ish' },
        c: { checkedIn: 'yes' },
        d: null,
      }),
    ).toEqual({
      a: { checkedIn: true, at: '2026-11-20T15:00:00.000Z' },
      b: { checkedIn: true, at: null },
    });
  });

  it('never reports a poll as open when none is selected', () => {
    expect(sanitizePollState({ activePollId: null, isOpen: true })).toEqual({
      activePollId: null,
      isOpen: false,
      votingRound: INITIAL_VOTING_ROUND,
    });
    expect(sanitizePollState({ activePollId: 'poll-1', isOpen: true }).isOpen).toBe(true);
  });

  it('keep a valid voting round and default a missing one', () => {
    expect(sanitizePollState({ votingRound: 'abc' }).votingRound).toBe('abc');
    expect(sanitizePollState({ votingRound: 42 }).votingRound).toBe(INITIAL_VOTING_ROUND);
  });

  it('replace invalid vote counts with zero', () => {
    expect(sanitizeVotes({ p: [3, -1, 'x', 2.5], q: 'nope' })).toEqual({ p: [3, 0, 0, 0] });
  });

  it('keep only walk-ins with an id', () => {
    expect(sanitizeWalkIns([{ id: 'w1', name: 'A' }, { name: 'B' }, null])).toEqual([
      { id: 'w1', name: 'A' },
    ]);
  });
});

describe('addVote', () => {
  it('increments the chosen option without mutating the input', () => {
    const before = { p: [1, 0] };
    const after = addVote(before, 'p', 1);
    expect(after).toEqual({ p: [1, 1] });
    expect(before).toEqual({ p: [1, 0] });
  });

  it('starts counts for a poll with no votes yet', () => {
    expect(addVote({}, 'p', 2)).toEqual({ p: [0, 0, 1] });
  });
});
