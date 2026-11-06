import { describe, expect, it } from 'vitest';
import rawPolls from '../../data/polls.json';
import { normalizePolls } from './normalizePolls.js';

describe('normalizePolls', () => {
  it('loads the three sample polls', () => {
    const { polls, skipped } = normalizePolls(rawPolls);
    expect(polls).toHaveLength(3);
    expect(skipped).toEqual([]);
    expect(polls[0].options.length).toBeGreaterThanOrEqual(2);
  });

  it('cleans text and removes blank or repeated options', () => {
    const { polls } = normalizePolls([
      { id: 'p', question: '  Best   talk? ', options: ['Keynote', ' keynote ', '', 'Panel'] },
    ]);
    expect(polls[0]).toEqual({ id: 'p', question: 'Best talk?', options: ['Keynote', 'Panel'] });
  });

  it('skips polls without a question or with too few options', () => {
    const { polls, skipped } = normalizePolls([
      { id: 'a', options: ['Yes', 'No'] },
      { id: 'b', question: 'Only one?', options: ['Yes'] },
      null,
    ]);
    expect(polls).toEqual([]);
    expect(skipped.map((item) => item.index)).toEqual([0, 1, 2]);
  });

  it('generates missing ids and de-duplicates clashing ones', () => {
    const { polls } = normalizePolls([
      { question: 'One?', options: ['A', 'B'] },
      { id: 'x', question: 'Two?', options: ['A', 'B'] },
      { id: 'x', question: 'Three?', options: ['A', 'B'] },
    ]);
    expect(polls.map((poll) => poll.id)).toEqual(['poll-1', 'x', 'x-2']);
  });

  it('never throws on data that is not a list', () => {
    expect(normalizePolls({}).polls).toEqual([]);
  });
});
