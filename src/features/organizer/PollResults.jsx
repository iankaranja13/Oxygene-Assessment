// Live results for one poll as horizontal bars, each labelled with its percentage and
// count. Bars update by themselves as votes arrive (the store re-renders this component).
import EmptyState from '../../components/EmptyState.jsx';
import { DashboardIcon } from '../../components/icons.jsx';
import { tallyVotes } from '../../lib/votes.js';
import Panel from './Panel.jsx';
import styles from './PollResults.module.css';

export default function PollResults({ poll, counts }) {
  if (!poll) {
    return (
      <Panel title="Live results">
        <EmptyState icon={DashboardIcon} title="No poll selected" headingLevel={3}>
          Choose a poll in Poll controls to see its results here.
        </EmptyState>
      </Panel>
    );
  }

  const { totalVotes, options } = tallyVotes(poll, counts);
  const leadingCount = Math.max(...options.map((option) => option.count));

  return (
    <Panel title="Live results">
      <div>
        <p className={styles.question}>{poll.question}</p>
        {/* Announced politely to screen readers as votes come in. */}
        <p className={styles.total} aria-live="polite">
          {totalVotes === 1 ? '1 vote' : `${totalVotes} votes`}
        </p>
      </div>
      <ul className={styles.list}>
        {options.map((option) => {
          const isLeading = totalVotes > 0 && option.count === leadingCount;
          return (
            <li
              key={option.label}
              className={[styles.row, isLeading && styles.leading].filter(Boolean).join(' ')}
            >
              <div className={styles.labels}>
                <span>{option.label}</span>
                <span className={styles.numbers}>
                  <span className={styles.percent}>{option.percent}%</span>{' '}
                  <span className={styles.count}>({option.count})</span>
                </span>
              </div>
              {/* Decorative: the numbers above already carry the value. */}
              <div className={styles.track} aria-hidden="true">
                <div className={styles.bar} style={{ width: `${option.percent}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
