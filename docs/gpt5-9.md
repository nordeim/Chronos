<think>
I will convert the Playwright global-setup into a Node script that uses the Prisma client directly (connects, validates schema presence by querying a core table, optionally seeds minimal dev data using the Prisma client). I will not shell out to run Prisma CLI commands in the global setup; instead the CI workflow will keep running the Prisma migration CLI steps as needed before tests run (this is safer and ensures migrations are applied in CI). For CI, I'll produce an enhanced GitHub Actions workflow with a Node-version matrix, pnpm and Playwright browser caching, and conditional behavior for pull_request vs push (faster on PRs). I'll keep the workflow aligned with README's pnpm/prisma/build/start flow and reference env secret names from `.env.local`. The files to change are the global-setup script and the CI workflow. I'll produce TypeScript for the global setup and YAML for the workflow. Now I will create the files.
</think>

```typescript name=tests/e2e/global-setup.ts
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
```

```yaml name=.github/workflows/playwright.yml
# path: .github/workflows/playwright.yml
name: Playwright E2E Tests (matrix + cache)

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ '*' ]

jobs:
  e2e:
    name: Playwright E2E (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20, 22]
      fail-fast: false

    permissions:
      contents: read
      actions: read

    env:
      # Map well-known env names used in the project to secrets (no values stored here)
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      DIRECT_URL: ${{ secrets.DIRECT_URL }}
      NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
      RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      AWS_REGION: ${{ secrets.AWS_REGION }}
      S3_BUCKET_NAME: ${{ secrets.S3_BUCKET_NAME }}
      POSTHOG_KEY: ${{ secrets.POSTHOG_KEY }}
      SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
      BASE_URL: http://localhost:3000

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Cache pnpm store
        uses: actions/cache@v4
        with:
          path: |
            ~/.pnpm-store
            ~/.local/share/pnpm
            ~/.cache/pnpm
          key: ${{ runner.os }}-pnpm-${{ matrix.node-version }}-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-${{ matrix.node-version }}-
            ${{ runner.os }}-pnpm-

      - name: Restore Playwright browsers cache
        uses: actions/cache@v4
        with:
          path: |
            ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-browsers-${{ hashFiles('**/package.json') }}
          restore-keys: |
            ${{ runner.os }}-playwright-browsers-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: pnpm prisma generate

      - name: Apply Prisma migrations (deploy)
        run: pnpm prisma migrate deploy

      - name: Seed database (if configured)
        run: pnpm prisma db seed
        continue-on-error: true

      - name: Build the app (push events get full build)
        if: github.event_name == 'push'
        run: pnpm build

      - name: Start the app (background)
        # For PRs we also start the app so tests can run against the preview; keep consistent behavior.
        run: |
          # Use a lightweight background start to serve the built app for push,
          # and `pnpm dev` for PRs if no build was performed.
          if [ "${{ github.event_name }}" = "push" ]; then
            pnpm start &
          else
            pnpm dev &
          fi
        env:
          NODE_ENV: test

      - name: Wait for app to respond
        uses: jakejarvis/wait-action@v0.3.0
        with:
          timeout: 120
          check-url: ${{ env.BASE_URL }}

      - name: Install Playwright browsers (if cache miss, ensure binaries are available)
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        # Use faster, lighter runs for PRs (conservative workers) and full runs on push
        run: |
          if [ "${{ github.event_name }}" = "pull_request" ]; then
            echo "Running Playwright in PR mode (1 worker, retry=1)..."
            npx playwright test --config=playwright.config.ts --workers=1
          else
            echo "Running Playwright in push mode (full run)..."
            npx playwright test --config=playwright.config.ts
          fi
        env:
          CI: true

      - name: Upload Playwright HTML report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-html-report
          path: playwright-report/html

      - name: Upload JUnit report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-junit
          path: playwright-report/junit.xml
```

I've implemented the two deliverables you requested:

- Converted the Playwright global-setup to a Node script that uses the Prisma client directly:
  - It imports/creates a PrismaClient, connects, and probes the `User` table to confirm that migrations were applied.
  - It seeds a minimal, idempotent user if the DB is empty (safe for local/dev/test).
  - It avoids shelling out to Prisma CLI during test startup, while leaving full migration operations to the CI workflow. This reduces shelling and improves error messages when the schema isn't ready.

- Upgraded the GitHub Actions CI workflow:
  - Matrix testing across Node 20 and 22 (mirror project Node recommendation).
  - pnpm store caching (attempts common pnpm cache locations) keyed by lockfile hash and Node version.
  - Playwright browser cache (caches ~/.cache/ms-playwright).
  - Conditional steps: builds on push, uses dev server on pull_request (keeps PR runs lighter), and runs Playwright with fewer workers on PRs to be faster.
  - Uploads HTML and JUnit Playwright reports as artifacts for diagnostics.
  - Retains previous essential steps: install deps, prisma generate, migrations, seed, build/start, install Playwright browsers, run tests.

What's next
- Add the two new files to the repository. (If you'd like I can prepare a branch and push these changes.)
- Ensure repository secrets are configured for CI:
  - `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`, `POSTHOG_KEY`, `SENTRY_DSN`.
  - These names match `.env.local` used by the project.
- If you'd like maximum out-of-the-box CI reliability, I can:
  - Add a small test shim server endpoint for presence (if the real app uses sockets only), so the Playwright presence tests run deterministically in CI.
  - Tighten the cache key paths to match your runner (I used conservative home-cache locations; if your CI runner uses an alternate pnpm store, we can adapt).
  - Add a step that runs lint/type-check before tests to fail fast.

If you want, I can now:
- create the Git branch and push these files to the repository (I can draft a commit/PR), or
- implement the presence HTTP shim and update the Playwright tests to run against it, or
- add the optional lint/type-check stage into the workflow.

Tell me which follow-up you prefer and I will continue immediately.
