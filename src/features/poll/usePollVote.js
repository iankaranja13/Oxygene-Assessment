// This guest's vote in the active poll: what they chose, and how to submit a vote.
// The real one-vote-per-code rule is enforced by the store/database; this hook just
// remembers the answer on the phone so "You chose: X" survives a reload.
import { useState } from 'react';
import { appStore } from '../../lib/storage/appStore.js';
import { VOTED_ELSEWHERE, getDeviceVote, recordDeviceVote } from '../../lib/storage/deviceFlags.js';
import { STORE_ERRORS } from '../../lib/storage/localStore.js';

/**
 * @param {{ id: string } | null} poll the active poll
 * @param {string} votingRound from the shared poll state
 * @param {string | null} voterCode the attendee's verified check-in code
 * @param {() => void} onCodeRejected called if the server no longer accepts the code
 */
export function usePollVote(poll, votingRound, voterCode, onCodeRejected) {
  // Fallback memory for when the browser refuses to save: still shows the thank-you
  // for as long as this page stays open.
  const [unsavedVotes, setUnsavedVotes] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vote = poll && voterCode ? { votingRound, pollId: poll.id, voterCode } : null;
  const unsavedKey = vote ? `${votingRound}/${vote.pollId}/${voterCode}` : null;
  const chosenOption = vote ? (getDeviceVote(vote) ?? unsavedVotes[unsavedKey] ?? null) : null;

  function remember(optionIndex) {
    if (!recordDeviceVote(vote, optionIndex)) {
      setUnsavedVotes((current) => ({ ...current, [unsavedKey]: optionIndex }));
    }
  }

  async function submitVote(optionIndex) {
    if (!vote || chosenOption !== null) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await appStore.castVote(vote.pollId, optionIndex, voterCode);
      if (result.ok) {
        remember(optionIndex);
      } else if (result.error === STORE_ERRORS.ALREADY_VOTED) {
        // This code voted from another phone: show the thank-you, without a choice.
        remember(VOTED_ELSEWHERE);
      } else if (result.error === STORE_ERRORS.INVALID_CODE) {
        onCodeRejected();
      } else {
        setError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return { chosenOption, hasVoted: chosenOption !== null, submitVote, isSubmitting, error };
}
