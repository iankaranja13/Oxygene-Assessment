// The shape of the state every device shares (check-ins, walk-ins, poll state, votes),
// and validators that repair anything malformed read back from storage or the network.
// Stored data is treated as untrusted: another version of the app, a browser extension
// or a person in dev tools could have written anything.

/**
 * @typedef {{ checkedIn: boolean, at: string | null }} CheckInRecord
 *   `at` is an ISO timestamp, or null when the time is unknown.
 * @typedef {{ activePollId: string | null, isOpen: boolean, votingRound: string }} PollState
 *   votingRound changes on every "Reset demo data". Phones remember which round they
 *   voted in, so a reset lets every device vote again, even devices we can't reach.
 * @typedef {{
 *   checkIns: Record<string, CheckInRecord>,
 *   walkIns: object[],
 *   pollState: PollState,
 *   votes: Record<string, number[]>,
 *   customPolls: { id: string, question: string, options: string[] }[],
 *   votedCodes: Record<string, string[]>,
 * }} SharedState
 *   checkIns: per guest id, overrides the check-in status from the guest list.
 *   votes: per poll id, a count for each answer option (index matches the option).
 *   customPolls: polls the organizer created on the dashboard (seed polls come from /data).
 *   votedCodes: per poll id, check-in codes that have voted (local store only; Supabase
 *     keeps these in the database where phones can't read them).
 */

export const INITIAL_VOTING_ROUND = 'initial';
const BASE_36 = 36;

/** A new, unique-enough round id, e.g. "mh2k9x1a". Time-based so it never repeats. */
export function createVotingRound(now = new Date()) {
  return now.getTime().toString(BASE_36);
}

/** @type {SharedState} */
export const EMPTY_SHARED_STATE = Object.freeze({
  checkIns: Object.freeze({}),
  walkIns: Object.freeze([]),
  pollState: Object.freeze({
    activePollId: null,
    isOpen: false,
    votingRound: INITIAL_VOTING_ROUND,
  }),
  votes: Object.freeze({}),
  customPolls: Object.freeze([]),
  votedCodes: Object.freeze({}),
});

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

/** Keeps only well-formed check-in records. */
export function sanitizeCheckIns(value) {
  if (!isPlainObject(value)) return EMPTY_SHARED_STATE.checkIns;
  const checkIns = {};
  for (const [guestId, record] of Object.entries(value)) {
    if (isPlainObject(record) && typeof record.checkedIn === 'boolean') {
      checkIns[guestId] = {
        checkedIn: record.checkedIn,
        at: isValidTimestamp(record.at) ? record.at : null,
      };
    }
  }
  return checkIns;
}

/** Keeps walk-ins that have an id; full guest normalization happens when they're displayed. */
export function sanitizeWalkIns(value) {
  if (!Array.isArray(value)) return EMPTY_SHARED_STATE.walkIns;
  return value.filter((walkIn) => isPlainObject(walkIn) && typeof walkIn.id === 'string');
}

export function sanitizePollState(value) {
  if (!isPlainObject(value)) return EMPTY_SHARED_STATE.pollState;
  const activePollId = typeof value.activePollId === 'string' ? value.activePollId : null;
  const votingRound =
    typeof value.votingRound === 'string' && value.votingRound
      ? value.votingRound
      : INITIAL_VOTING_ROUND;
  // A poll can't be open if no poll is selected.
  return { activePollId, isOpen: activePollId !== null && value.isOpen === true, votingRound };
}

/** Keeps vote counts that are whole, non-negative numbers; anything else counts as 0. */
export function sanitizeVotes(value) {
  if (!isPlainObject(value)) return EMPTY_SHARED_STATE.votes;
  const votes = {};
  for (const [pollId, counts] of Object.entries(value)) {
    if (Array.isArray(counts)) {
      votes[pollId] = counts.map((count) => (Number.isInteger(count) && count > 0 ? count : 0));
    }
  }
  return votes;
}

/** Adds one vote to an option, growing the counts list if needed. Pure: returns new objects. */
export function addVote(votes, pollId, optionIndex) {
  const counts = [...(votes[pollId] ?? [])];
  while (counts.length <= optionIndex) counts.push(0);
  counts[optionIndex] += 1;
  return { ...votes, [pollId]: counts };
}

/** Keeps polls shaped like { id, question, options: string[] }; full validation happens in usePolls. */
export function sanitizeCustomPolls(value) {
  if (!Array.isArray(value)) return EMPTY_SHARED_STATE.customPolls;
  return value.filter(
    (poll) =>
      isPlainObject(poll) &&
      typeof poll.id === 'string' &&
      typeof poll.question === 'string' &&
      Array.isArray(poll.options) &&
      poll.options.every((option) => typeof option === 'string'),
  );
}

/** Keeps { pollId: [code, ...] } with string codes only. */
export function sanitizeVotedCodes(value) {
  if (!isPlainObject(value)) return EMPTY_SHARED_STATE.votedCodes;
  const votedCodes = {};
  for (const [pollId, codes] of Object.entries(value)) {
    if (Array.isArray(codes)) {
      votedCodes[pollId] = codes.filter((code) => typeof code === 'string');
    }
  }
  return votedCodes;
}
