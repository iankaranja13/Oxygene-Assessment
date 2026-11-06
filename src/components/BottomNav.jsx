// Staff navigation between the screens a role may open. Ushers have a single screen, so
// AppShell doesn't show a nav for them; organizers get Dashboard and Check-in.
// Attendees never see it.
import { NavLink } from 'react-router';
import { ROUTES } from '../lib/constants.js';
import { staffRoutesForRole } from '../lib/staffAccess.js';
import styles from './BottomNav.module.css';
import { CheckInIcon, DashboardIcon } from './icons.jsx';

const NAV_ITEMS = {
  [ROUTES.organizer]: { label: 'Dashboard', Icon: DashboardIcon },
  [ROUTES.usher]: { label: 'Check-in', Icon: CheckInIcon },
};

export default function BottomNav({ role }) {
  return (
    <nav className={styles.nav} aria-label="Staff navigation">
      <ul className={styles.list}>
        {staffRoutesForRole(role).map((to) => {
          const { label, Icon } = NAV_ITEMS[to];
          return (
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
          );
        })}
      </ul>
    </nav>
  );
}
