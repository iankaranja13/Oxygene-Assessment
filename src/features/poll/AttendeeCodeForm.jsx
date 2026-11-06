// First thing an attendee sees on /poll: "Enter your check-in code". The code is checked
// by the store (the database, with Supabase) and only then remembered on the phone.
// This makes it one vote per guest, not per phone.
import { useId, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { AlertIcon } from '../../components/icons.jsx';
import { normalizeCheckInCode } from '../../lib/normalizeGuests.js';
import { appStore } from '../../lib/storage/appStore.js';
import { STORE_ERRORS } from '../../lib/storage/localStore.js';
import styles from './AttendeeCodeForm.module.css';

/** @param {{ onVerified: (code: string) => void, notice?: string | null }} props */
export default function AttendeeCodeForm({ onVerified, notice = null }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(notice);
  const [isChecking, setIsChecking] = useState(false);
  const id = useId();

  async function handleSubmit(event) {
    event.preventDefault();
    // Same normalization as the guest list: "1049", "oxy1049" and "OXY-1049" all work.
    const code = normalizeCheckInCode(input);
    if (!code) {
      setError('Type the check-in code from your ticket.');
      return;
    }
    setIsChecking(true);
    try {
      const result = await appStore.verifyAttendeeCode(code);
      if (!result.ok) {
        setError(result.error);
      } else if (!result.valid) {
        setError(STORE_ERRORS.INVALID_CODE);
      } else {
        onVerified(code);
      }
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby={`${id}-title`}>
      <div>
        <h1 id={`${id}-title`} className={styles.title}>
          Join the live poll
        </h1>
        <p className={styles.intro}>
          Enter your check-in code so you can vote. One vote per guest.
        </p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label htmlFor={`${id}-code`} className={styles.label}>
          Your check-in code
        </label>
        <p id={`${id}-hint`} className={styles.hint}>
          It&rsquo;s on your ticket or invitation, e.g. 1049.
        </p>
        <input
          id={`${id}-code`}
          className={[styles.input, error && styles.inputInvalid].filter(Boolean).join(' ')}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={[`${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')}
        />
        {error && (
          <p id={`${id}-error`} className={styles.error} role="alert">
            <AlertIcon />
            {error}
          </p>
        )}
        <Button type="submit" fullWidth disabled={isChecking}>
          {isChecking ? 'Checking…' : 'Continue'}
        </Button>
      </form>
    </section>
  );
}
