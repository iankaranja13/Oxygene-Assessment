// Organizer dashboard: live check-in progress, live poll results, poll controls,
// a summary of the guest-data clean-up, and the demo reset.
// Everything reads from the shared store, so it updates as ushers and attendees act.
import { useState } from 'react';
import StatusMessage from '../../components/StatusMessage.jsx';
import { useGuests } from '../../hooks/useGuests.js';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { usePolls } from '../../hooks/usePolls.js';
import { appStore } from '../../lib/storage/appStore.js';
import { clearDeviceVotes } from '../../lib/storage/deviceFlags.js';
import CheckInSummary from './CheckInSummary.jsx';
import DataNotes from './DataNotes.jsx';
import styles from './OrganizerPage.module.css';
import PollControls from './PollControls.jsx';
import PollResults from './PollResults.jsx';
import ResetDemo from './ResetDemo.jsx';

const PAGE_TITLE = 'Dashboard';

export default function OrganizerPage() {
  usePageTitle(PAGE_TITLE);
  const { counts, walkInCount, dataReport } = useGuests();
  const { polls, pollState, activePoll, votes } = usePolls();
  const [message, setMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  /** Runs a store action, then reports success or the store's error. */
  async function runAction(action, successMessage) {
    setIsSaving(true);
    try {
      const result = await action();
      setMessage(
        result.ok
          ? { tone: 'success', text: successMessage }
          : { tone: 'error', text: result.error },
      );
    } finally {
      setIsSaving(false);
    }
  }

  function describePollChange(changes) {
    if ('isOpen' in changes && !('activePollId' in changes)) {
      return changes.isOpen ? 'Voting is open on attendees’ phones.' : 'Voting is closed.';
    }
    return changes.activePollId
      ? 'Poll shown on phones. Voting is closed until you open it.'
      : 'Phones now show the waiting screen.';
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{PAGE_TITLE}</h1>
        <StatusMessage message={message} onDismiss={() => setMessage(null)} />
      </div>

      <div className={styles.grid}>
        <div className={styles.checkins}>
          <CheckInSummary counts={counts} walkInCount={walkInCount} />
        </div>
        <div className={styles.controls}>
          <PollControls
            polls={polls}
            pollState={pollState}
            votes={votes}
            isSaving={isSaving}
            onChange={(changes) =>
              runAction(() => appStore.setPollState(changes), describePollChange(changes))
            }
          />
        </div>
        <div className={styles.results}>
          <PollResults poll={activePoll} counts={activePoll ? votes[activePoll.id] : undefined} />
        </div>
        <div className={styles.notes}>
          <DataNotes report={dataReport} />
        </div>
        <div className={styles.reset}>
          <ResetDemo
            isSaving={isSaving}
            onReset={() =>
              runAction(async () => {
                clearDeviceVotes();
                return appStore.resetAll();
              }, 'Demo data reset. Every phone can vote again.')
            }
          />
        </div>
      </div>
    </div>
  );
}
