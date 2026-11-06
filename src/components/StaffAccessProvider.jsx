// Holds which staff role (if any) this device is unlocked as, and shares it via context.
import { useCallback, useMemo, useState } from 'react';
import { StaffAccessContext } from '../hooks/useStaffAccess.js';
import { readStaffRole, writeStaffRole } from '../lib/staffAccess.js';

export default function StaffAccessProvider({ children }) {
  // Lazy initial state: read sessionStorage once, not on every render.
  const [role, setRole] = useState(readStaffRole);

  const unlockAs = useCallback((nextRole) => {
    writeStaffRole(nextRole);
    setRole(nextRole);
  }, []);

  const lock = useCallback(() => {
    writeStaffRole(null);
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({ role, isStaff: role !== null, unlockAs, lock }),
    [role, unlockAs, lock],
  );
  return <StaffAccessContext.Provider value={value}>{children}</StaffAccessContext.Provider>;
}
