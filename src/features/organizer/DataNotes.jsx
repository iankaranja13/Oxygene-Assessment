// Summarises what the clean-up found in the guest file, so the organizer knows why the
// guest count may differ from the number of rows they sent, and what to double-check.
import Panel from './Panel.jsx';
import styles from './DataNotes.module.css';

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export default function DataNotes({ report }) {
  if (report.error) {
    return (
      <Panel title="Guest list notes">
        <p role="alert">{report.error}</p>
      </Panel>
    );
  }
  return (
    <Panel title="Guest list notes">
      <p className={styles.intro}>
        {plural(report.totalRecords, 'row')} in the file became {plural(report.guestCount, 'guest')}
        .
      </p>
      <ul className={styles.list}>
        <li>{plural(report.mergedDuplicates, 'exact duplicate')} merged</li>
        <li>{plural(report.skipped.length, 'unusable row')} skipped</li>
        <li>{plural(report.sharedCodeGroups, 'check-in code')} shared by more than one guest</li>
        <li>{plural(report.sameNameGroups, 'name')} used by more than one guest</li>
      </ul>
    </Panel>
  );
}
