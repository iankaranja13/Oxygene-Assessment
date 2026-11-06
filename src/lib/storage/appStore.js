// The one store instance the whole app shares, chosen once at startup:
//   - Supabase configured (URL + public key at build time): live sync across devices.
//   - Otherwise: localStorage, which syncs between tabs of one browser (offline demo).
// Screens only ever use this object, so they work the same either way.
import { createLocalStore } from './localStore.js';
import { createSupabaseStore } from './supabaseStore.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isUsingSupabase = Boolean(supabaseUrl && supabaseKey);

export const appStore = isUsingSupabase
  ? createSupabaseStore({ url: supabaseUrl, key: supabaseKey })
  : createLocalStore();
