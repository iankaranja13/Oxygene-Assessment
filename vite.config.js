// Vite build configuration for LaunchPad (React plugin only, kept deliberately minimal).
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
});
