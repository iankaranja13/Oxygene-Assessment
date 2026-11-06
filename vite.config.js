// Vite build configuration for LaunchPad, plus Vitest settings for unit tests.
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * Supabase's Vercel integration names its variables for Next.js (NEXT_PUBLIC_*), while
 * Vite only exposes VITE_* to the browser. This maps the two PUBLIC values across.
 * It is an explicit allowlist on purpose: secret keys (service role, database password)
 * must never be copied into the browser bundle.
 */
function publicSupabaseEnv(mode) {
  const env = loadEnv(mode, process.cwd(), '');
  const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '';
  const anonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    '';
  return {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(url),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(anonKey),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: publicSupabaseEnv(mode),
  test: {
    // Tests target the pure functions in src/lib, so plain Node is enough (no browser DOM needed).
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
}));
