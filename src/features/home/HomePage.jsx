// Welcome screen at "/". One box: guests type their check-in code, staff type their PIN,
// and each is taken to their own screen. Returning visitors get a "continue" button.
import { Button, LinkButton } from '../../components/Button.jsx';
import { CheckInIcon, DashboardIcon, PollIcon } from '../../components/icons.jsx';
import SignInForm from '../../components/SignInForm.jsx';
import { useAttendeeCode } from '../../hooks/useAttendeeCode.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useStaffAccess } from '../../hooks/useStaffAccess.js';
import { ROUTES } from '../../lib/constants.js';
import { HOME_ROUTE_FOR_ROLE } from '../../lib/signIn.js';
import { ROLE_LABELS, STAFF_ROLES } from '../../lib/staffAccess.js';
import styles from './HomePage.module.css';

const STAFF_DESTINATIONS = {
  [STAFF_ROLES.USHER]: { label: 'Go to guest check-in', Icon: CheckInIcon },
  [STAFF_ROLES.ORGANIZER]: { label: 'Open the dashboard', Icon: DashboardIcon },
};

export default function HomePage() {
  usePageTitle('Welcome');
  const { role, lock } = useStaffAccess();
  const attendee = useAttendeeCode();

  if (role) {
    const { label, Icon } = STAFF_DESTINATIONS[role];
    return (
      <div className={styles.page}>
        <section className={styles.card} aria-labelledby="welcome-title">
          <h1 id="welcome-title" className={styles.title}>
            Welcome back
          </h1>
          <p className={styles.cardText}>
            You&rsquo;re signed in as {ROLE_LABELS[role].toLowerCase()} on this device.
          </p>
          <LinkButton to={HOME_ROUTE_FOR_ROLE[role]} fullWidth>
            <Icon />
            {label}
          </LinkButton>
          <Button variant="secondary" fullWidth onClick={lock}>
            Sign out
          </Button>
        </section>
      </div>
    );
  }

  if (attendee.code) {
    return (
      <div className={styles.page}>
        <section className={styles.card} aria-labelledby="welcome-title">
          <h1 id="welcome-title" className={styles.title}>
            Welcome back
          </h1>
          <p className={styles.cardText}>
            You&rsquo;re signed in with check-in code <strong>{attendee.code}</strong>.
          </p>
          <LinkButton to={ROUTES.poll} fullWidth>
            <PollIcon />
            Go to the live poll
          </LinkButton>
          <Button variant="secondary" fullWidth onClick={attendee.forget}>
            Not you? Sign out
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SignInForm
        title="Welcome to the launch"
        intro="Guests: enter the check-in code on your ticket to join the live poll. Event staff: enter your staff PIN."
      />
    </div>
  );
}
