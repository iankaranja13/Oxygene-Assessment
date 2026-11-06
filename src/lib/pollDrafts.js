// Rules for polls the organizer creates on the dashboard: validating the form and
// turning it into a poll record. Pure functions, unit tested.
import { cleanText, foldForSearch } from './text.js';

export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 6;
export const MAX_QUESTION_LENGTH = 200;
export const MAX_OPTION_LENGTH = 80;
const RANDOM_ID_LENGTH = 6;
const BASE_36 = 36;

/**
 * Checks a draft poll from the form.
 * @param {{ question: string, options: string[] }} draft
 * @returns {{ errors: { question?: string, options?: string }, cleaned: { question: string, options: string[] } }}
 *   cleaned: trimmed question; options trimmed, blanks removed. Valid when errors is empty.
 */
export function validatePollDraft(draft) {
  const question = cleanText(draft.question);
  const options = (draft.options ?? []).map(cleanText).filter(Boolean);
  const errors = {};

  if (!question) {
    errors.question = 'Write the question.';
  } else if (question.length > MAX_QUESTION_LENGTH) {
    errors.question = `Keep the question under ${MAX_QUESTION_LENGTH} characters.`;
  }

  const folded = options.map(foldForSearch);
  if (options.length < MIN_POLL_OPTIONS) {
    errors.options = `Add at least ${MIN_POLL_OPTIONS} answers.`;
  } else if (options.length > MAX_POLL_OPTIONS) {
    errors.options = `Use at most ${MAX_POLL_OPTIONS} answers.`;
  } else if (new Set(folded).size !== folded.length) {
    errors.options = 'Each answer must be different.';
  } else if (options.some((option) => option.length > MAX_OPTION_LENGTH)) {
    errors.options = `Keep each answer under ${MAX_OPTION_LENGTH} characters.`;
  }

  return { errors, cleaned: { question, options } };
}

/**
 * Builds the stored poll. Ids are prefixed "custom-" so they can never clash with the
 * seed polls, and are random because they're created once and then shared.
 * @param {{ question: string, options: string[] }} cleaned output of validatePollDraft
 * @param {Date} [now]
 */
export function createPollRecord(cleaned, now = new Date()) {
  const randomPart = Math.random()
    .toString(BASE_36)
    .slice(2, 2 + RANDOM_ID_LENGTH);
  return {
    id: `custom-${now.getTime().toString(BASE_36)}-${randomPart}`,
    question: cleaned.question,
    options: cleaned.options,
  };
}
