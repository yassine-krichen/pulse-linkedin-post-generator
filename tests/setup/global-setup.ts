import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const TEST_DB_PATH = path.join(process.cwd(), 'test.db');
export const TEST_DATABASE_URL = 'file:./test.db';

export default function setup() {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const file = `${TEST_DB_PATH}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file);
  }

  execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });

  return () => {
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
      const file = `${TEST_DB_PATH}${suffix}`;
      if (fs.existsSync(file)) fs.rmSync(file);
    }
  };
}
