// Turns the raw guest export into clean, consistent guest records.
// This is the boundary between untrusted data and the app: everything after this
// point can rely on every guest having the same shape. It never throws on bad data;
// unusable rows are skipped and reported instead.

import { cleanText, fixAllCapsOrLowerName, foldForSearch } from './text.js';

export const NO_ORGANIZATION = 'No organization';
export const UNNAMED_GUEST = 'Unnamed guest';

export const TICKET_TYPES = Object.freeze({
  GENERAL: 'General',
  VIP: 'VIP',
  PRESS: 'Press',
  SPEAKER: 'Speaker',
  SPONSOR: 'Sponsor',
  // Missing ticket types are NOT assumed to be General: we never guess entitlements.
  UNSPECIFIED: 'Unspecified',
});

/** Labels attached to guests so the UI can warn ushers about data problems. */
export const GUEST_FLAGS = Object.freeze({
  MISSING_NAME: 'missing-name',
  MISSING_ORGANIZATION: 'missing-organization',
  MISSING_CODE: 'missing-code',
  UNKNOWN_TICKET_TYPE: 'unknown-ticket-type',
  SHARED_CODE: 'shared-code',
  SAME_NAME: 'same-name',
});

export const SKIP_REASONS = Object.freeze({
  NOT_AN_OBJECT: 'Not a guest record',
  NO_NAME_OR_CODE: 'No name and no check-in code',
});

// Every spelling of a ticket type seen in exports, mapped to one canonical label.
// Keys are folded (lower case, no accents, single spaces).
const TICKET_TYPE_ALIASES = {
  general: TICKET_TYPES.GENERAL,
  ga: TICKET_TYPES.GENERAL,
  'general admission': TICKET_TYPES.GENERAL,
  standard: TICKET_TYPES.GENERAL,
  vip: TICKET_TYPES.VIP,
  press: TICKET_TYPES.PRESS,
  media: TICKET_TYPES.PRESS,
  speaker: TICKET_TYPES.SPEAKER,
  sponsor: TICKET_TYPES.SPONSOR,
};

// Exports from different tools name the same field differently. First match wins.
const FIELD_ALIASES = {
  id: ['id', 'guestId', 'guest_id'],
  name: ['name', 'fullName', 'full_name', 'guestName', 'guest_name'],
  organization: ['organization', 'organisation', 'org', 'company'],
  ticketType: ['ticketType', 'ticket_type', 'ticket'],
  checkInCode: ['checkInCode', 'check_in_code', 'checkinCode', 'code'],
  checkedIn: ['checkedIn', 'checked_in'],
  checkedInAt: ['checkedInAt', 'checked_in_at'],
};

// Values people type when they mean "no organization".
const ORGANIZATION_PLACEHOLDERS = new Set(['n/a', 'na', 'none', 'null', '-', '--', 'tbc']);
const CHECKED_IN_TRUE_VALUES = new Set(['true', 'yes', 'y', '1']);
const CODE_PREFIX = 'OXY';
const NON_ALPHANUMERIC = /[^A-Z0-9]/g;
const DIGITS_ONLY = /^\d+$/;

/**
 * Converts any way of writing a check-in code to one canonical form, "OXY-1234".
 * Accepts "oxy-1234", "OXY1234", " OXY 1234 ", "1234" and the number 1234.
 * Used both for the guest data and for what an usher types, so they always compare equal.
 * @param {unknown} raw
 * @returns {string | null} null when there is no usable code
 */
export function normalizeCheckInCode(raw) {
  const compact = cleanText(raw).toUpperCase().replace(NON_ALPHANUMERIC, '');
  if (!compact) {
    return null;
  }
  const digits = compact.startsWith(CODE_PREFIX) ? compact.slice(CODE_PREFIX.length) : compact;
  if (DIGITS_ONLY.test(digits)) {
    return `${CODE_PREFIX}-${digits}`;
  }
  // Unknown format: keep it (upper case, no punctuation) so it can still match exactly.
  return compact;
}

/**
 * @param {unknown} raw
 * @returns {{ ticketType: string, isKnown: boolean }}
 */
export function normalizeTicketType(raw) {
  const cleaned = cleanText(raw);
  if (!cleaned) {
    return { ticketType: TICKET_TYPES.UNSPECIFIED, isKnown: true };
  }
  const canonical = TICKET_TYPE_ALIASES[foldForSearch(cleaned)];
  if (canonical) {
    return { ticketType: canonical, isKnown: true };
  }
  // Keep unfamiliar types (e.g. "Platinum") visible rather than hiding them.
  return { ticketType: fixAllCapsOrLowerName(cleaned), isKnown: false };
}

/**
 * @param {unknown} raw
 * @returns {string} the organization, or "" if missing or a placeholder like "N/A"
 */
export function normalizeOrganization(raw) {
  const cleaned = cleanText(raw);
  return ORGANIZATION_PLACEHOLDERS.has(cleaned.toLowerCase()) ? '' : cleaned;
}

/**
 * Reads a check-in that was already recorded in the export (e.g. early arrivals).
 * A bad timestamp still counts as checked in, with the time unknown (at: null).
 * @returns {{ checkedIn: boolean, at: string | null }}
 */
export function normalizeSeedCheckIn(rawCheckedIn, rawCheckedInAt) {
  const timestamp = rawCheckedInAt ? new Date(cleanText(rawCheckedInAt)) : null;
  const at = timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp.toISOString() : null;
  const flaggedTrue =
    rawCheckedIn === true || CHECKED_IN_TRUE_VALUES.has(foldForSearch(rawCheckedIn));
  return { checkedIn: flaggedTrue || at !== null, at };
}

