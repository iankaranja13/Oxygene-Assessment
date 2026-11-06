// The one store instance the whole app shares. This is the single place that decides
// where shared data lives; swapping in the Supabase store (feature/live-sync) only
// changes this file, not any screen.
import { createLocalStore } from './localStore.js';

export const appStore = createLocalStore();
