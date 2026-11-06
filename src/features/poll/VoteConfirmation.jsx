// Shown after this device has voted: a clear "thank you" plus what they chose.
import { CheckIcon } from '../../components/icons.jsx';
import styles from './VoteConfirmation.module.css';

export default function VoteConfirmation({ poll, chosenOption, isOpen }) {
  const chosenLabel = poll.options[chosenOption];
  return (
    // role="status" announces the thank-you when it replaces the question.
    <section className={styles.confirmation} role="status">
      <span className={styles.icon}>
        <CheckIcon size={40} />
      </span>
      <h1 className={styles.title}>Thanks, your vote is in</h1>
      <p className={styles.question}>{poll.question}</p>
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
