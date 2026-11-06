// Pure conversions between Supabase table rows and the app's shared state shape.
// Kept separate from the network code so they can be unit tested. Every result passes
// through the same validators as localStorage data: the network is a boundary too.
import {
  addVote,
  sanitizeCheckIns,
  sanitizePollState,
  sanitizeVotes,
  sanitizeWalkIns,
} from './sharedState.js';

/** check_ins rows -> { [guestId]: { checkedIn, at } } */
export function checkInsFromRows(rows = []) {
  return sanitizeCheckIns(
    Object.fromEntries(
      rows.map((row) => [row.guest_id, { checkedIn: row.checked_in, at: row.at }]),
    ),
  );
}

/** walk_ins rows -> the walk-in objects the app created */
export function walkInsFromRows(rows = []) {
  return sanitizeWalkIns(rows.map((row) => row.data));
}

/** The single poll_state row -> { activePollId, isOpen, votingRound } */
export function pollStateFromRow(row) {
  return sanitizePollState(
    row
      ? { activePollId: row.active_poll_id, isOpen: row.is_open, votingRound: row.voting_round }
      : null,
  );
}

/** votes rows (one per vote) -> { [pollId]: [count per option] } */
export function votesFromRows(rows = []) {
  const valid = rows.filter(
    (row) =>
      typeof row.poll_id === 'string' &&
      Number.isInteger(row.option_index) &&
      row.option_index >= 0,
  );
  return sanitizeVotes(
    valid.reduce((votes, row) => addVote(votes, row.poll_id, row.option_index), {}),
  );
}

/** App check-in -> check_ins row */
export function checkInToRow(guestId, { checkedIn, at }) {
  return { guest_id: guestId, checked_in: checkedIn, at, updated_at: new Date().toISOString() };
}

/** App poll state -> poll_state row update */
export function pollStateToRow({ activePollId, isOpen, votingRound }) {
  return { active_poll_id: activePollId, is_open: isOpen, voting_round: votingRound };
}
