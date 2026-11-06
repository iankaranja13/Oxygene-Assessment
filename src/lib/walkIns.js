// Walk-in guests: people who arrive but aren't on the list. Ushers add them at the door,
// and they then behave like any other guest (searchable, counted, checked in).

import { GUEST_FLAGS, TICKET_TYPES, normalizeGuestRecord } from './normalizeGuests.js';
import { cleanText, fixAllCapsOrLowerName, foldForSearch } from './text.js';

export const WALK_IN_NAME_MIN_LENGTH = 2;
const RANDOM_ID_LENGTH = 6;
const BASE_36 = 36;

/** Ticket types an usher can choose for a walk-in (everything except "Unspecified"). */
export const WALK_IN_TICKET_TYPES = Object.values(TICKET_TYPES).filter(
  (type) => type !== TICKET_TYPES.UNSPECIFIED,
);

/**
 * Checks the walk-in form. A name is required. A name already on the list is not an
 * error (two people can share a name) but is returned so the usher can double-check
 * they aren't about to create a duplicate.
 * @param {{ name: string }} input
 * @param {{ name: string }[]} existingGuests
 * @returns {{ errors: { name?: string }, sameNameGuests: object[] }}
 */
export function validateWalkIn(input, existingGuests) {
  const name = cleanText(input.name);
  const errors = {};
  if (name.length < WALK_IN_NAME_MIN_LENGTH) {
    errors.name = "Enter the guest's name.";
  }
  const foldedName = foldForSearch(name);
  const sameNameGuests = foldedName
    ? existingGuests.filter((guest) => foldForSearch(guest.name) === foldedName)
    : [];
  return { errors, sameNameGuests };
}

/**
 * Builds the walk-in record that gets stored and shared.
 * The id is random (unlike list guests) because it is created once and then stored, so
 * every device reads the same id; the timestamp part keeps ids roughly in order.
 * @param {{ name: string, organization?: string, ticketType?: string }} input
 * @param {Date} [now]
 */
export function createWalkIn(input, now = new Date()) {
  const randomPart = Math.random()
    .toString(BASE_36)
    .slice(2, 2 + RANDOM_ID_LENGTH);
  return {
    id: `walk-in-${now.getTime().toString(BASE_36)}-${randomPart}`,
    name: fixAllCapsOrLowerName(cleanText(input.name)),
    organization: cleanText(input.organization),
    ticketType: WALK_IN_TICKET_TYPES.includes(input.ticketType)
      ? input.ticketType
      : TICKET_TYPES.GENERAL,
    addedAt: now.toISOString(),
  };
}

/**
 * Turns a stored walk-in into a normal guest record, re-validated like list data
 * (stored data is untrusted). Walk-ins have no code, so that warning is dropped.
 * @returns {object | null} null if the stored record is unusable
 */
export function walkInToGuest(walkIn) {
  const result = normalizeGuestRecord(walkIn);
  if (!result.guest) {
    return null;
  }
  // sourceId is dropped: walk-ins use the id they were stored with.
  const { sourceId, flags, ...guest } = result.guest;
  return {
    ...guest,
    id: walkIn.id,
    flags: [...flags.filter((flag) => flag !== GUEST_FLAGS.MISSING_CODE), GUEST_FLAGS.WALK_IN],
  };
}
