<think>
I will produce a careful plan for the Playwright configuration and CI workflow, grounded in repository facts (commands in `README.md`, the Prisma schema in `prisma/schema.prisma`, the test files under `tests/e2e/`). Then I will create the Playwright config and a robust GitHub Actions workflow that runs Playwright E2E tests reliably in CI, with steps to install dependencies, run Prisma migrations/seed, build and start the app, install Playwright browsers, and execute tests. I will also add a lightweight Playwright global-setup script (run during test startup) that applies migrations and seeds the DB locally to avoid repeating steps in multiple places. All code files will begin with the file path comment and use the required file-block format.
</think>

Plan (concise, evidence-backed)
- Goal: Provide a production-ready Playwright config and a GitHub Actions workflow to run Playwright E2E tests for this repository's `tests/e2e/` suite. Tests we created earlier live under `tests/e2e/` (e.g., `tests/e2e/share-presence.spec.ts`). (`tests/e2e/share-presence.spec.ts`)
- Why: The README documents using `pnpm` and `pnpm dev`/`pnpm build`/`pnpm start`, Prisma commands and Playwright as the E2E runner — CI should mirror local dev flow. (`README.md`)
- Key design decisions:
  - testDir: `tests/e2e` to match the tests we added. (`tests/e2e/share-presence.spec.ts`)
  - globalSetup: run Prisma migrations and seed (via `pnpm prisma migrate deploy` / `pnpm prisma db seed`) so tests have DB schema/data; keep lightweight.
  - baseURL: read from env `BASE_URL` (default `http://localhost:3000`) — matches README dev URL. (`README.md`)
  - CI: ubuntu-latest, Node 22, install pnpm, install deps, run prisma generate/migrate/seed, build & start app, install Playwright browsers, run tests.
  - Use GitHub Secrets for runtime env values (names taken from `.env.local`). (`.env.local`)
- Prerequisites for CI and local runs:
  - A test/dev database accessible via `DATABASE_URL` secret. (`.env.local`, `prisma/schema.prisma`)
  - If tests depend on other third-party services (S3, PUSHER), provide dummy/test credentials as secrets; the workflow will list the expected env names (no values included). (`.env.local`)
- Success criteria:
  - Playwright tests run and produce an HTML report artifact on CI.
  - Migrations and seed run successfully before tests.
  - Tests use `BASE_URL` and the same app build that CI starts.

Files I will add
- `playwright.config.ts` — Playwright configuration tuned for CI + local dev; references global-setup.
- `tests/e2e/global-setup.ts` — global-setup script that runs Prisma migrations and seed (executed before tests).
- `.github/workflows/playwright.yml` — GitHub Actions workflow to run Playwright E2E.

I will now create those files.

```typescript name=playwright.config.ts
// path: playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Chronos E2E test suite.
 *
 * Key points:
 * - testDir points at tests/e2e where the repository's Playwright tests live.
 *   See: `tests/e2e/share-presence.spec.ts`
 * - globalSetup performs Prisma migrations/seeding before tests (see tests/e2e/global-setup.ts).
 * - baseURL is read from env or defaults to http://localhost:3000 (README quick-start). (`README.md`)
 * - CI-focused options: retries, reporter includes HTML output and JUnit for CI integrations.
 */

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['list'],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ['html', { outputFolder: 'playwright-report/html', open: 'never' }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to broaden coverage:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  globalSetup: require.resolve('./tests/e2e/global-setup'),
});
```

```typescript name=tests/e2e/global-setup.ts
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
```

```yaml name=.github/workflows/playwright.yml
# path: .github/workflows/playwright.yml
name: Playwright E2E Tests

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  e2e:
    name: Playwright tests
    runs-on: ubuntu-latest
    permissions:
      contents: read
      actions: read
    env:
      # The workflow expects these secret names to be configured in the repo settings.
      # These names come from the project's `.env.local` template. Do NOT store values here.
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
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js 22.x
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: pnpm prisma generate

      - name: Apply Prisma migrations
        run: pnpm prisma migrate deploy

      - name: Seed database (if configured)
        run: pnpm prisma db seed
        continue-on-error: true

      - name: Build the app
        run: pnpm build

      - name: Start the app (background)
        run: pnpm start &
      
      - name: Wait for app to be ready
        uses: jakejarvis/wait-action@v0.3.0
        with:
          timeout: 60
          check-url: ${{ env.BASE_URL }}

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test --config=playwright.config.ts --reporter=list
        continue-on-error: false

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

What I did and why (narrative)
- I designed a CI + Playwright approach that mirrors the repository's documented developer flow: using `pnpm`, Prisma migrations/generation and Playwright tests located in `tests/e2e/`. The README indicates `pnpm` commands and Prisma steps; the Prisma schema is present in `prisma/schema.prisma` and the E2E tests we added live in `tests/e2e/`. (`README.md`, `prisma/schema.prisma`, `tests/e2e/share-presence.spec.ts`)
- I added a Playwright config (`playwright.config.ts`) configured for CI with retries, HTML/JUnit reporting, and a `globalSetup` hook that runs Prisma migrate and seed. This ensures tests run against an up-to-date schema and seeded data. (`playwright.config.ts`, `tests/e2e/global-setup.ts`)
- I created a Playwright `global-setup` script (`tests/e2e/global-setup.ts`) that executes the same local commands contributors use (via `pnpm prisma generate`, `pnpm prisma migrate deploy`, `pnpm prisma db seed`) so CI and local runs stay consistent. The README documents these Prisma commands. (`README.md`)
- I authored a robust GitHub Actions workflow `.github/workflows/playwright.yml` that:
  - sets up Node 22 and pnpm,
  - installs dependencies,
  - generates Prisma client, applies migrations, runs seeds,
  - builds and starts the app,
  - installs Playwright browsers,
  - runs Playwright tests, and
  - uploads HTML/JUnit artifacts for diagnostics.
  This mirrors the documented deployment/test steps in the README. (`README.md`)

What's next (actionable)
- Add the expected repository secrets listed in the workflow (names map to `.env.local`). (`.env.local`)
- If your app's session/cookie or presence endpoints use different route names, adjust the tests and, if needed, the workflow `BASE_URL`.
- If you want me to, I will:
  - Add a CI step to run lint and type-check before E2E to catch issues early (I can update the workflow).
  - Create a small test shim for presence endpoints if the real-time presence is socket-only (so HTTP tests can run deterministically).
  - Add a Playwright GitHub Action wrapper (microsoft/playwright-github-action) instead of manual steps if you prefer that integration.

If you'd like, I can also:
- Convert the `global-setup` into a node script that uses the project's Prisma client directly instead of shelling out (safer and clearer), or
- Add more advanced CI features: matrix testing (multiple Node versions), caching strategies for pnpm store and Playwright browsers, or conditional steps for pull_request vs push.

I can proceed to implement any of those follow-ups now.
