// Context + hook giving any component the current staff role on this device.
import { createContext, useContext } from 'react';

/**
 * role: 'usher' | 'organizer' | null (not unlocked). isStaff: role !== null.
 * @type {import('react').Context<{ role: string | null, isStaff: boolean,
 *   unlockAs: (role: string) => void, lock: () => void } | null>}
 */
export const StaffAccessContext = createContext(null);

export function useStaffAccess() {
  const value = useContext(StaffAccessContext);
  if (!value) {
    // Fails loudly in development if a component is rendered outside the provider.
    throw new Error('useStaffAccess must be used inside <StaffAccessProvider>');
  }
  return value;
}
