// Organizer controls: choose which poll attendees see, and open or close voting.
// Switching polls always starts with voting closed, so a question never goes live by accident.
import Badge from '../../components/Badge.jsx';
import { Button } from '../../components/Button.jsx';
import { CheckIcon, CloseIcon, LockIcon } from '../../components/icons.jsx';
import Panel from './Panel.jsx';
import styles from './PollControls.module.css';

const NO_POLL = '';

function totalVotes(counts = []) {
  return counts.reduce((sum, count) => sum + count, 0);
}

/**
 * @param {{ polls: object[], pollState: object, votes: Record<string, number[]>,
 *           onChange: (changes: object) => void, onDelete: (pollId: string) => void,
 *           isSaving: boolean }} props
 */
export default function PollControls({ polls, pollState, votes, onChange, onDelete, isSaving }) {
  const { activePollId, isOpen } = pollState;
  const hasActivePoll = activePollId !== null && polls.some((poll) => poll.id === activePollId);

  return (
    <Panel title="Poll controls">
      <p className={styles.status} aria-live="polite">
        {!hasActivePoll && <Badge>No poll on phones</Badge>}
        {hasActivePoll && isOpen && (
          <Badge tone="success" icon={CheckIcon}>
            Voting open
          </Badge>
        )}
        {hasActivePoll && !isOpen && (
          <Badge tone="warning" icon={LockIcon}>
            Voting closed
          </Badge>
        )}
      </p>

      {hasActivePoll && (
        <Button
          variant={isOpen ? 'danger' : 'primary'}
          fullWidth
          disabled={isSaving}
          onClick={() => onChange({ isOpen: !isOpen })}
        >
          {isOpen ? 'Close voting' : 'Open voting'}
        </Button>
      )}

      <fieldset className={styles.fieldset} disabled={isSaving}>
        <legend className={styles.legend}>Show on attendees&rsquo; phones</legend>
        <label className={styles.option}>
          <input
            type="radio"
            name="active-poll"
            value={NO_POLL}
            checked={!hasActivePoll}
            onChange={() => onChange({ activePollId: null, isOpen: false })}
          />
          <span className={styles.optionText}>No poll (waiting screen)</span>
        </label>
        {polls.map((poll) => (
          <div key={poll.id} className={styles.optionRow}>
            <label className={styles.option}>
              <input
                type="radio"
                name="active-poll"
                value={poll.id}
                checked={activePollId === poll.id}
                onChange={() => onChange({ activePollId: poll.id, isOpen: false })}
              />
              <span className={styles.optionText}>
                {poll.question}
                <span className={styles.voteCount}>
                  {totalVotes(votes[poll.id]) === 1
                    ? '1 vote'
                    : `${totalVotes(votes[poll.id])} votes`}
                  {poll.isCustom && ' · created here'}
                </span>
              </span>
            </label>
            {/* Only created polls with no votes, not on screen, can be deleted (results are never lost). */}
            {poll.isCustom && totalVotes(votes[poll.id]) === 0 && poll.id !== activePollId && (
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => onDelete(poll.id)}
                aria-label={`Delete poll: ${poll.question}`}
              >
                <CloseIcon size={20} />
              </button>
            )}
          </div>
        ))}
      </fieldset>
    </Panel>
  );
}
