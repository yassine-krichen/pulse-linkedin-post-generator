import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Fast unit tests — no DB, no globalSetup. DB-backed tests live in
// tests/lib/db.test.ts and tests/api/**, run separately via
// vitest.integration.config.ts so a slow/unreachable Postgres instance
// can't block tests that don't need it.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      'tests/lib/db.test.ts',
      'tests/lib/voice-examples.test.ts',
      'tests/api/**',
    ],
  },
});
