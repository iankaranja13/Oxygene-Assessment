// Layout used by every route: header, main content area (<Outlet />) and, for staff only, the bottom nav.
import { Outlet, useNavigate } from 'react-router';
import { useStaffAccess } from '../hooks/useStaffAccess.js';
import { ROUTES } from '../lib/constants.js';
import { ROLE_LABELS, staffRoutesForRole } from '../lib/staffAccess.js';
import Badge from './Badge.jsx';
import styles from './AppShell.module.css';
import BottomNav from './BottomNav.jsx';
import { ConnectionBadge, ConnectionBanner } from './ConnectionStatus.jsx';
import { LockIcon } from './icons.jsx';
import Wordmark from './Wordmark.jsx';

const MAIN_CONTENT_ID = 'main-content';

export default function AppShell() {
  const { role, isStaff, lock } = useStaffAccess();
  const navigate = useNavigate();
  // A nav with one item is pointless, so ushers (check-in only) don't get one.
  const showNav = staffRoutesForRole(role).length > 1;

  function lockAndLeave() {
    lock();
    navigate(ROUTES.home);
  }

  return (
    <>
      <a className={styles.skipLink} href={`#${MAIN_CONTENT_ID}`}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Wordmark />
          {isStaff && (
            <div className={styles.headerActions}>
              <ConnectionBadge />
              <Badge tone="primary">{ROLE_LABELS[role]}</Badge>
              <button
                type="button"
                className={styles.lockButton}
                onClick={lockAndLeave}
                aria-label="Lock staff screens on this device"
              >
                <LockIcon size={18} />
                Lock
              </button>
            </div>
          )}
        </div>
        <ConnectionBanner />
      </header>
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className={[styles.main, showNav && styles.withNav].filter(Boolean).join(' ')}
      >
        <Outlet />
      </main>
      {showNav && <BottomNav role={role} />}
    </>
  );
}
