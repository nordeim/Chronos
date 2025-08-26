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
