// "Reset demo data": clears check-ins, walk-ins, votes and poll state for everyone, and
// starts a new voting round so every guest may vote again. Created polls are kept. Asks for confirmation first,
// because it can't be undone.
import { useState } from 'react';
import { Button } from '../../components/Button.jsx';
import Panel from './Panel.jsx';
import styles from './ResetDemo.module.css';

export default function ResetDemo({ onReset, isSaving }) {
  const [isConfirming, setIsConfirming] = useState(false);

  async function confirmReset() {
    await onReset();
    setIsConfirming(false);
  }

  return (
    <Panel title="Demo data">
      <p className={styles.text}>
        Start fresh: clears every check-in, walk-in and vote, and lets every guest vote again. Polls
        you created are kept.
      </p>
      {isConfirming ? (
        <div className={styles.confirm} role="alertdialog" aria-label="Confirm reset">
          <p>
            <strong>Reset everything?</strong> This can&rsquo;t be undone.
          </p>
          <div className={styles.confirmActions}>
            <Button variant="danger" onClick={confirmReset} disabled={isSaving} autoFocus>
              Yes, reset
            </Button>
            <Button variant="secondary" onClick={() => setIsConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="danger" onClick={() => setIsConfirming(true)}>
          Reset demo data
        </Button>
      )}
    </Panel>
  );
}
