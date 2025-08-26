// path: tests/e2e/global-setup.ts
/**
 * Playwright global setup (Node script).
 *
 * This script uses the project's Prisma client directly instead of shelling out.
 * Responsibilities:
 *  - Connect the Prisma client
 *  - Verify that the schema/migrations have been applied by probing a core table
 *    (throws a helpful error if schema is missing so CI can surface missed migrations)
 *  - Optionally seed a minimal development row if the database is empty (safe, idempotent)
 *
 * Notes:
 * - This script does NOT run `prisma migrate deploy` or `prisma generate`. The CI workflow
 *   remains responsible for running migrations before tests. This keeps the global-setup
 *   fast and avoids embedding migration logic here.
 * - Ensure PLAYWRIGHT tests run against a disposable/test DB (set DATABASE_URL accordingly).
 *
 * Evidence: Prisma client expected at `src/lib/db/prisma.ts`. See `prisma/schema.prisma` for models.
 * (The test helpers and tests reference the Prisma client at this path.)
 */

import path from 'path';
import { PrismaClient } from '@prisma/client';

const prismaImportPath = path.resolve(process.cwd(), 'src/lib/db/prisma');

async function tryImportPrismaClient(): Promise<PrismaClient> {
  // Attempt to import the project's Prisma client. Fall back to constructing a fresh client
  // if the app exposes a different wrapper.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const mod = require(prismaImportPath);
    if (mod && typeof mod.prisma !== 'undefined') {
      return mod.prisma as PrismaClient;
    }
    // If the module exported a default PrismaClient instance
    if (mod && typeof mod.default !== 'undefined') {
      return mod.default as PrismaClient;
    }
  } catch (err) {
    // swallow and fallback to direct PrismaClient
    // console.warn('Could not import project Prisma client; falling back to new PrismaClient()', err);
  }
  // Fallback: create a new PrismaClient instance directly
  // This requires @prisma/client to be installed for the test environment.
  // It will still use DATABASE_URL from env.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return new PrismaClient();
}

export default async function globalSetup() {
  const prisma = await tryImportPrismaClient();

  try {
    console.log('> Playwright global-setup: connecting Prisma client...');
    await prisma.$connect();

    console.log('> Playwright global-setup: verifying schema presence by probing `User` table...');
    try {
      // Simple probe: count Users. If table doesn't exist, this will throw.
      // We expect the Prisma schema and migrations to have been applied before tests run.
      const userCount = await prisma.user.count();
      console.log(`> Playwright global-setup: Users found: ${userCount}`);
    } catch (probeErr) {
      console.error('> Playwright global-setup: database schema appears not to be migrated.');
      console.error('  - Ensure migrations have been applied (e.g. `pnpm prisma migrate deploy`).');
      console.error('  - In CI, make sure the workflow runs prisma migrate deploy before running Playwright.');
      throw probeErr;
    }

    // Optional lightweight seeding: create a deterministic marker user used by local dev/test debugging.
    // This is safe and idempotent: it only creates a user if none exist.
    const existingUser = await prisma.user.findFirst();
    if (!existingUser) {
      console.log('> Playwright global-setup: no users found; creating a minimal seed user for tests...');
      await prisma.user.create({
        data: {
          email: `e2e-seed+${Date.now()}@example.com`,
          name: 'E2E Seed User',
          timezone: 'UTC',
          locale: 'en',
          preferences: {},
          onboardingStatus: {},
        },
      });
      console.log('> Playwright global-setup: minimal seed user created.');
    } else {
      console.log('> Playwright global-setup: database already has users; skipping seed.');
    }

    console.log('> Playwright global-setup completed successfully.');
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore disconnect errors in teardown
    }
  }
}
