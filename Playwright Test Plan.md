You will create a careful plan for Playwright end-to-end tests that cover calendar sharing and presence flows, then produce the actual test files and helper utilities. You will ground assumptions by citing repository docs that show the relevant features and schema (calendar sharing, realtime/presence, Prisma models). Because test execution depends on authentication/session wiring and DB access, I will provide helper utilities that use the project's Prisma client (documented in the repo) to create test users, sessions and calendars in the test database. Tests will use Playwright's request API to call server endpoints with session cookies, and browser contexts with cookies when simulating presence.

Key design choices:
- Use DB-level test data creation (Prisma) to avoid fragile UI sign-up flows in tests.
- Create session rows in the DB and set the session cookie `next-auth.session-token` in Playwright contexts. This is a common NextAuth session pattern and the repo exposes the `Session` model in `prisma/schema.prisma` (so creating session DB rows is consistent with the schema).
- Use API endpoints to perform share operations (POST /api/calendars/share) and presence operations (POST /api/calendars/:id/presence/join, GET /api/calendars/:id/presence). These endpoints are asserted by PRD/README as expected routes/behaviors (presence/realtime code lives under `src/lib/realtime` and hooks under `src/hooks/use-realtime.ts`).
- Tests are organized under `tests/e2e/` and use Playwright fixtures.

You will:
1) Provide a short plan with scenarios, prerequisites, and assumptions (with file citations).
2) Create the Playwright test files and helper modules as TypeScript files under `tests/e2e/`.
3) Add explanatory comments in the files to make them actionable for the team.

Now you will create the test and helper files.

---
Overview & Plan (short)
- Objective: Implement Playwright E2E tests for the "calendar sharing" and "presence" flows.
- Scenarios:
  1. Share flow (API-driven): Owner shares a calendar with recipient; recipient obtains access to calendar via API.
  2. Presence flow (presence API): Owner and recipient register presence on a shared calendar; presence listing returns both participants.
- Strategy:
  - Use Prisma to create test users, sessions, and calendar records for deterministic setup (`src/lib/db/prisma.ts`, `prisma/schema.prisma`).
  - Use Playwright request contexts to call API routes while providing session cookie header for authentication.
  - Use Playwright browser contexts with session cookies for presence simulation where applicable.
- Required assumptions (documented here; implementors should ensure endpoints exist or adjust routes accordingly):
  - `Session` model exists in the schema and can be used to create session rows: `prisma/schema.prisma`. (`prisma/schema.prisma`)
  - Prisma client singleton is available at `src/lib/db/prisma.ts`. (`README.md`)
  - Calendar share API route path is `/api/calendars/share` (PRD references calendar share API). (`Project Requirements Document.md`)
  - Realtime/presence capability exists under `src/lib/realtime/pusher.ts` and hook `src/hooks/use-realtime.ts`. Tests will exercise a presence API pattern: `POST /api/calendars/:id/presence/join` and `GET /api/calendars/:id/presence`. If the app uses a websocket provider (Pusher), you should implement these HTTP endpoints as a test-friendly presence shim in dev. (`Project Requirements Document.md`, `README.md`)

Relevant repo evidence (grounding)
- Insight that calendar sharing exists and CalendarShare model is in schema: `prisma/schema.prisma`. (`prisma/schema.prisma`)
- Realtime/presence and helper paths: `src/lib/realtime/pusher.ts`, `src/hooks/use-realtime.ts`. (`Project Requirements Document.md`)

Code files to add
- tests/e2e/helpers/prisma-utils.ts — DB helper utilities (create user, create calendar).
- tests/e2e/helpers/session-utils.ts — create DB session row and produce cookie.
- tests/e2e/share-presence.spec.ts — Playwright tests for share + presence flows.

Now I create the files.

```typescript name=tests/e2e/helpers/prisma-utils.ts
// path: tests/e2e/helpers/prisma-utils.ts
/**
 * Test helpers that use the project's Prisma client to create test users,
 * calendars, and basic records for Playwright tests.
 *
 * NOTE:
 * - This helper imports the Prisma client from the app (assumes file exists at src/lib/db/prisma.ts).
 * - It is intended for test-only use. Ensure tests run against a disposable/dev DB.
 *
 * Evidence: Prisma client and schema are present in the repo (`src/lib/db/prisma.ts`, `prisma/schema.prisma`).
 * See: `prisma/schema.prisma` model definitions for User, Calendar, Session, CalendarShare.
 */

import { randomUUID } from 'crypto';
import { prisma } from '../../src/lib/db/prisma';

export async function createTestUser(overrides?: { email?: string; name?: string }) {
  const email = overrides?.email ?? `test+${randomUUID().slice(0, 8)}@example.com`;
  const name = overrides?.name ?? `Test User ${email.split('@')[0]}`;
  const user = await prisma.user.create({
    data: {
      email,
      name,
      timezone: 'UTC',
      locale: 'en',
      preferences: {},
      onboardingStatus: {},
    },
  });
  return user;
}

export async function createTestCalendar(userId: string, overrides?: { name?: string; isDefault?: boolean }) {
  const name = overrides?.name ?? `Calendar ${randomUUID().slice(0, 6)}`;
  const calendar = await prisma.calendar.create({
    data: {
      name,
      color: '#3B82F6',
      isDefault: overrides?.isDefault ?? false,
      isPublic: false,
      settings: {},
      userId,
    },
  });
  return calendar;
}

export async function teardownTestData(predicate?: { userId?: string }) {
  // Basic teardown helper: remove calendars and shares for a user
  if (predicate?.userId) {
    await prisma.calendarShare.deleteMany({ where: { userId: predicate.userId } });
    await prisma.calendar.deleteMany({ where: { userId: predicate.userId } });
    // Keep user for debugging unless explicitly removed
  }
}
```

