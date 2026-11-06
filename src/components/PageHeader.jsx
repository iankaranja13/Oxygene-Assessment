// Consistent page heading (the one <h1> per screen) with an optional short description.
import { usePageTitle } from '../hooks/usePageTitle.js';
import styles from './PageHeader.module.css';

export default function PageHeader({ title, description }) {
  usePageTitle(title);
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}
