// Validates the seed poll questions. A poll needs a question and at least two distinct
// answer options; anything less is skipped and reported rather than shown half-broken.

import { cleanText, foldForSearch } from './text.js';

export const MIN_POLL_OPTIONS = 2;

/**
 * @param {unknown} rawData the parsed polls.json
 * @returns {{ polls: {id: string, question: string, options: string[]}[], skipped: {index: number, reason: string}[] }}
 */
export function normalizePolls(rawData) {
  const polls = [];
  const skipped = [];
  if (!Array.isArray(rawData)) {
    return { polls, skipped: [{ index: -1, reason: 'Poll data is not a list' }] };
  }

  const usedIds = new Set();
  rawData.forEach((raw, index) => {
    const question = cleanText(raw?.question);
    const options = uniqueOptions(Array.isArray(raw?.options) ? raw.options : []);

    if (!question) {
      skipped.push({ index, reason: 'No question text' });
      return;
    }
    if (options.length < MIN_POLL_OPTIONS) {
      skipped.push({ index, reason: `Fewer than ${MIN_POLL_OPTIONS} answer options` });
      return;
    }

    // Ids are stored with votes, so they must be unique and stable across devices.
    const baseId = cleanText(raw.id) || `poll-${index + 1}`;
    let id = baseId;
    for (let suffix = 2; usedIds.has(id); suffix += 1) {
      id = `${baseId}-${suffix}`;
    }
    usedIds.add(id);
    polls.push({ id, question, options });
  });

  return { polls, skipped };
}

/** Cleans options, dropping blanks and repeats (compared ignoring case and accents). */
function uniqueOptions(rawOptions) {
  const seen = new Set();
  const options = [];
  for (const rawOption of rawOptions) {
    const option = cleanText(rawOption);
    const key = foldForSearch(option);
    if (option && !seen.has(key)) {
      seen.add(key);
      options.push(option);
    }
  }
  return options;
}
