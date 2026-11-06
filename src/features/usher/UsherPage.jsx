// Usher screen. Two ways to check a guest in, both ending in one tap:
//   Find guest: type a name, organization or code, then tap "Check in" on their card.
//   Enter code: type the ticket code, then press "Check in" (our stand-in for scanning a QR code).
// Every action shows a message (with Undo) just under the input, where the usher is looking.
import { useMemo, useRef, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { AlertIcon, CodeIcon, SearchIcon, UserPlusIcon } from '../../components/icons.jsx';
import StatusMessage from '../../components/StatusMessage.jsx';
import { useGuests } from '../../hooks/useGuests.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { CODE_OUTCOMES } from '../../lib/checkIn.js';
import { searchGuests } from '../../lib/search.js';
import CodeEntry from './CodeEntry.jsx';
import GuestList from './GuestList.jsx';
import ModeSwitch from './ModeSwitch.jsx';
import SearchBox from './SearchBox.jsx';
import { useCheckInActions } from './useCheckInActions.js';
import styles from './UsherPage.module.css';
import { USHER_MODES } from './usherModes.js';
import WalkInForm from './WalkInForm.jsx';

const PAGE_TITLE = 'Check-in';

export default function UsherPage() {
  usePageTitle(PAGE_TITLE);
  const [mode, setMode] = useState(USHER_MODES.SEARCH);
  const [query, setQuery] = useState('');
  // When a typed code belongs to several guests, we remember the code and list them.
  const [ambiguousCode, setAmbiguousCode] = useState(null);
  const searchInputRef = useRef(null);
  const { guests, counts, dataReport } = useGuests();
  const actions = useCheckInActions();

  // Searching ~150 guests is instant, so it simply re-runs whenever the query or data changes.
  const { results, totalMatches } = useMemo(() => searchGuests(guests, query), [guests, query]);

  // Read from the live list (not a snapshot) so each card's status updates after a tap.
  const guestsSharingCode = useMemo(
    () => (ambiguousCode ? guests.filter((guest) => guest.checkInCode === ambiguousCode) : []),
    [guests, ambiguousCode],
  );

  function changeMode(nextMode) {
    setMode(nextMode);
    setAmbiguousCode(null);
    actions.dismissMessage();
  }

  async function checkInFromSearch(guest) {
    await actions.checkIn(guest);
    // Select the query so typing the next name replaces it, while the card stays visible.
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }

  async function addWalkIn(input) {
    const walkIn = await actions.addWalkIn(input);
    if (walkIn) {
      // Back to search, showing the new guest's card with its "Checked in" status.
      setMode(USHER_MODES.SEARCH);
      setQuery(walkIn.name);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{PAGE_TITLE}</h1>
        <p className={styles.progress}>
          {counts.checkedIn} of {counts.total} checked in
        </p>
      </div>

      <div className={styles.controls}>
        {mode !== USHER_MODES.WALK_IN && <ModeSwitch mode={mode} onChange={changeMode} />}
        {mode === USHER_MODES.SEARCH && (
          <SearchBox value={query} onChange={setQuery} inputRef={searchInputRef} />
        )}
        {mode === USHER_MODES.CODE && (
          <CodeEntry
            onSubmitCode={(code) => actions.checkInByCode(guests, code)}
            onResult={(result) =>
              setAmbiguousCode(result.outcome === CODE_OUTCOMES.AMBIGUOUS ? result.code : null)
            }
          />
        )}
        <StatusMessage message={actions.message} onDismiss={actions.dismissMessage} />
      </div>

      {renderBody()}
    </div>
  );

  function renderBody() {
    if (guests.length === 0) {
      return (
        <EmptyState icon={AlertIcon} tone="error" title="The guest list couldn't be loaded">
          {dataReport.error ?? 'No guests were found in the list.'} Ask the organizer to check the
          guest file.
        </EmptyState>
      );
    }
    if (mode === USHER_MODES.WALK_IN) {
      return (
        <WalkInForm
          initialName={query.trim()}
          guests={guests}
          onAdd={addWalkIn}
          onCancel={() => changeMode(USHER_MODES.SEARCH)}
        />
      );
    }
    if (mode === USHER_MODES.CODE) {
      return guestsSharingCode.length > 0 ? (
        <GuestList
          guests={guestsSharingCode}
          totalMatches={guestsSharingCode.length}
          onCheckIn={actions.checkIn}
          onUndo={actions.undoCheckIn}
        />
      ) : (
        <EmptyState icon={CodeIcon} title="Ready for the next guest">
          Type the code from their ticket and press Check in.
        </EmptyState>
      );
    }
    return renderSearchResults();
  }

  function renderSearchResults() {
    const walkInButton = (label) => (
      <Button variant="secondary" onClick={() => changeMode(USHER_MODES.WALK_IN)}>
        <UserPlusIcon />
        {label}
      </Button>
    );

    if (!query.trim()) {
      return (
        <EmptyState icon={SearchIcon} title="Find a guest" actions={walkInButton('Add a walk-in')}>
          Type part of a name, an organization or a check-in code like 1049.
        </EmptyState>
      );
    }
    if (totalMatches === 0) {
      return (
        <EmptyState
          icon={SearchIcon}
          title={`No guests match “${query.trim()}”`}
          actions={walkInButton('Not on the list? Add a walk-in')}
        >
          Check the spelling, try their surname or organization, or type their code.
        </EmptyState>
      );
    }
    return (
      <GuestList
        guests={results}
        totalMatches={totalMatches}
        onCheckIn={checkInFromSearch}
        onUndo={actions.undoCheckIn}
      />
    );
  }
}
