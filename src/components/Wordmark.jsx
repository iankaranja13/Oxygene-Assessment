// Oxygene wordmark plus the product name, linking back to the home screen.
import { Link } from 'react-router';
import { APP_NAME, ROUTES } from '../lib/constants.js';
import styles from './Wordmark.module.css';

export default function Wordmark() {
  return (
    <Link to={ROUTES.home} className={styles.wordmark} aria-label={`Oxygene ${APP_NAME}, home`}>
      <span className={styles.brand}>Oxygene</span>
      <span className={styles.product}>{APP_NAME}</span>
    </Link>
  );
}
