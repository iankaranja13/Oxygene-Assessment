// Usher screen: search the guest list and see each guest's status.
// Flow: the screen opens with the keyboard up -> type -> matching guests appear instantly.
import { useMemo, useRef, useState } from 'react';
import EmptyState from '../../components/EmptyState.jsx';
import { AlertIcon, SearchIcon } from '../../components/icons.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useGuests } from '../../hooks/useGuests.js';
import { searchGuests } from '../../lib/search.js';
import GuestList from './GuestList.jsx';
import SearchBox from './SearchBox.jsx';
import styles from './UsherPage.module.css';

const PAGE_TITLE = 'Check-in';

export default function UsherPage() {
  usePageTitle(PAGE_TITLE);
  const [query, setQuery] = useState('');
  const searchInputRef = useRef(null);
  const { guests, counts, dataReport } = useGuests();

  // Searching ~150 guests is instant, so it simply re-runs whenever the query or data changes.
  const { results, totalMatches } = useMemo(() => searchGuests(guests, query), [guests, query]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{PAGE_TITLE}</h1>
        <p className={styles.progress}>
          {counts.checkedIn} of {counts.total} checked in
        </p>
      </div>

      <SearchBox value={query} onChange={setQuery} inputRef={searchInputRef} />

      {renderResults()}
    </div>
  );

  function renderResults() {
    if (guests.length === 0) {
      return (
        <EmptyState icon={AlertIcon} tone="error" title="The guest list couldn't be loaded">
          {dataReport.error ?? 'No guests were found in the list.'} Ask the organizer to check the
          guest file.
        </EmptyState>
      );
    }
    if (!query.trim()) {
      return (
        <EmptyState icon={SearchIcon} title="Find a guest">
          Type part of a name, an organization or a check-in code like 1049.
        </EmptyState>
      );
    }
    if (totalMatches === 0) {
      return (
        <EmptyState icon={SearchIcon} title={`No guests match “${query.trim()}”`}>
          Check the spelling, try their surname or organization, or type their code.
        </EmptyState>
      );
    }
    return <GuestList guests={results} totalMatches={totalMatches} />;
  }
}
