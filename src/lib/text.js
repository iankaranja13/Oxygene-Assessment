// Small, pure text helpers shared by normalization and search.

const WHITESPACE_RUN = /\s+/g;
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Turns any raw value into a clean display string: trims, collapses inner whitespace.
 * Numbers become strings; arrays of strings are joined (an org stored as ["iHub"] becomes "iHub").
 * Anything else (null, objects, booleans) becomes "".
 * @param {unknown} value
 * @returns {string}
 */
export function cleanText(value) {
  if (typeof value === 'string') {
    return value.replace(WHITESPACE_RUN, ' ').trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(cleanText).filter(Boolean).join(', ');
  }
  return '';
}

/**
 * Folds text for comparison: lower case, accents removed, whitespace collapsed.
 * "  José  NÚÑEZ " and "jose nunez" both become "jose nunez".
 * @param {unknown} value
 * @returns {string}
 */
export function foldForSearch(value) {
  return cleanText(value).normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
}

/**
 * Title-cases a name only when it was typed entirely in upper or lower case
 * ("AISHA CHEN" -> "Aisha Chen"). Mixed-case names are left alone, so deliberate
 * spellings like "McDonald" or "van der Berg" are never "corrected".
 * @param {string} name already-cleaned name
 * @returns {string}
 */
export function fixAllCapsOrLowerName(name) {
  const isUniformCase = name === name.toUpperCase() || name === name.toLowerCase();
  if (!isUniformCase) {
    return name;
  }
  // Capitalise the first letter of each word, including after a hyphen or apostrophe.
  return name.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (match, separator, letter) => {
    return separator + letter.toUpperCase();
  });
}
