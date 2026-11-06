// Switches the usher screen between searching for a guest and typing a code.
import { CodeIcon, SearchIcon } from '../../components/icons.jsx';
import styles from './ModeSwitch.module.css';
import { USHER_MODES } from './usherModes.js';

const OPTIONS = [
  { mode: USHER_MODES.SEARCH, label: 'Find guest', Icon: SearchIcon },
  { mode: USHER_MODES.CODE, label: 'Enter code', Icon: CodeIcon },
];

export default function ModeSwitch({ mode, onChange }) {
  return (
    <div className={styles.switch} role="group" aria-label="Check-in method">
      {OPTIONS.map(({ mode: optionMode, label, Icon }) => (
        <button
          key={optionMode}
          type="button"
          className={styles.option}
          aria-pressed={mode === optionMode}
          onClick={() => onChange(optionMode)}
        >
          <Icon />
          {label}
        </button>
      ))}
    </div>
  );
}
