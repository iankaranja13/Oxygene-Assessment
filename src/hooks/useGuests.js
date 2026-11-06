// Combines the guest list (plus walk-ins) with live check-in state, so screens get guests
// ready to display.
import { useMemo } from 'react';
import { GUEST_DATA_REPORT, SEED_GUESTS } from '../data/seedGuests.js';
import { countCheckIns, getCheckInStatus } from '../lib/checkIn.js';
import { walkInToGuest } from '../lib/walkIns.js';
import { useSharedState } from './useSharedState.js';

/**
 * @returns {{
 *   guests: object[],     every guest, each with a `status` ({ checkedIn, at })
 *   counts: { checkedIn: number, total: number, percent: number },
 *   walkInCount: number,
 *   dataReport: object,   what normalization found (skipped rows, clashes)
 * }}
 */
export function useGuests() {
  const { checkIns, walkIns } = useSharedState();

  // Recomputed only when check-ins or walk-ins change, not on every render (e.g. keystrokes).
  return useMemo(() => {
    const walkInGuests = walkIns.map(walkInToGuest).filter(Boolean);
    const allGuests = [...SEED_GUESTS, ...walkInGuests];
    return {
      guests: allGuests.map((guest) => ({ ...guest, status: getCheckInStatus(guest, checkIns) })),
      counts: countCheckIns(allGuests, checkIns),
      walkInCount: walkInGuests.length,
      dataReport: GUEST_DATA_REPORT,
    };
  }, [checkIns, walkIns]);
}
