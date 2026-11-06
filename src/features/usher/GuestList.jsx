// The list of matching guests, with a live count announced to screen readers.
import GuestCard from './GuestCard.jsx';
import styles from './GuestList.module.css';

export default function GuestList({ guests, totalMatches }) {
  const isTruncated = totalMatches > guests.length;
  return (
    <>
      {/* role="status" announces the count politely as the usher types. */}
      <p className={styles.summary} role="status">
        {totalMatches === 1 ? '1 guest found' : `${totalMatches} guests found`}
      </p>
      <ul className={styles.list}>
        {guests.map((guest) => (
          <li key={guest.id}>
            <GuestCard guest={guest} />
          </li>
        ))}
      </ul>
      {isTruncated && (
        <p className={styles.moreHint}>
          Showing the first {guests.length}. Keep typing to narrow it down.
        </p>
      )}
    </>
  );
}
