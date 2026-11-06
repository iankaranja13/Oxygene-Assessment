// Context + hook giving any component access to the staff unlock state.
import { createContext, useContext } from 'react';

/** @type {import('react').Context<{isStaff: boolean, unlock: (pin: string) => boolean, lock: () => void} | null>} */
export const StaffAccessContext = createContext(null);

export function useStaffAccess() {
  const value = useContext(StaffAccessContext);
  if (!value) {
    // Fails loudly in development if a component is rendered outside the provider.
    throw new Error('useStaffAccess must be used inside <StaffAccessProvider>');
  }
  return value;
}