```typescript name=tests/e2e/helpers/session-utils.ts
// path: tests/e2e/helpers/session-utils.ts
/**
 * Helpers to generate a session row in the database and return the
 * cookie string to authenticate Playwright requests and browser contexts.
 *
 * IMPORTANT: This test helper creates a `Session` row using the Prisma client.
 * The repository's Prisma schema defines the `Session` model:
 * - See `prisma/schema.prisma` (model Session { sessionToken String @unique userId String expires DateTime ... })
 *
 * WARNING: This code assumes the application reads sessions from the DB and accepts the
 * cookie name `next-auth.session-token`. If your NextAuth cookie name differs,
 * update the cookie name in `setSessionCookie` below.
 */

import { addDays } from 'date-fns';
import { randomUUID } from 'crypto';
import { prisma } from '../../src/lib/db/prisma';

const NEXTAUTH_COOKIE_NAME = 'next-auth.session-token';

export async function createSessionForUser(userId: string) {
  const token = randomUUID();
  const expires = addDays(new Date(), 1); // 1 day valid

  // Create Session row matching schema
  await prisma.session.create({
    data: {
      sessionToken: token,
      userId,
      expires,
    },
  });

  // Return cookie string that Playwright can set:
  // e.g. "next-auth.session-token=TOKEN; Path=/; HttpOnly"
  const cookieValue = `${NEXTAUTH_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax`;
  return { token, cookieValue };
}
```

```typescript name=tests/e2e/share-presence.spec.ts
// path: tests/e2e/share-presence.spec.ts
/**
 * Playwright E2E tests for "calendar sharing" and "presence" flows.
 *
 * High-level scenarios:
 * - owner can share a calendar with recipient via API POST /api/calendars/share
 * - recipient gains access to calendar (GET /api/calendars/:id returns calendar)
 * - presence flow: two users join presence for calendar and GET /api/calendars/:id/presence returns both
 *
 * Preconditions for these tests:
 * - The app must be running locally and accessible via BASE_URL (default http://localhost:3000).
 * - Tests create DB rows via Prisma helpers (tests/e2e/helpers/prisma-utils.ts).
 * - These tests assume presence API endpoints exist at:
 *     POST /api/calendars/:id/presence/join
 *     GET  /api/calendars/:id/presence
 *
 * If the app implements presence via Pusher/socket-only, consider adding a lightweight HTTP shim for tests.
 *
 * Evidence:
 * - Calendar sharing, presence/realtime are described in repository docs and schema:
 *   `Project Requirements Document.md`, `prisma/schema.prisma`, `src/lib/realtime/pusher.ts`.
 */

import { test, expect, request } from '@playwright/test';
import { createTestUser, createTestCalendar } from './helpers/prisma-utils';
import { createSessionForUser } from './helpers/session-utils';
import { prisma } from '../../src/lib/db/prisma';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Calendar share & presence flows', () => {
  test.afterEach(async () => {
    // Optional cleanup: remove created test data older than a short TTL
    // (Left intentionally light; prefer DB reset between test runs)
  });

  test('Share flow: owner shares calendar with recipient and recipient can fetch calendar', async ({ request: playwrightRequest }) => {
    // 1. Create owner and recipient in DB
    const owner = await createTestUser({ email: `owner+${Date.now()}@example.com` });
    const recipient = await createTestUser({ email: `recipient+${Date.now()}@example.com` });

    // 2. Create sessions and cookies
    const ownerSession = await createSessionForUser(owner.id);
    const recipientSession = await createSessionForUser(recipient.id);

    // 3. Owner creates a calendar
    const calendar = await createTestCalendar(owner.id, { name: `Owner Calendar ${Date.now()}` });

    // 4. Owner issues share via API (POST /api/calendars/share)
    const ownerReq = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: {
        // send cookie header for authentication
        cookie: ownerSession.cookieValue,
      },
    });

    const shareResp = await ownerReq.post('/api/calendars/share', {
      data: {
        calendarId: calendar.id,
        email: recipient.email,
        permission: 'VIEW',
      },
    });

    expect(shareResp.ok()).toBeTruthy();
    const shareJson = await shareResp.json();
    expect(shareJson).toHaveProperty('share');

    // 5. Recipient should be able to GET calendar via API
    const recipientReq = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: {
        cookie: recipientSession.cookieValue,
      },
    });

    const getCalResp = await recipientReq.get(`/api/calendars/${calendar.id}`);
    expect(getCalResp.ok()).toBeTruthy();
    const calJson = await getCalResp.json();
    expect(calJson).toHaveProperty('id', calendar.id);
    expect(calJson).toHaveProperty('name', calendar.name);
  });

  test('Presence flow: two users join presence and presence list returns both', async ({ browser }) => {
    // Create two users and sessions
    const userA = await createTestUser({ email: `presenceA+${Date.now()}@example.com` });
    const userB = await createTestUser({ email: `presenceB+${Date.now()}@example.com` });

    const sessionA = await createSessionForUser(userA.id);
    const sessionB = await createSessionForUser(userB.id);

    const calendar = await createTestCalendar(userA.id, { name: `Presence Calendar ${Date.now()}` });

    // Precondition: share calendar from A -> B so B has access (create CalendarShare row)
    await prisma.calendarShare.create({
      data: {
        calendarId: calendar.id,
        userId: userB.id,
        permission: 'VIEW',
      },
    });

    // Use Playwright request contexts to simulate presence join via HTTP endpoints
    const reqA = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { cookie: sessionA.cookieValue },
    });
    const reqB = await request.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: { cookie: sessionB.cookieValue },
    });

    // Each user joins presence
    const joinA = await reqA.post(`/api/calendars/${calendar.id}/presence/join`, { data: { meta: { viewport: 'desktop' } } });
    expect(joinA.ok()).toBeTruthy();

    const joinB = await reqB.post(`/api/calendars/${calendar.id}/presence/join`, { data: { meta: { viewport: 'mobile' } } });
    expect(joinB.ok()).toBeTruthy();

    // Poll presence list (or fetch directly) and assert both users are present
    const presenceResp = await reqA.get(`/api/calendars/${calendar.id}/presence`);
    expect(presenceResp.ok()).toBeTruthy();
    const presence = await presenceResp.json();
    // presence should include at least two sessions/users
    expect(Array.isArray(presence)).toBeTruthy();
    const userIds = presence.map((p: any) => p.userId);
    expect(userIds).toContain(userA.id);
    expect(userIds).toContain(userB.id);

    // Optional: verify presence meta fields exist
    const aEntry = presence.find((p: any) => p.userId === userA.id);
    expect(aEntry).toHaveProperty('joinedAt');
  });
});
```

What I added and why
- `tests/e2e/helpers/prisma-utils.ts` — deterministic DB helpers so tests don't depend on UI sign-up flows (cites `src/lib/db/prisma.ts` and `prisma/schema.prisma` in comments).
- `tests/e2e/helpers/session-utils.ts` — creates Session DB rows and returns cookie string for Playwright to authenticate requests and browser contexts, making tests reliable.
- `tests/e2e/share-presence.spec.ts` — the Playwright test suite implementing the share + presence scenarios described above. Tests use Playwright's request API for fast and deterministic operations.

Notes, assumptions & next steps
- These tests assume the app exposes API endpoints:
  - POST `/api/calendars/share` (share calendar)
  - GET `/api/calendars/:id` (fetch calendar)
  - POST `/api/calendars/:id/presence/join` and GET `/api/calendars/:id/presence` (presence shim)
  If those endpoints don't yet exist, add small test-friendly HTTP shims that wrap real-time presence or provide these behaviors in development.
  Evidence that presence/realtime functionality is a planned part of the app: `src/lib/realtime/pusher.ts` and `src/hooks/use-realtime.ts` are documented in the PRD and README. (`Project Requirements Document.md`, `README.md`)
- Authentication cookie name used in helpers is `next-auth.session-token` (a common NextAuth cookie). If the project uses a different cookie name, update `NEXTAUTH_COOKIE_NAME` in `tests/e2e/helpers/session-utils.ts`.
- Tests rely on direct DB writes via Prisma. Ensure the Playwright test environment targets a disposable/dev database (do NOT run against production).
- For browsers (presence), the tests used the request API to join presence. If your app ties presence strictly to WebSocket connections, implement a test shim (HTTP endpoint) to register presence server-side for testing, or use a test Pusher/Socket server that can be instantiated in CI.
- Add the following environment variables when running tests:
  - BASE_URL (default `http://localhost:3000`) — set to your running dev server URL.
  - Use the same DB as your dev/prisma setup (or a test DB).

Recommended follow-ups I can produce for you
- Implement the test-friendly presence HTTP shim (server-side route handlers) if you want me to author them.
- Add Playwright config snippet (playwright.config.ts) tuned for CI and test retries, reporters and baseURL.
- Add CI job (GitHub Actions) to run Playwright tests on PRs (I can author the workflow file).

What's next (for you / team)
- Add the files into the repository under `tests/e2e/` and run Playwright with `npx playwright test`.
- If any endpoint names differ, update the tests to match actual routes.
- Ensure the test DB is isolated and migrations are applied prior to running tests:
  - `pnpm prisma migrate deploy` or `pnpm prisma migrate dev` in your test environment as appropriate. (`README.md`, `prisma/schema.prisma`)

Which of these should I do next?
