// A friendly message for "nothing here yet", "no results" or "something went wrong",
// always saying what happened and what to do next.
import styles from './EmptyState.module.css';

export default function EmptyState({
  icon: IconComponent,
  title,
  children,
  actions,
  tone = 'neutral',
  headingLevel = 2,
}) {
  const Heading = `h${headingLevel}`;
  return (
    <div className={[styles.empty, tone === 'error' && styles.error].filter(Boolean).join(' ')}>
      {IconComponent && (
        <span className={styles.icon}>
          <IconComponent size={28} />
        </span>
      )}
      <Heading className={styles.title}>{title}</Heading>
      {children && <div className={styles.body}>{children}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
