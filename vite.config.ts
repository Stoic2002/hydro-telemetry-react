import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'src/api/generated/**',
        'src/test/**',
        '**/*.test.{ts,tsx}',
      ],
    },
  },
  server: {
    allowedHosts: ['dad-enhanced-walking-sole.trycloudflare.com'],
    watch: {
      ignored: ['**/.codebase-memory/**'],
    },
  },
});
