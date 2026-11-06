import { describe, expect, it } from 'vitest';
import { UNKNOWN_TIME_LABEL, formatCheckInTime } from './formatTime.js';

describe('formatCheckInTime', () => {
  it('formats a time in the given locale and time zone', () => {
    const options = { locale: 'en-GB', timeZone: 'Africa/Nairobi' };
    expect(formatCheckInTime('2026-11-20T14:45:00.000Z', options)).toBe('17:45');
  });

  it('says the time is unknown for missing or invalid timestamps', () => {
    expect(formatCheckInTime(null)).toBe(UNKNOWN_TIME_LABEL);
    expect(formatCheckInTime('not a date')).toBe(UNKNOWN_TIME_LABEL);
  });
});
