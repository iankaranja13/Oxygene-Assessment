// Formats check-in times for display, e.g. "7:45 PM", in the device's own locale and time zone.

export const UNKNOWN_TIME_LABEL = 'time unknown';

/**
 * @param {string | null} isoTimestamp
 * @param {{ locale?: string, timeZone?: string }} [options] injectable for predictable tests
 * @returns {string}
 */
export function formatCheckInTime(isoTimestamp, { locale, timeZone } = {}) {
  const date = isoTimestamp ? new Date(isoTimestamp) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return UNKNOWN_TIME_LABEL;
  }
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone }).format(
    date,
  );
}
