// All polls (seed polls from /data plus polls the organizer created), with the live
// poll state and vote counts.
import { useMemo } from 'react';
import { SEED_POLLS } from '../data/seedPolls.js';
import { normalizePolls } from '../lib/normalizePolls.js';
import { useSharedState } from './useSharedState.js';

/**
 * @returns {{
 *   polls: { id: string, question: string, options: string[], isCustom: boolean }[],
 *   pollState: import('../lib/storage/sharedState.js').PollState,
 *   activePoll: object | null,  null if none is selected or the id no longer exists
 *   votes: Record<string, number[]>,
 * }}
 */
export function usePolls() {
  const { pollState, votes, customPolls } = useSharedState();
  return useMemo(() => {
    // Created polls come from shared storage, so they're validated like the seed file.
    const created = normalizePolls(customPolls).polls.map((poll) => ({ ...poll, isCustom: true }));
    const polls = [...SEED_POLLS.map((poll) => ({ ...poll, isCustom: false })), ...created];
    return {
      polls,
      pollState,
      activePoll: polls.find((poll) => poll.id === pollState.activePollId) ?? null,
      votes,
    };
  }, [pollState, votes, customPolls]);
}
