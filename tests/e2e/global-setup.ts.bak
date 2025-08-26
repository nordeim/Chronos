// path: tests/e2e/global-setup.ts
/**
 * Playwright global setup:
 * - Ensures Prisma client is generated.
 * - Applies migrations (deploy) and runs seed script (if present).
 *
 * This script is intentionally minimal and uses child_process to run the same
 * commands developers run locally (see README Quick Start for Prisma commands).
 * (`README.md`, `prisma/schema.prisma`)
 *
 * NOTE: This runs in the environment where Playwright is invoked (CI or local).
 * Ensure DATABASE_URL and other DB env vars point to a test/dev DB.
 */

import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  const repoRoot = path.resolve(__dirname, '../../');

  try {
    console.log('> Playwright global-setup: generating Prisma client...');
    execSync('pnpm prisma generate', { stdio: 'inherit', cwd: repoRoot, env: process.env });

    console.log('> Playwright global-setup: applying migrations (deploy)...');
    // In CI/prod we prefer migrate deploy; in local dev you may prefer migrate dev.
    execSync('pnpm prisma migrate deploy', { stdio: 'inherit', cwd: repoRoot, env: process.env });

    // Seed (optional) if project includes seed script as documented in README.
    console.log('> Playwright global-setup: running prisma db seed (if configured)...');
    try {
      execSync('pnpm prisma db seed', { stdio: 'inherit', cwd: repoRoot, env: process.env });
    } catch (err) {
      // If no seed is configured, it's okay — continue.
      console.warn('> No seed executed (this is fine if no seed is configured):', (err as Error).message);
    }

    console.log('> Playwright global-setup completed.');
  } catch (err) {
    console.error('> Playwright global-setup failed:', (err as Error).message);
    throw err;
  }
}
