// Attendee poll screen.
//   1. Enter your check-in code (once per phone; verified by the store/database).
//      Staff who land here can type their PIN in the same box and are sent to their screen.
//   2. Then exactly one of: no poll yet, the open question, "you've voted", "voting closed".
// It updates by itself when the organizer changes the poll: no refresh needed.
import { useState } from 'react';
import EmptyState from '../../components/EmptyState.jsx';
import { PollIcon } from '../../components/icons.jsx';
import SignInForm from '../../components/SignInForm.jsx';
import { useAttendeeCode } from '../../hooks/useAttendeeCode.js';
import { useConnectionStatus } from '../../hooks/useConnectionStatus.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { usePolls } from '../../hooks/usePolls.js';
import { CONNECTION_STATUS, STORE_ERRORS } from '../../lib/storage/localStore.js';
import { POLL_VIEW_STATES, getPollViewState } from '../../lib/votes.js';
import styles from './PollPage.module.css';
import PollQuestion from './PollQuestion.jsx';
import { usePollVote } from './usePollVote.js';
import VoteConfirmation from './VoteConfirmation.jsx';

export default function PollPage() {
  usePageTitle('Live poll');
  const { activePoll, pollState } = usePolls();
  const connectionStatus = useConnectionStatus();
  const attendee = useAttendeeCode();
  // Shown on the code form if a remembered code stops being accepted.
  const [codeNotice, setCodeNotice] = useState(null);

  function handleCodeRejected() {
    setCodeNotice(STORE_ERRORS.INVALID_CODE);
    attendee.forget();
  }

  const vote = usePollVote(activePoll, pollState.votingRound, attendee.code, handleCodeRejected);
  const viewState = getPollViewState({
    activePoll,
    isOpen: pollState.isOpen,
    hasVoted: vote.hasVoted,
  });

  return (
    <div className={styles.page}>
      {renderView()}
      {attendee.code && connectionStatus !== CONNECTION_STATUS.CONNECTING && (
        <p className={styles.signedIn}>
          Voting with code <strong>{attendee.code}</strong>.{' '}
          <button type="button" className={styles.linkButton} onClick={attendee.forget}>
            Not you? Use a different code
          </button>
        </p>
      )}
    </div>
  );

  function renderView() {
    // Until the first snapshot arrives we don't know if a poll is open: say so, rather
    // than flashing "No poll right now".
    if (connectionStatus === CONNECTION_STATUS.CONNECTING) {
      return (
        <EmptyState icon={PollIcon} title="Loading the live poll" headingLevel={1}>
          One moment&hellip;
        </EmptyState>
      );
    }
    if (!attendee.code) {
      return (
        // Same box as the welcome page: a staff PIN typed here takes staff to their screen.
        <SignInForm
          title="Join the live poll"
          intro="Enter the check-in code on your ticket so you can vote. One vote per guest."
          notice={codeNotice}
          onGuestSignedIn={(code) => {
            setCodeNotice(null);
            attendee.remember(code);
          }}
        />
      );
    }
    switch (viewState) {
      case POLL_VIEW_STATES.NO_ACTIVE_POLL:
        return (
          <EmptyState icon={PollIcon} title="No poll right now" headingLevel={1}>
            When the presenter opens a poll, it will appear here automatically. Keep this page open.
          </EmptyState>
        );
      case POLL_VIEW_STATES.CLOSED:
        return (
          <EmptyState icon={PollIcon} title="Voting has closed" headingLevel={1}>
            <p className={styles.closedQuestion}>{activePoll.question}</p>
            <p>Thanks for taking part. Keep this page open for the next question.</p>
          </EmptyState>
        );
      case POLL_VIEW_STATES.ALREADY_VOTED:
        return (
          <VoteConfirmation
            poll={activePoll}
            chosenOption={vote.chosenOption}
            isOpen={pollState.isOpen}
          />
        );
      case POLL_VIEW_STATES.OPEN:
        return (
          // Keyed by poll and round so a new question always starts with nothing selected.
          <PollQuestion
            key={`${pollState.votingRound}/${activePoll.id}`}
            poll={activePoll}
            onSubmit={vote.submitVote}
            isSubmitting={vote.isSubmitting}
            error={vote.error}
          />
        );
      default:
        throw new Error(`Unhandled poll view state: ${viewState}`);
    }
  }
}
