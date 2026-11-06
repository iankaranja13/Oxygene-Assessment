// Combines the guest list with live check-in state, so screens get guests ready to display.
import { useMemo } from 'react';
import { GUEST_DATA_REPORT, SEED_GUESTS } from '../data/seed.js';
import { countCheckIns, getCheckInStatus } from '../lib/checkIn.js';
import { useSharedState } from './useSharedState.js';

/**
 * @returns {{
 *   guests: object[],     every guest, each with a `status` ({ checkedIn, at })
 *   counts: { checkedIn: number, total: number, percent: number },
 *   dataReport: object,   what normalization found (skipped rows, clashes)
 * }}
 */
export function useGuests() {
  const { checkIns } = useSharedState();

  // Recomputed only when check-ins change, not on every render (e.g. every keystroke).
  return useMemo(() => {
    const guests = SEED_GUESTS.map((guest) => ({
      ...guest,
      status: getCheckInStatus(guest, checkIns),
    }));
    return {
      guests,
      counts: countCheckIns(SEED_GUESTS, checkIns),
      dataReport: GUEST_DATA_REPORT,
    };
  }, [checkIns]);
}
