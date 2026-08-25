import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    globalSetup: ['./tests/setup/global-setup.ts'],
    env: {
      DATABASE_URL: 'file:./test.db',
    },
  },
});
