// Sets the browser tab title per screen, which also lets screen readers announce the new page.
import { useEffect } from 'react';
import { APP_NAME } from '../lib/constants.js';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
