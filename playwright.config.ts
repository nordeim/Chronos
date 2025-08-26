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
