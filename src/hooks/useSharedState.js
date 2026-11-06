// Subscribes a component to the shared store (check-ins, walk-ins, poll state, votes).
// useSyncExternalStore is React's built-in way to read an outside store: the component
// re-renders whenever the store notifies, and never shows a half-updated state.
import { useSyncExternalStore } from 'react';
import { appStore } from '../lib/storage/appStore.js';

/** @returns {import('../lib/storage/sharedState.js').SharedState} */
export function useSharedState() {
  return useSyncExternalStore(appStore.subscribe, appStore.getState);
}
