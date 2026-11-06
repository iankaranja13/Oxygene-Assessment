// Whether shared data is live, connecting, offline, or local to this browser.
import { useSyncExternalStore } from 'react';
import { appStore } from '../lib/storage/appStore.js';

/** @returns {string} one of CONNECTION_STATUS */
export function useConnectionStatus() {
  return useSyncExternalStore(appStore.subscribe, appStore.getConnectionStatus);
}
