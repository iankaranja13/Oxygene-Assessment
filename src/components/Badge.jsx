// A small label (ticket type, status, data warning). The text carries the meaning;
// colour and the optional icon only reinforce it.
// Tones: neutral, success, warning, error, accent, primary (see Badge.module.css).
import styles from './Badge.module.css';

export default function Badge({ tone = 'neutral', icon: IconComponent, children }) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {IconComponent && <IconComponent size={16} />}
      {children}
    </span>
  );
}
