// Lets the organizer write a new poll: a question and 2 to 6 answers. New polls appear in
// Poll controls straight away, and on attendees' phones once shown and opened.
import { useId, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { CloseIcon } from '../../components/icons.jsx';
import {
  MAX_POLL_OPTIONS,
  MIN_POLL_OPTIONS,
  createPollRecord,
  validatePollDraft,
} from '../../lib/pollDrafts.js';
import Panel from './Panel.jsx';
import styles from './CreatePollForm.module.css';

// Each answer row gets a stable id so React keeps the right text in the right box
// when a row in the middle is removed.
let nextRowId = 0;
const newRow = (text = '') => ({ rowId: `answer-${(nextRowId += 1)}`, text });
const emptyDraft = () => ({
  question: '',
  rows: Array.from({ length: MIN_POLL_OPTIONS }, () => newRow()),
});

/** @param {{ onCreate: (poll: object) => Promise<boolean>, isSaving: boolean }} props */
export default function CreatePollForm({ onCreate, isSaving }) {
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState({});
  const id = useId();

  function updateRow(rowId, text) {
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.rowId === rowId ? { ...row, text } : row)),
    }));
  }

  function removeRow(rowId) {
    setDraft((current) => ({
      ...current,
      rows: current.rows.filter((row) => row.rowId !== rowId),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const { errors: found, cleaned } = validatePollDraft({
      question: draft.question,
      options: draft.rows.map((row) => row.text),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const created = await onCreate(createPollRecord(cleaned));
    if (created) {
      setDraft(emptyDraft());
    }
  }

  return (
    <Panel title="Create a poll">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={`${id}-question`} className={styles.label}>
            Question
          </label>
          <input
            id={`${id}-question`}
            className={[styles.input, errors.question && styles.inputInvalid]
              .filter(Boolean)
              .join(' ')}
            value={draft.question}
            onChange={(event) =>
              setDraft((current) => ({ ...current, question: event.target.value }))
            }
            aria-invalid={Boolean(errors.question)}
            aria-describedby={errors.question ? `${id}-question-error` : undefined}
          />
          {errors.question && (
            <p id={`${id}-question-error`} className={styles.error} role="alert">
              {errors.question}
            </p>
          )}
        </div>

        <fieldset
          className={styles.fieldset}
          aria-describedby={errors.options ? `${id}-options-error` : `${id}-options-hint`}
        >
          <legend className={styles.label}>Answers</legend>
          <p id={`${id}-options-hint`} className={styles.hint}>
            Between {MIN_POLL_OPTIONS} and {MAX_POLL_OPTIONS} answers.
          </p>
          {draft.rows.map((row, index) => (
            <div key={row.rowId} className={styles.optionRow}>
              <input
                className={[styles.input, errors.options && styles.inputInvalid]
                  .filter(Boolean)
                  .join(' ')}
                value={row.text}
                onChange={(event) => updateRow(row.rowId, event.target.value)}
                aria-label={`Answer ${index + 1}`}
              />
              {draft.rows.length > MIN_POLL_OPTIONS && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeRow(row.rowId)}
                  aria-label={`Remove answer ${index + 1}`}
                >
                  <CloseIcon size={20} />
                </button>
              )}
            </div>
          ))}
          {errors.options && (
            <p id={`${id}-options-error`} className={styles.error} role="alert">
              {errors.options}
            </p>
          )}
          {draft.rows.length < MAX_POLL_OPTIONS && (
            <Button
              variant="secondary"
              className={styles.addButton}
              onClick={() =>
                setDraft((current) => ({ ...current, rows: [...current.rows, newRow()] }))
              }
            >
              Add an answer
            </Button>
          )}
        </fieldset>

        <Button type="submit" fullWidth disabled={isSaving}>
          Create poll
        </Button>
      </form>
    </Panel>
  );
}
