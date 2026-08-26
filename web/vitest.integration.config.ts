import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'vitest/config';

// DB-backed tests only (tests/lib/db.test.ts, tests/api/**). Runs against
// the same DATABASE_URL the app itself uses (Postgres/Neon) — safe here:
// test cleanup deletes only the specific rows each test creates, never a
// blanket wipe. See vitest.config.ts for the fast, DB-free unit tests.
loadEnv({ path: path.resolve(__dirname, '.env') });
loadEnv({ path: path.resolve(__dirname, '.env.local'), override: true });

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    globalSetup: ['./tests/setup/global-setup.ts'],
    include: ['tests/lib/db.test.ts', 'tests/lib/voice-examples.test.ts', 'tests/api/**/*.test.ts'],
  },
});
