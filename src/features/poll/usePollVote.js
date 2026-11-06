// This device's vote in the active poll: what it chose, and how to submit a vote.
import { useState } from 'react';
import { appStore } from '../../lib/storage/appStore.js';
import { getDeviceVote, recordDeviceVote } from '../../lib/storage/deviceFlags.js';

/**
 * @param {{ id: string } | null} poll the active poll
 * @param {string} votingRound from the shared poll state
 */
export function usePollVote(poll, votingRound) {
  // Fallback memory for when the browser refuses to save the device flag: still blocks a
  // second vote for as long as this page stays open.
  const [unsavedVotes, setUnsavedVotes] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read on every render (a cheap localStorage lookup), so a reset or a new round
  // is reflected immediately.
  const unsavedKey = poll ? `${votingRound}/${poll.id}` : null;
  const chosenOption = poll
    ? (getDeviceVote(votingRound, poll.id) ?? unsavedVotes[unsavedKey] ?? null)
    : null;

  async function submitVote(optionIndex) {
    if (!poll || chosenOption !== null) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Count the vote first, then remember it on this device. If the vote fails,
      // the device must stay free to try again.
      const result = await appStore.castVote(poll.id, optionIndex);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!recordDeviceVote(votingRound, poll.id, optionIndex)) {
        setUnsavedVotes((current) => ({ ...current, [unsavedKey]: optionIndex }));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return { chosenOption, hasVoted: chosenOption !== null, submitVote, isSubmitting, error };
}
