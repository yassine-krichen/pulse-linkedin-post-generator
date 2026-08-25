import { execSync } from 'node:child_process';

export default function setup() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Tests run against the real Postgres database ' +
        'configured for this project — set DATABASE_URL in web/.env or web/.env.local.',
    );
  }

  // This project has a single Neon database — there's no separate test
  // branch to isolate against, so surface exactly which host is about to
  // be migrated and written to rather than doing it silently.
  const host = new URL(process.env.DATABASE_URL).host;
  console.warn(`[test setup] running migrations and tests against DATABASE_URL host: ${host}`);

  execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
}
