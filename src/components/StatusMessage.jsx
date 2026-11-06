// Announces the result of an action ("Checked in: Amina. Undo") visually and to screen readers.
// The live region wrapper is always rendered: screen readers only announce changes to a
// region that already exists, not one that appears with its content already inside.
import styles from './StatusMessage.module.css';
import { AlertIcon, CheckIcon, CloseIcon, WarningIcon } from './icons.jsx';

const TONE_ICONS = {
  success: CheckIcon,
  warning: WarningIcon,
  error: AlertIcon,
  info: AlertIcon,
};

/**
 * @param {{ message: { tone: string, text: string, actionLabel?: string, onAction?: () => void } | null,
 *           onDismiss: () => void }} props
 */
export default function StatusMessage({ message, onDismiss }) {
  const Icon = message ? TONE_ICONS[message.tone] : null;
  return (
    // Errors interrupt (assertive); everything else waits for a pause (polite).
    <div aria-live={message?.tone === 'error' ? 'assertive' : 'polite'} aria-atomic="true">
      {message && (
        <div className={`${styles.message} ${styles[message.tone]}`}>
          <span className={styles.icon}>
            <Icon />
          </span>
          <p className={styles.text}>{message.text}</p>
          {message.actionLabel && (
            <button type="button" className={styles.actionButton} onClick={message.onAction}>
              {message.actionLabel}
            </button>
          )}
          <button
            type="button"
            className={styles.dismissButton}
            onClick={onDismiss}
            aria-label="Dismiss message"
          >
            <CloseIcon size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
