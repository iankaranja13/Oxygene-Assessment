// Holds the "is this device unlocked for staff?" state and shares it via context.
import { useCallback, useMemo, useState } from 'react';
import { StaffAccessContext } from '../hooks/useStaffAccess.js';
import {
  STAFF_PIN,
  isCorrectPin,
  readStaffUnlocked,
  writeStaffUnlocked,
} from '../lib/staffAccess.js';

export default function StaffAccessProvider({ children }) {
  // Lazy initial state: read sessionStorage once, not on every render.
  const [isStaff, setIsStaff] = useState(readStaffUnlocked);

  const unlock = useCallback((pin) => {
    const correct = isCorrectPin(pin, STAFF_PIN);
    if (correct) {
      writeStaffUnlocked(true);
      setIsStaff(true);
    }
    return correct;
  }, []);

  const lock = useCallback(() => {
    writeStaffUnlocked(false);
    setIsStaff(false);
  }, []);

  const value = useMemo(() => ({ isStaff, unlock, lock }), [isStaff, unlock, lock]);
  return <StaffAccessContext.Provider value={value}>{children}</StaffAccessContext.Provider>;
}
