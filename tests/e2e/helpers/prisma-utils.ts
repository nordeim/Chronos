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
