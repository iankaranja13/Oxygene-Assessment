// One guest in the search results: who they are, their ticket, status and any data warnings.
import Badge from '../../components/Badge.jsx';
import { CheckIcon, WarningIcon } from '../../components/icons.jsx';
import { formatCheckInTime } from '../../lib/formatTime.js';
import { GUEST_FLAGS } from '../../lib/normalizeGuests.js';
import styles from './GuestCard.module.css';
import { getFlagBadges, getTicketTone } from './guestBadges.js';

export default function GuestCard({ guest }) {
  const { checkedIn, at } = guest.status;
  const nameIsPlaceholder = guest.flags.includes(GUEST_FLAGS.MISSING_NAME);
  const organizationIsPlaceholder = guest.flags.includes(GUEST_FLAGS.MISSING_ORGANIZATION);
  const nameId = `guest-${guest.id}-name`;

  return (
    <article
      className={[styles.card, checkedIn && styles.checkedIn].filter(Boolean).join(' ')}
      aria-labelledby={nameId}
    >
      <div className={styles.topRow}>
        <h2
          id={nameId}
          className={[styles.name, nameIsPlaceholder && styles.placeholder].join(' ')}
        >
          {guest.name}
        </h2>
        {checkedIn ? (
          <Badge tone="success" icon={CheckIcon}>
            Checked in · {formatCheckInTime(at)}
          </Badge>
        ) : (
          <Badge>Not checked in</Badge>
        )}
      </div>

      <p className={organizationIsPlaceholder ? styles.placeholder : styles.organization}>
        {guest.organization}
      </p>

      <div className={styles.meta}>
        <Badge tone={getTicketTone(guest.ticketType)}>{guest.ticketType}</Badge>
        {guest.checkInCode && (
          <span className={styles.code}>
            <span className="visually-hidden">Code </span>
            {guest.checkInCode}
          </span>
        )}
        {getFlagBadges(guest.flags).map(({ flag, label, tone }) => (
          <Badge key={flag} tone={tone} icon={WarningIcon}>
            {label}
          </Badge>
        ))}
      </div>
    </article>
  );
}
