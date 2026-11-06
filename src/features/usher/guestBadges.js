// Maps guest data (ticket type, data-quality flags) to the badges an usher sees.
// Kept separate from the card component so the wording lives in one place.
import { GUEST_FLAGS, TICKET_TYPES } from '../../lib/normalizeGuests.js';

/** Data warnings worth showing at the door. Missing name/organization show in the text instead. */
const FLAG_BADGES = {
  [GUEST_FLAGS.SHARED_CODE]: { label: 'Shares a code', tone: 'warning' },
  [GUEST_FLAGS.SAME_NAME]: { label: 'Same name as another guest', tone: 'warning' },
  [GUEST_FLAGS.MISSING_CODE]: { label: 'No code on list', tone: 'neutral' },
  [GUEST_FLAGS.UNKNOWN_TICKET_TYPE]: { label: 'Unusual ticket type', tone: 'neutral' },
  [GUEST_FLAGS.WALK_IN]: { label: 'Walk-in', tone: 'primary' },
};

const TICKET_TONES = {
  [TICKET_TYPES.VIP]: 'accent',
  [TICKET_TYPES.SPEAKER]: 'primary',
  [TICKET_TYPES.SPONSOR]: 'primary',
  [TICKET_TYPES.PRESS]: 'primary',
};

/** @returns {{ flag: string, label: string, tone: string }[]} */
export function getFlagBadges(flags) {
  return flags.filter((flag) => FLAG_BADGES[flag]).map((flag) => ({ flag, ...FLAG_BADGES[flag] }));
}

/** @returns {string} badge tone for a ticket type; anything unusual is neutral */
export function getTicketTone(ticketType) {
  return TICKET_TONES[ticketType] ?? 'neutral';
}
