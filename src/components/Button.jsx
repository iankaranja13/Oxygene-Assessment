// Buttons and button-styled links, so actions look consistent across all screens.
import { Link } from 'react-router';
import styles from './Button.module.css';

function buttonClasses(variant, fullWidth, className) {
  return [styles.button, styles[variant], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(' ');
}

/** A <button>. Defaults to type="button" so it never submits a form by accident. */
export function Button({
  variant = 'primary',
  fullWidth = false,
  className,
  type = 'button',
  ...rest
}) {
  return <button type={type} className={buttonClasses(variant, fullWidth, className)} {...rest} />;
}

/** A router link that looks like a button (navigation, not an action). */
export function LinkButton({ variant = 'primary', fullWidth = false, className, ...rest }) {
  return <Link className={buttonClasses(variant, fullWidth, className)} {...rest} />;
}
