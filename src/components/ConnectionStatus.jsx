// Tells people when the data they see might not be current: a banner while connecting
// or offline, and (for staff) a small badge saying where data is synced.
import { useConnectionStatus } from '../hooks/useConnectionStatus.js';
import { CONNECTION_STATUS } from '../lib/storage/localStore.js';
import Badge from './Badge.jsx';
import styles from './ConnectionStatus.module.css';
import { CheckIcon, WarningIcon } from './icons.jsx';

const BADGES = {
  [CONNECTION_STATUS.LIVE]: { tone: 'success', icon: CheckIcon, label: 'Live' },
  [CONNECTION_STATUS.LOCAL]: { tone: 'neutral', icon: undefined, label: 'This browser only' },
  [CONNECTION_STATUS.CONNECTING]: { tone: 'primary', icon: undefined, label: 'Connecting' },
  [CONNECTION_STATUS.OFFLINE]: { tone: 'warning', icon: WarningIcon, label: 'Offline' },
};

/** Full-width notice under the header; renders nothing when all is well. */
export function ConnectionBanner() {
  const status = useConnectionStatus();
  return (
    <div role="status">
      {status === CONNECTION_STATUS.OFFLINE && (
        <p className={`${styles.banner} ${styles.offline}`}>
          <WarningIcon size={18} />
          Connection lost. Showing the last update; reconnecting&hellip;
        </p>
      )}
      {status === CONNECTION_STATUS.CONNECTING && (
        <p className={`${styles.banner} ${styles.connecting}`}>
          Connecting to the live event&hellip;
        </p>
      )}
    </div>
  );
}

/** Compact badge for the staff header. */
export function ConnectionBadge() {
  const { tone, icon, label } = BADGES[useConnectionStatus()];
  return (
    <span className={styles.badgeWrap} title="Where check-ins and votes are synced">
      <Badge tone={tone} icon={icon}>
        {label}
      </Badge>
    </span>
  );
}
