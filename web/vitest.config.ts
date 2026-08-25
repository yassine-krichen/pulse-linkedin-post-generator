import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Same DATABASE_URL the app itself uses (Postgres/Neon) — tests run against
// it directly rather than a separate test database. Safe here: test cleanup
// (see tests/lib/db.test.ts, tests/api/posts.test.ts) deletes only the
// specific rows each test creates, never a blanket wipe.
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
  },
});
