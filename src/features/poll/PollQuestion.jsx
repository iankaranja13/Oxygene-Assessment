// The open poll: the question, large answer options and a Submit button.
// Choosing and submitting are two steps, because a vote can't be changed afterwards;
// an accidental tap on the wrong answer is easy to fix before submitting.
import { useId, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { AlertIcon, CheckIcon } from '../../components/icons.jsx';
import styles from './PollQuestion.module.css';

/**
 * @param {{ poll: { id: string, question: string, options: string[] },
 *           onSubmit: (optionIndex: number) => void, isSubmitting: boolean,
 *           error: string | null }} props
 */
export default function PollQuestion({ poll, onSubmit, isSubmitting, error }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const id = useId();

  function handleSubmit(event) {
    event.preventDefault();
    if (selectedIndex !== null) {
      onSubmit(selectedIndex);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <fieldset className={styles.fieldset}>
        {/* The legend names the radio group; the h1 inside makes it the page heading too. */}
        <legend className={styles.legend}>
          <h1 className={styles.question}>{poll.question}</h1>
        </legend>
        <p className={styles.instruction}>Choose one answer, then submit.</p>
        <div className={styles.options}>
          {poll.options.map((option, index) => (
            <label key={option} className={styles.option}>
              <input
                type="radio"
                name={`${id}-answer`}
                className="visually-hidden"
                value={index}
                checked={selectedIndex === index}
                onChange={() => setSelectedIndex(index)}
              />
              <span className={styles.marker}>
                {selectedIndex === index && <CheckIcon size={18} />}
              </span>
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className={styles.error} role="alert">
          <AlertIcon />
          {error}
        </p>
      )}

      <Button type="submit" fullWidth disabled={selectedIndex === null || isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Submit vote'}
      </Button>
    </form>
  );
}
