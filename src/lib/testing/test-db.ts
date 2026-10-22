import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

/**
 * A throwaway Postgres schema per test file, migrated with the real
 * migrations. Runs only when `TEST_DATABASE_URL` points at a database the
 * tests may write to (local Postgres; never production).
 */
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

export async function createTestDb(): Promise<{ db: PrismaClient; drop: () => Promise<void> }> {
  if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set');
  const schema = `test_${randomUUID().replace(/-/g, '')}`;
  const url = new URL(TEST_DATABASE_URL);
  url.searchParams.set('schema', schema);
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'pipe',
  });
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  return {
    db,
    drop: async () => {
      await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await db.$disconnect();
    },
  };
}
