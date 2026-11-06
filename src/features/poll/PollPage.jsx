// Attendee poll screen. Shows exactly one of four states (see getPollViewState):
// no poll yet, the open question, "you've voted", or "voting closed".
// It updates by itself when the organizer changes the poll: no refresh needed.
import EmptyState from '../../components/EmptyState.jsx';
import { PollIcon } from '../../components/icons.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { usePolls } from '../../hooks/usePolls.js';
import { POLL_VIEW_STATES, getPollViewState } from '../../lib/votes.js';
import PollQuestion from './PollQuestion.jsx';
import styles from './PollPage.module.css';
import { usePollVote } from './usePollVote.js';
import VoteConfirmation from './VoteConfirmation.jsx';

export default function PollPage() {
  usePageTitle('Live poll');
  const { activePoll, pollState } = usePolls();
  const vote = usePollVote(activePoll, pollState.votingRound);
  const viewState = getPollViewState({
    activePoll,
    isOpen: pollState.isOpen,
    hasVoted: vote.hasVoted,
  });

  return <div className={styles.page}>{renderView()}</div>;

  function renderView() {
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
