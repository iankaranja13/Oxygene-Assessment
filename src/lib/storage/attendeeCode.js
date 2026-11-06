// Remembers the attendee's check-in code on their phone (localStorage), so they enter it
// once and stay "signed in" to the poll for the evening, even after a reload.
import { browserLocalStorage } from './safeStorage.js';

const ATTENDEE_CODE_KEY = 'attendee-code';

/** @returns {string | null} */
export function readAttendeeCode(storage = browserLocalStorage) {
  const code = storage.readJson(ATTENDEE_CODE_KEY, null);
  return typeof code === 'string' && code ? code : null;
}

/** @param {string | null} code null forgets it ("Not you?") */
export function writeAttendeeCode(code, storage = browserLocalStorage) {
  return code ? storage.writeJson(ATTENDEE_CODE_KEY, code) : storage.remove(ATTENDEE_CODE_KEY);
}
