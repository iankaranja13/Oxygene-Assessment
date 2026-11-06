// A titled card used for each section of the dashboard.
import { useId } from 'react';
import styles from './Panel.module.css';

export default function Panel({ title, children, className }) {
  const titleId = useId();
  return (
    <section
      className={[styles.panel, className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {children}
    </section>
  );
}
