// The attendee's verified check-in code, remembered on this phone for the evening.
import { useCallback, useState } from 'react';
import { readAttendeeCode, writeAttendeeCode } from '../../lib/storage/attendeeCode.js';

export function useAttendeeCode() {
  const [code, setCode] = useState(readAttendeeCode);

  const remember = useCallback((verifiedCode) => {
    writeAttendeeCode(verifiedCode);
    setCode(verifiedCode);
  }, []);

  const forget = useCallback(() => {
    writeAttendeeCode(null);
    setCode(null);
  }, []);

  return { code, remember, forget };
}
