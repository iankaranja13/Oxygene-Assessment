// The one box everyone uses to say who they are:
//   usher PIN      -> unlocks check-in and goes there
//   organizer PIN  -> unlocks the dashboard and goes there
//   guest's code   -> verified by the store (the database), then the live poll
// Used on the welcome page and on /poll. Signing in as one kind of user signs out the other,
// so a device is only ever one role at a time.
import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { useStaffAccess } from '../hooks/useStaffAccess.js';
import { ROUTES } from '../lib/constants.js';
import { HOME_ROUTE_FOR_ROLE, SIGN_IN_KINDS, identifySignIn } from '../lib/signIn.js';
import { appStore } from '../lib/storage/appStore.js';
import { writeAttendeeCode } from '../lib/storage/attendeeCode.js';
import { Button } from './Button.jsx';
import { AlertIcon } from './icons.jsx';
import styles from './SignInForm.module.css';

const NOT_RECOGNISED =
  "That doesn't match a check-in code or staff PIN. Check your ticket, or ask an usher.";

/**
 * @param {{ title: string, intro: string, notice?: string | null,
 *           onGuestSignedIn?: (code: string) => void }} props
 *   onGuestSignedIn: what to do after a guest code is accepted (default: go to the poll).
 */
export default function SignInForm({ title, intro, notice = null, onGuestSignedIn }) {
  const [input, setInput] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState(notice);
  const [isChecking, setIsChecking] = useState(false);
  const { unlockAs, lock } = useStaffAccess();
  const navigate = useNavigate();
  const id = useId();

  async function handleSubmit(event) {
    event.preventDefault();
    const identity = identifySignIn(input);

    if (identity.kind === SIGN_IN_KINDS.EMPTY) {
      setError('Type your check-in code or staff PIN.');
      return;
    }
    if (identity.kind === SIGN_IN_KINDS.STAFF) {
      writeAttendeeCode(null);
      unlockAs(identity.role);
      navigate(HOME_ROUTE_FOR_ROLE[identity.role]);
      return;
    }

    setIsChecking(true);
    try {
      const result = await appStore.verifyAttendeeCode(identity.code);
      if (!result.ok) {
        setError(result.error);
      } else if (!result.valid) {
        setError(NOT_RECOGNISED);
      } else {
        lock();
        writeAttendeeCode(identity.code);
        if (onGuestSignedIn) {
          onGuestSignedIn(identity.code);
        } else {
          navigate(ROUTES.poll);
        }
      }
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby={`${id}-title`}>
      <div>
        <h1 id={`${id}-title`} className={styles.title}>
          {title}
        </h1>
        <p className={styles.intro}>{intro}</p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label htmlFor={`${id}-input`} className={styles.label}>
          Check-in code or staff PIN
        </label>
        <p id={`${id}-hint`} className={styles.hint}>
          Guests: the number on your ticket, e.g. 1049.
        </p>
        <div className={styles.inputRow}>
          <input
            id={`${id}-input`}
            className={[styles.input, error && styles.inputInvalid].filter(Boolean).join(' ')}
            type={isVisible ? 'text' : 'password'}
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
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setIsVisible((visible) => !visible)}
            aria-pressed={isVisible}
            aria-label={isVisible ? 'Hide what I typed' : 'Show what I typed'}
          >
            {isVisible ? 'Hide' : 'Show'}
          </button>
        </div>
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