/** Returns the first non-empty value among a field's known aliases. */
function readField(record, field) {
  for (const key of FIELD_ALIASES[field]) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Normalizes one raw record. Also used for walk-in guests added at the door.
 * @param {unknown} raw
 * @returns {{ guest: object } | { skipReason: string }}
 */
export function normalizeGuestRecord(raw) {
  if (!isPlainObject(raw)) {
    return { skipReason: SKIP_REASONS.NOT_AN_OBJECT };
  }

  const name = fixAllCapsOrLowerName(cleanText(readField(raw, 'name')));
  const organization = normalizeOrganization(readField(raw, 'organization'));
  const checkInCode = normalizeCheckInCode(readField(raw, 'checkInCode'));
  const { ticketType, isKnown } = normalizeTicketType(readField(raw, 'ticketType'));

  // A guest nobody can search for (no name, no code) is useless at the door.
  if (!name && !checkInCode) {
    return { skipReason: SKIP_REASONS.NO_NAME_OR_CODE };
  }

  const flags = [];
  if (!name) flags.push(GUEST_FLAGS.MISSING_NAME);
  if (!organization) flags.push(GUEST_FLAGS.MISSING_ORGANIZATION);
  if (!checkInCode) flags.push(GUEST_FLAGS.MISSING_CODE);
  if (!isKnown) flags.push(GUEST_FLAGS.UNKNOWN_TICKET_TYPE);

  const guest = {
    // Final, unique ids are assigned once the whole list is known (see assignUniqueIds).
    sourceId: cleanText(readField(raw, 'id')),
    name: name || UNNAMED_GUEST,
    organization: organization || NO_ORGANIZATION,
    ticketType,
    checkInCode,
    seedCheckIn: normalizeSeedCheckIn(readField(raw, 'checkedIn'), readField(raw, 'checkedInAt')),
    flags,
    // One pre-folded string to search, so a search is a cheap substring check.
    // The code is included with and without its dash so "OXY1049" and "1049" both match.
    searchText: foldForSearch(
      [name, organization, checkInCode, checkInCode?.replace('-', '')].filter(Boolean).join(' '),
    ),
  };
  return { guest };
}

/** Two records are the same guest only if every normalized field matches. */
function duplicateKey(guest) {
  return [guest.name, guest.organization, guest.ticketType, guest.checkInCode]
    .map(foldForSearch)
    .join('|');
}

/** Keeps the first record, but carries over a check-in recorded only on the duplicate. */
function mergeDuplicate(kept, duplicate) {
  if (kept.seedCheckIn.checkedIn || !duplicate.seedCheckIn.checkedIn) {
    return kept;
  }
  return { ...kept, seedCheckIn: duplicate.seedCheckIn };
}

function slugify(text) {
  return foldForSearch(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Gives every guest a unique, stable id. Check-ins are stored by id, so ids must be the
 * same on every device and every reload: they depend only on the data, never on randomness.
 */
function assignUniqueIds(guests) {
  const usedIds = new Set();
  return guests.map(({ sourceId, ...guest }) => {
    const baseId = sourceId || `guest-${slugify(guest.checkInCode || guest.name)}`;
    let id = baseId;
    for (let suffix = 2; usedIds.has(id); suffix += 1) {
      id = `${baseId}-${suffix}`;
    }
    usedIds.add(id);
    return { id, ...guest };
  });
}

/**
 * Adds `flag` to every guest that shares a key with another guest.
 * @returns {number} how many groups of clashing guests were found
 */
function flagClashes(guests, getKey, flag) {
  const groups = new Map();
  for (const guest of guests) {
    const key = getKey(guest);
    if (key) {
      groups.set(key, [...(groups.get(key) ?? []), guest]);
    }
  }
  let clashCount = 0;
  for (const group of groups.values()) {
    if (group.length > 1) {
      clashCount += 1;
      group.forEach((guest) => guest.flags.push(flag));
    }
  }
  return clashCount;
}

/**
 * Normalizes the whole guest export.
 * - Skips records that aren't objects or have neither a name nor a code.
 * - Merges exact duplicates (identical after normalization).
 * - Keeps, but flags, guests sharing a code or a name: a human must decide at the door.
 * @param {unknown} rawData the parsed guests.json
 * @returns {{ guests: object[], report: object }}
 */
export function normalizeGuests(rawData) {
  const report = {
    totalRecords: 0,
    guestCount: 0,
    skipped: [],
    mergedDuplicates: 0,
    sharedCodeGroups: 0,
    sameNameGroups: 0,
    error: null,
  };

  if (!Array.isArray(rawData)) {
    report.error = 'Guest data is not a list, so no guests could be loaded.';
    return { guests: [], report };
  }
  report.totalRecords = rawData.length;

  const uniqueGuests = new Map();
  rawData.forEach((raw, index) => {
    const result = normalizeGuestRecord(raw);
    if (result.skipReason) {
      report.skipped.push({ index, reason: result.skipReason });
      return;
    }
    const key = duplicateKey(result.guest);
    const existing = uniqueGuests.get(key);
    if (existing) {
      uniqueGuests.set(key, mergeDuplicate(existing, result.guest));
      report.mergedDuplicates += 1;
    } else {
      uniqueGuests.set(key, result.guest);
    }
  });

  const guests = assignUniqueIds([...uniqueGuests.values()]);
  report.sharedCodeGroups = flagClashes(
    guests,
    (guest) => guest.checkInCode,
    GUEST_FLAGS.SHARED_CODE,
  );
  report.sameNameGroups = flagClashes(
    guests,
    (guest) => (guest.flags.includes(GUEST_FLAGS.MISSING_NAME) ? null : foldForSearch(guest.name)),
    GUEST_FLAGS.SAME_NAME,
  );
  report.guestCount = guests.length;

  return { guests, report };
}
