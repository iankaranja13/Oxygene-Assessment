// Layout used by every route: header, main content area (<Outlet />) and, for staff only, the bottom nav.
import { Outlet } from 'react-router';
import { useStaffAccess } from '../hooks/useStaffAccess.js';
import styles from './AppShell.module.css';
import BottomNav from './BottomNav.jsx';
import { LockIcon } from './icons.jsx';
import Wordmark from './Wordmark.jsx';

const MAIN_CONTENT_ID = 'main-content';

export default function AppShell() {
  const { isStaff, lock } = useStaffAccess();

  return (
    <>
      <a className={styles.skipLink} href={`#${MAIN_CONTENT_ID}`}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Wordmark />
          {isStaff && (
            <button
              type="button"
              className={styles.lockButton}
              onClick={lock}
              aria-label="Lock staff screens on this device"
            >
              <LockIcon size={18} />
              Lock
            </button>
          )}
        </div>
      </header>
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className={[styles.main, isStaff && styles.withNav].filter(Boolean).join(' ')}
      >
        <Outlet />
      </main>
      {isStaff && <BottomNav />}
    </>
  );
}
