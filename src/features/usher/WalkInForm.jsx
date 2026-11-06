// Adds a guest who isn't on the list, then checks them in. If someone with the same name
// is already on the list, the usher is shown who before confirming, to avoid duplicates.
import { useId, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { TICKET_TYPES } from '../../lib/normalizeGuests.js';
import { WALK_IN_TICKET_TYPES, validateWalkIn } from '../../lib/walkIns.js';
import styles from './WalkInForm.module.css';

/**
 * @param {{ initialName: string, guests: object[], onAdd: (input) => Promise<unknown>,
 *           onCancel: () => void }} props
 */
export default function WalkInForm({ initialName, guests, onAdd, onCancel }) {
  const [form, setForm] = useState({
    name: initialName,
    organization: '',
    ticketType: TICKET_TYPES.GENERAL,
  });
  const [nameError, setNameError] = useState(null);
  const [sameNameGuests, setSameNameGuests] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const id = useId();

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    // Editing the name means any earlier duplicate warning no longer applies.
    if (field === 'name') {
      setNameError(null);
      setSameNameGuests([]);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateWalkIn(form, guests);
    if (validation.errors.name) {
      setNameError(validation.errors.name);
      return;
    }
    // First submit with a known name: show the warning. Second submit: "Add anyway".
    const alreadyWarned = sameNameGuests.length > 0;
    if (validation.sameNameGuests.length > 0 && !alreadyWarned) {
      setSameNameGuests(validation.sameNameGuests);
      return;
    }
    setIsSaving(true);
    try {
      await onAdd(form);
    } finally {
      setIsSaving(false);
    }
  }

  const hasDuplicateWarning = sameNameGuests.length > 0;

  return (
    <section className={styles.panel} aria-labelledby={`${id}-title`}>
      <div>
        <h2 id={`${id}-title`} className={styles.title}>
          Add a walk-in guest
        </h2>
        <p className={styles.intro}>
          For someone who isn&rsquo;t on the list. They&rsquo;ll be checked in.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={`${id}-name`} className={styles.label}>
            Full name
          </label>
          <input
            id={`${id}-name`}
            className={[styles.input, nameError && styles.inputInvalid].filter(Boolean).join(' ')}
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            autoComplete="off"
            autoCapitalize="words"
            autoFocus
            required
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? `${id}-name-error` : undefined}
          />
          {nameError && (
            <p id={`${id}-name-error`} className={styles.fieldError} role="alert">
              {nameError}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${id}-organization`} className={styles.label}>
            Organization <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id={`${id}-organization`}
            className={styles.input}
            value={form.organization}
            onChange={(event) => updateField('organization', event.target.value)}
            autoComplete="organization"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor={`${id}-ticket`} className={styles.label}>
            Ticket type
          </label>
          <select
            id={`${id}-ticket`}
            className={styles.input}
            value={form.ticketType}
            onChange={(event) => updateField('ticketType', event.target.value)}
          >
            {WALK_IN_TICKET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {hasDuplicateWarning && (
          <div className={styles.duplicateWarning} role="alert">
            <strong>Already on the list?</strong> These guests have the same name:
            <ul className={styles.duplicateList}>
              {sameNameGuests.map((guest) => (
                <li key={guest.id}>
                  {guest.name}, {guest.organization} ({guest.ticketType}
                  {guest.status?.checkedIn ? ', checked in' : ''})
                </li>
              ))}
            </ul>
            Cancel and check them in instead, or add this person anyway.
          </div>
        )}

        <div className={styles.actions}>
          <Button type="submit" disabled={isSaving}>
            {hasDuplicateWarning ? 'Add anyway' : 'Add and check in'}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
