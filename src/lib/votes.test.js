import { describe, expect, it } from 'vitest';
import { POLL_VIEW_STATES, getPollViewState, tallyVotes, toPercentages } from './votes.js';

const poll = { id: 'p', question: 'Q?', options: ['A', 'B', 'C'] };

describe('getPollViewState', () => {
  it('shows "no poll" when nothing is active', () => {
    expect(getPollViewState({ activePoll: null, isOpen: true, hasVoted: false })).toBe(
      POLL_VIEW_STATES.NO_ACTIVE_POLL,
    );
  });

  it('shows the poll when it is open and this device has not voted', () => {
    expect(getPollViewState({ activePoll: poll, isOpen: true, hasVoted: false })).toBe(
      POLL_VIEW_STATES.OPEN,
    );
  });

  it('shows "closed" when voting is closed', () => {
    expect(getPollViewState({ activePoll: poll, isOpen: false, hasVoted: false })).toBe(
      POLL_VIEW_STATES.CLOSED,
    );
  });

  it('shows the thank-you once voted, whether open or closed', () => {
    for (const isOpen of [true, false]) {
      expect(getPollViewState({ activePoll: poll, isOpen, hasVoted: true })).toBe(
        POLL_VIEW_STATES.ALREADY_VOTED,
      );
    }
  });
});

describe('toPercentages', () => {
  it('always adds up to exactly 100', () => {
    expect(toPercentages([1, 1, 1])).toEqual([34, 33, 33]);
    expect(toPercentages([2, 1, 1, 3])).toEqual([29, 14, 14, 43]);
    for (const counts of [
      [7, 3, 5],
      [1, 2, 3, 4, 5, 6],
      [99, 1, 1],
    ]) {
      expect(toPercentages(counts).reduce((a, b) => a + b)).toBe(100);
    }
  });

  it('returns zeros when nobody has voted', () => {
    expect(toPercentages([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('gives 100 to a unanimous option', () => {
    expect(toPercentages([0, 5, 0])).toEqual([0, 100, 0]);
  });
});

describe('tallyVotes', () => {
  it('pairs each option with its count and percentage', () => {
    expect(tallyVotes(poll, [3, 1, 0])).toEqual({
      totalVotes: 4,
      options: [
        { label: 'A', count: 3, percent: 75 },
        { label: 'B', count: 1, percent: 25 },
        { label: 'C', count: 0, percent: 0 },
      ],
    });
  });

  it('treats missing counts as zero and ignores counts for unknown options', () => {
    expect(tallyVotes(poll, [2]).options.map((option) => option.count)).toEqual([2, 0, 0]);
    expect(tallyVotes(poll, [1, 1, 1, 50]).totalVotes).toBe(3);
    expect(tallyVotes(poll).totalVotes).toBe(0);
  });
});
