// Poll rules as pure functions: which screen an attendee sees, and how votes are tallied.

/** Every state the attendee poll screen can be in. */
export const POLL_VIEW_STATES = Object.freeze({
  NO_ACTIVE_POLL: 'no-active-poll',
  CLOSED: 'closed',
  ALREADY_VOTED: 'already-voted',
  OPEN: 'open',
});

const FULL_PERCENT = 100;

/**
 * Decides what an attendee should see.
 * @param {{ activePoll: object | null, isOpen: boolean, hasVoted: boolean }} input
 *   activePoll is null when no poll is selected, or when the selected id no longer exists.
 * @returns {string} one of POLL_VIEW_STATES
 */
export function getPollViewState({ activePoll, isOpen, hasVoted }) {
  if (!activePoll) return POLL_VIEW_STATES.NO_ACTIVE_POLL;
  // Thank people who voted, even after voting closes.
  if (hasVoted) return POLL_VIEW_STATES.ALREADY_VOTED;
  if (!isOpen) return POLL_VIEW_STATES.CLOSED;
  return POLL_VIEW_STATES.OPEN;
}

/**
 * Converts counts to whole percentages that always add up to exactly 100
 * (simple rounding can give 99 or 101, e.g. three equal votes -> 33+33+33).
 * Uses the "largest remainder" method: round everything down, then give the
 * leftover points to the options that lost the most in rounding.
 * @param {number[]} counts
 * @returns {number[]} all zeros when there are no votes
 */
export function toPercentages(counts) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return counts.map(() => 0);

  const exact = counts.map((count) => (count / total) * FULL_PERCENT);
  const percentages = exact.map(Math.floor);
  let leftover = FULL_PERCENT - percentages.reduce((sum, value) => sum + value, 0);

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - percentages[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of byRemainder) {
    if (leftover === 0) break;
    percentages[index] += 1;
    leftover -= 1;
  }
  return percentages;
}

/**
 * Combines a poll's options with its vote counts for display.
 * Counts are matched to options by position; missing counts are 0 and extra counts
 * (e.g. from an option that was removed) are ignored.
 * @param {{ options: string[] }} poll
 * @param {number[] | undefined} counts
 * @returns {{ totalVotes: number, options: { label: string, count: number, percent: number }[] }}
 */
export function tallyVotes(poll, counts = []) {
  const optionCounts = poll.options.map((_, index) => counts[index] ?? 0);
  const percentages = toPercentages(optionCounts);
  return {
    totalVotes: optionCounts.reduce((sum, count) => sum + count, 0),
    options: poll.options.map((label, index) => ({
      label,
      count: optionCounts[index],
      percent: percentages[index],
    })),
  };
}
