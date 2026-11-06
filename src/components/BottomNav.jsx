// Staff navigation. Only rendered once a device is unlocked, and only shows the screens
// that role may open: ushers get Check-in and Poll; organizers also get Dashboard.
import { NavLink } from 'react-router';
import { ROUTES } from '../lib/constants.js';
import { ROUTE_ROLES, canAccess } from '../lib/staffAccess.js';
import styles from './BottomNav.module.css';
import { CheckInIcon, DashboardIcon, PollIcon } from './icons.jsx';

const NAV_ITEMS = [
  { to: ROUTES.usher, label: 'Check-in', Icon: CheckInIcon },
  { to: ROUTES.poll, label: 'Poll', Icon: PollIcon },
  { to: ROUTES.organizer, label: 'Dashboard', Icon: DashboardIcon },
];

export default function BottomNav({ role }) {
  // Public routes (like Poll) have no required role, so every staff member sees them.
  const visibleItems = NAV_ITEMS.filter(
    ({ to }) => !ROUTE_ROLES[to] || canAccess(role, ROUTE_ROLES[to]),
  );
  return (
    <nav className={styles.nav} aria-label="Staff navigation">
      <ul className={styles.list}>
        {visibleItems.map(({ to, label, Icon }) => (
          <li key={to}>
            {/* NavLink sets aria-current="page" on the active link automatically. */}
            <NavLink
              to={to}
              className={({ isActive }) =>
                [styles.link, isActive && styles.active].filter(Boolean).join(' ')
              }
            >
              <Icon />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
