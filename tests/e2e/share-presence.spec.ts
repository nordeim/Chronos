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
