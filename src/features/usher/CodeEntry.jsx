// Typed code entry, standing in for a QR scanner: type the number on the ticket, press
// "Check in". On success the box clears for the next guest; on a problem it keeps the
// code selected so the usher can correct it by just typing again.
import { useRef, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { CODE_OUTCOMES } from '../../lib/checkIn.js';
import styles from './CodeEntry.module.css';

const CODE_INPUT_ID = 'check-in-code';
const CODE_HINT_ID = 'check-in-code-hint';
const OUTCOMES_THAT_CLEAR = [CODE_OUTCOMES.READY, CODE_OUTCOMES.ALREADY_CHECKED_IN];

/**
 * @param {{ onSubmitCode: (code: string) => Promise<{ outcome: string }>,
 *           onResult: (result: object) => void }} props
 */
export default function CodeEntry({ onSubmitCode, onResult }) {
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsChecking(true);
    try {
      const result = await onSubmitCode(code);
      onResult(result);
      if (OUTCOMES_THAT_CLEAR.includes(result.outcome)) {
        setCode('');
      }
    } finally {
      setIsChecking(false);
      // Keep the keyboard up and select any leftover text so the next code replaces it.
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor={CODE_INPUT_ID} className={styles.label}>
        Check-in code
      </label>
      <p id={CODE_HINT_ID} className={styles.hint}>
        The number on the ticket, e.g. 1049. &ldquo;OXY-&rdquo; is optional.
      </p>
      <input
        ref={inputRef}
        id={CODE_INPUT_ID}
        className={styles.input}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        aria-describedby={CODE_HINT_ID}
        autoFocus
        // Sample codes are OXY- plus digits, so a number pad is fastest. If real codes
        // contain letters, change this to "text".
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        enterKeyHint="go"
      />
      <Button type="submit" className={styles.submit} disabled={isChecking}>
        Check in
      </Button>
    </form>
  );
}
