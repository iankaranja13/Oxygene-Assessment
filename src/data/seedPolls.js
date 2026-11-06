// Loads the poll questions from /data and validates them. Safe for everyone to download:
// it contains only the questions and answer options, no guest data.
import rawPolls from '../../data/polls.json';
import { normalizePolls } from '../lib/normalizePolls.js';

const pollResult = normalizePolls(rawPolls);

export const SEED_POLLS = pollResult.polls;
export const SKIPPED_POLLS = pollResult.skipped;

if (import.meta.env.DEV && SKIPPED_POLLS.length) {
  console.warn('[LaunchPad] Skipped polls', SKIPPED_POLLS);
}
