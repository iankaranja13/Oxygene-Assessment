// Landing screen: sends guests to the poll and staff to check-in or the dashboard.
import { LinkButton } from '../../components/Button.jsx';
import { CheckInIcon, DashboardIcon, PollIcon } from '../../components/icons.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { ROUTES } from '../../lib/constants.js';
import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Welcome to the launch"
        description="Glad you're here. Where would you like to go?"
      />

      <section className={styles.card} aria-labelledby="guests-title">
        <h2 id="guests-title" className={styles.cardTitle}>
          Guests
        </h2>
        <p className={styles.cardText}>Have your say during the presentation.</p>
        <LinkButton to={ROUTES.poll} fullWidth>
          <PollIcon />
          Join the live poll
        </LinkButton>
      </section>

      <section className={styles.card} aria-labelledby="staff-title">
        <h2 id="staff-title" className={styles.cardTitle}>
          Event staff
        </h2>
        <p className={styles.cardText}>You&rsquo;ll need the staff PIN.</p>
        <div className={styles.staffLinks}>
          <LinkButton to={ROUTES.usher} variant="secondary">
            <CheckInIcon />
            Guest check-in
          </LinkButton>
          <LinkButton to={ROUTES.organizer} variant="secondary">
            <DashboardIcon />
            Dashboard
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
