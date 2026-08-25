import { execSync } from 'node:child_process';

export default function setup() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Tests run against the real Postgres database ' +
        'configured for this project — set DATABASE_URL in web/.env or web/.env.local.',
    );
  }

  execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
}
