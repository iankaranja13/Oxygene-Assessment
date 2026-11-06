// Everything an usher can *do*: check in, undo, check in by code, add a walk-in.
// Each action updates the shared store and sets one feedback message saying what happened,
// usually with an Undo. Components stay simple: they call an action and show `message`.
import { useCallback, useState } from 'react';
import {
  CODE_OUTCOMES,
  NOT_CHECKED_IN,
  createCheckInRecord,
  resolveCodeEntry,
} from '../../lib/checkIn.js';
import { formatCheckInTime } from '../../lib/formatTime.js';
import { appStore } from '../../lib/storage/appStore.js';
import { createWalkIn } from '../../lib/walkIns.js';

const UNDO_LABEL = 'Undo';

function describeStatus({ checkedIn }) {
  return checkedIn ? 'checked in' : 'not checked in';
}

export function useCheckInActions() {
  const [message, setMessage] = useState(null);
  const dismissMessage = useCallback(() => setMessage(null), []);

  /** Puts a guest back to exactly how they were before the last change. */
  const restoreStatus = useCallback(async (guest, previousStatus) => {
    const result = await appStore.setCheckIn(guest.id, previousStatus);
    setMessage(
      result.ok
        ? { tone: 'info', text: `Undone. ${guest.name} is ${describeStatus(previousStatus)}.` }
        : { tone: 'error', text: result.error },
    );
  }, []);

  /**
   * Saves a new status for a guest and offers Undo. If the store reports a problem
   * (storage blocked, network down) the usher sees it: nothing fails silently.
   */
  const changeStatus = useCallback(
    async (guest, nextStatus, { tone, text }) => {
      const previousStatus = guest.status;
      const result = await appStore.setCheckIn(guest.id, nextStatus);
      if (!result.ok) {
        setMessage({ tone: 'error', text: `${guest.name}: ${result.error}` });
        return;
      }
      setMessage({
        tone,
        text,
        actionLabel: UNDO_LABEL,
        onAction: () => restoreStatus(guest, previousStatus),
      });
    },
    [restoreStatus],
  );

  const checkIn = useCallback(
    async (guest) => {
      // Guards against a double tap, or a guest another usher has just checked in.
      if (guest.status.checkedIn) {
        setMessage({
          tone: 'warning',
          text: `${guest.name} is already checked in (${formatCheckInTime(guest.status.at)}).`,
        });
        return;
      }
      await changeStatus(guest, createCheckInRecord(), {
        tone: 'success',
        text: `Checked in. Welcome, ${guest.name}!`,
      });
    },
    [changeStatus],
  );

  const undoCheckIn = useCallback(
    (guest) =>
      changeStatus(guest, NOT_CHECKED_IN, {
        tone: 'info',
        text: `${guest.name} is marked as not checked in.`,
      }),
    [changeStatus],
  );

  /**
   * Handles a typed code (our stand-in for scanning a QR code).
   * @returns {Promise<{ outcome: string, code: string | null, guests: object[] }>}
   *   so the code form can decide whether to clear itself or show a choice of guests.
   */
  const checkInByCode = useCallback(
    async (guests, input) => {
      const result = resolveCodeEntry(guests, input);
      const [guest] = result.guests;

      switch (result.outcome) {
        case CODE_OUTCOMES.EMPTY:
          setMessage({ tone: 'error', text: 'Type a check-in code first.' });
          break;
        case CODE_OUTCOMES.NOT_FOUND:
          setMessage({
            tone: 'error',
            text: `No guest has the code ${result.code}. Check it, or search by name.`,
          });
          break;
        case CODE_OUTCOMES.AMBIGUOUS:
          setMessage({
            tone: 'warning',
            text: `${result.guests.length} guests share ${result.code}. Ask for their name, then choose below.`,
          });
          break;
        case CODE_OUTCOMES.ALREADY_CHECKED_IN:
        case CODE_OUTCOMES.READY:
          await checkIn(guest);
          break;
        default:
          // Unreachable unless a new outcome is added without handling it here.
          throw new Error(`Unhandled code outcome: ${result.outcome}`);
      }
      return result;
    },
    [checkIn],
  );

  /** Adds someone who isn't on the list and checks them in straight away. */
  const addWalkIn = useCallback(
    async (input) => {
      const walkIn = createWalkIn(input);
      const added = await appStore.addWalkIn(walkIn);
      if (!added.ok) {
        setMessage({ tone: 'error', text: added.error });
        return null;
      }
      const walkInAsGuest = { id: walkIn.id, name: walkIn.name, status: NOT_CHECKED_IN };
      await changeStatus(walkInAsGuest, createCheckInRecord(), {
        tone: 'success',
        text: `Added and checked in. Welcome, ${walkIn.name}!`,
      });
      return walkIn;
    },
    [changeStatus],
  );

  return { message, dismissMessage, checkIn, undoCheckIn, checkInByCode, addWalkIn };
}
