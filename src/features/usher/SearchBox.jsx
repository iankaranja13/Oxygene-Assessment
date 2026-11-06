// The usher's main control: a large search box that is focused as soon as the screen opens.
import { CloseIcon, SearchIcon } from '../../components/icons.jsx';
import styles from './SearchBox.module.css';

const SEARCH_INPUT_ID = 'guest-search';

export default function SearchBox({ value, onChange, inputRef }) {
  function clear() {
    onChange('');
    // Keep the keyboard open so the usher can type the next name straight away.
    inputRef.current?.focus();
  }

  return (
    <div className={styles.bar} role="search">
      <label htmlFor={SEARCH_INPUT_ID} className="visually-hidden">
        Search guests by name, organization or code
      </label>
      <div className={styles.field}>
        <span className={styles.searchIcon}>
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          id={SEARCH_INPUT_ID}
          className={styles.input}
          type="search"
          placeholder="Name, organization or code"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          // Opens the keyboard immediately (iOS only allows this after a tap; see README).
          autoFocus
          // Names and codes are not dictionary words: no autocorrect or auto-capitals.
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
        />
        {value && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={clear}
            aria-label="Clear search"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}
