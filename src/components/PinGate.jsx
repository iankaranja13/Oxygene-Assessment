// Wraps staff-only screens: shows a PIN form until this browser session is unlocked.
import { useId, useState } from 'react';
import { useStaffAccess } from '../hooks/useStaffAccess.js';
import { Button } from './Button.jsx';
import { AlertIcon } from './icons.jsx';
import styles from './PinGate.module.css';

export default function PinGate({ children }) {
  const { isStaff, unlock } = useStaffAccess();
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const inputId = useId();
  const errorId = useId();

  if (isStaff) {
    return children;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const unlocked = unlock(pin);
    setHasError(!unlocked);
    if (!unlocked) {
      setPin('');
    }
  }

  return (
    <section className={styles.card} aria-labelledby={`${inputId}-title`}>
      <h1 id={`${inputId}-title`} className={styles.title}>
        Staff only
      </h1>
      <p className={styles.intro}>Enter the staff PIN to use check-in and the dashboard.</p>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label htmlFor={inputId} className={styles.label}>
          Staff PIN
        </label>
        <input
          id={inputId}
          className={[styles.input, hasError && styles.inputInvalid].filter(Boolean).join(' ')}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
        />
        {hasError && (
          <p id={errorId} className={styles.error} role="alert">
            <AlertIcon size={20} />
            That PIN didn&rsquo;t match. Please try again.
          </p>
        )}
        <Button type="submit" fullWidth>
          Unlock
        </Button>
      </form>
    </section>
  );
}
