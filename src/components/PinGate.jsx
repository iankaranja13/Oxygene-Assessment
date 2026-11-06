// Wraps staff-only screens. Shows the screen if this device's role is allowed in;
// otherwise asks for a PIN. Ushers who open the dashboard are told it needs the
// organizer PIN, rather than just "wrong PIN".
import { useId, useState } from 'react';
import { useStaffAccess } from '../hooks/useStaffAccess.js';
import { ROLE_LABELS, STAFF_ROLES, canAccess, roleForPin } from '../lib/staffAccess.js';
import { Button } from './Button.jsx';
import { AlertIcon } from './icons.jsx';
import styles from './PinGate.module.css';

const GATE_TEXT = {
  [STAFF_ROLES.USHER]: {
    title: 'Staff only',
    intro: 'Enter your staff PIN to use guest check-in.',
  },
  [STAFF_ROLES.ORGANIZER]: {
    title: 'Organizers only',
    intro: 'Enter the organizer PIN to open the dashboard.',
  },
};

export default function PinGate({ requiredRole, children }) {
  const { role, unlockAs } = useStaffAccess();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const inputId = useId();
  const errorId = useId();

  if (canAccess(role, requiredRole)) {
    return children;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const pinRole = roleForPin(pin);
    setPin('');
    if (!pinRole) {
      setError('That PIN didn’t match. Please try again.');
    } else if (!canAccess(pinRole, requiredRole)) {
      // A valid PIN, just not enough for this screen: say so plainly.
      setError(
        `That’s the ${ROLE_LABELS[pinRole].toLowerCase()} PIN. This screen needs the ${ROLE_LABELS[requiredRole].toLowerCase()} PIN.`,
      );
    } else {
      setError(null);
      unlockAs(pinRole);
    }
  }

  const { title, intro } = GATE_TEXT[requiredRole];
  return (
    <section className={styles.card} aria-labelledby={`${inputId}-title`}>
      <h1 id={`${inputId}-title`} className={styles.title}>
        {title}
      </h1>
      <p className={styles.intro}>
        {role && `You’re unlocked as ${ROLE_LABELS[role].toLowerCase()}. `}
        {intro}
      </p>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label htmlFor={inputId} className={styles.label}>
          {requiredRole === STAFF_ROLES.ORGANIZER ? 'Organizer PIN' : 'Staff PIN'}
        </label>
        <input
          id={inputId}
          className={[styles.input, error && styles.inputInvalid].filter(Boolean).join(' ')}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        {error && (
          <p id={errorId} className={styles.error} role="alert">
            <AlertIcon size={20} />
            {error}
          </p>
        )}
        <Button type="submit" fullWidth>
          Unlock
        </Button>
      </form>
    </section>
  );
}
