// Staff navigation between the three views. Only rendered once a device is unlocked with the PIN.
import { NavLink } from 'react-router';
import { ROUTES } from '../lib/constants.js';
import styles from './BottomNav.module.css';
import { CheckInIcon, DashboardIcon, PollIcon } from './icons.jsx';

const NAV_ITEMS = [
  { to: ROUTES.usher, label: 'Check-in', Icon: CheckInIcon },
  { to: ROUTES.poll, label: 'Poll', Icon: PollIcon },
  { to: ROUTES.organizer, label: 'Dashboard', Icon: DashboardIcon },
];

export default function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Staff navigation">
      <ul className={styles.list}>
        {NAV_ITEMS.map(({ to, label, Icon }) => (
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
