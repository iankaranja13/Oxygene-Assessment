// A horizontal progress bar exposed to assistive technology as a real progressbar.
import styles from './ProgressBar.module.css';

const MAX_PERCENT = 100;

export default function ProgressBar({ percent, label }) {
  const clamped = Math.min(MAX_PERCENT, Math.max(0, percent));
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={MAX_PERCENT}
      aria-valuenow={clamped}
    >
      <div className={styles.fill} style={{ width: `${clamped}%` }} />
    </div>
  );
}
