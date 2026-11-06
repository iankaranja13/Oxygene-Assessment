// Shown after this device has voted: a clear "thank you" plus what they chose.
import { CheckIcon } from '../../components/icons.jsx';
import { VOTED_ELSEWHERE } from '../../lib/storage/deviceFlags.js';
import styles from './VoteConfirmation.module.css';

export default function VoteConfirmation({ poll, chosenOption, isOpen }) {
  // VOTED_ELSEWHERE: this code already voted on another phone, so we don't know the choice.
  const votedElsewhere = chosenOption === VOTED_ELSEWHERE;
  const chosenLabel = votedElsewhere ? null : poll.options[chosenOption];
  return (
    // role="status" announces the thank-you when it replaces the question.
    <section className={styles.confirmation} role="status">
      <span className={styles.icon}>
        <CheckIcon size={40} />
      </span>
      <h1 className={styles.title}>Thanks, your vote is in</h1>
      <p className={styles.question}>{poll.question}</p>
      {votedElsewhere && (
        <p className={styles.choice}>Your check-in code has already voted in this poll.</p>
      )}
      {chosenLabel && (
        <p className={styles.choice}>
          You chose: <strong>{chosenLabel}</strong>
        </p>
      )}
      <p className={styles.next}>
        {isOpen
          ? 'Keep this page open. The next question will appear here automatically.'
          : 'Voting has now closed. Keep this page open for the next question.'}
      </p>
    </section>
  );
}
