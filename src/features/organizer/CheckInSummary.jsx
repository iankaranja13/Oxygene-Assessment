// Headline check-in progress: "34 / 146 checked in", the percentage and a progress bar.
import ProgressBar from '../../components/ProgressBar.jsx';
import Panel from './Panel.jsx';
import styles from './CheckInSummary.module.css';

export default function CheckInSummary({ counts, walkInCount }) {
  const remaining = counts.total - counts.checkedIn;
  return (
    <Panel title="Check-ins">
      <p className={styles.headline}>
        <span className={styles.count}>{counts.checkedIn}</span>
        <span className={styles.total}>of {counts.total} checked in</span>
        <span className={styles.percent}>{counts.percent}%</span>
      </p>
      <ProgressBar percent={counts.percent} label="Guests checked in" />
      <p className={styles.details}>
        {remaining} still to arrive
        {walkInCount > 0 && ` · includes ${walkInCount} walk-in${walkInCount === 1 ? '' : 's'}`}
      </p>
    </Panel>
  );
}
