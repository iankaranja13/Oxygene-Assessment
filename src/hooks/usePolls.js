// Combines the seed poll questions with the live poll state and vote counts.
import { useMemo } from 'react';
import { SEED_POLLS } from '../data/seedPolls.js';
import { useSharedState } from './useSharedState.js';

/**
 * @returns {{
 *   polls: { id: string, question: string, options: string[] }[],
 *   pollState: import('../lib/storage/sharedState.js').PollState,
 *   activePoll: object | null,  null if none is selected or the id no longer exists
 *   votes: Record<string, number[]>,
 * }}
 */
export function usePolls() {
  const { pollState, votes } = useSharedState();
  return useMemo(
    () => ({
      polls: SEED_POLLS,
      pollState,
      activePoll: SEED_POLLS.find((poll) => poll.id === pollState.activePollId) ?? null,
      votes,
    }),
    [pollState, votes],
  );
}
