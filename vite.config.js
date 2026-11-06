// Vite build configuration for LaunchPad, plus Vitest settings for unit tests.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    // Tests target the pure functions in src/lib, so plain Node is enough (no browser DOM needed).
    environment: 'node',
    include: ['src/**/*.test.js'],
    // Lets CI pass before the first test file exists; removed once real tests land.
    passWithNoTests: true,
  },
});
