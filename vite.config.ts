import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Host tambahan untuk dev server dibaca dari environment, bukan ditulis di sini.
 * Alamat tunnel berganti tiap sesi, dan sebelumnya setiap pergantian memaksa
 * commit baru pada file konfigurasi.
 */
function readAllowedHosts(mode: string): string[] {
  const { VITE_DEV_ALLOWED_HOSTS } = loadEnv(mode, process.cwd(), 'VITE_');

  return (VITE_DEV_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
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
    allowedHosts: readAllowedHosts(mode),
    watch: {
      ignored: ['**/.codebase-memory/**'],
    },
  },
}));
