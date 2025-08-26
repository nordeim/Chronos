You will propose a focused, high-impact next phase that fits the repo's stated priorities and current partial implementations: finish Analytics & AI Insights, add calendar sharing + basic collaboration presence, and harden related backend APIs and tests. These areas map to models and paths already present in the repo (Prisma schema, AI endpoints and analytics components) so the work integrates with the existing architecture without major rewrites.

You will:
- Outline goals, scope, milestones and acceptance criteria.
- Break the plan into phases with tasks, checklists and estimates.
- Provide a concrete list of files to create (stubs + templates) as requested, using the required file-block syntax for each file and including minimal, production-oriented boilerplate.
- Include small repo-verified code snippets to ground claims (copied from the repo), and cite file paths for every non-obvious claim.

You will avoid speculative features that are not substantiated by repo files. I will produce a step-by-step execution plan the team can follow immediately.

---
Overview
- Objective: Ship "Phase: Analytics & Insights + Collaboration v1" — finish AI insights pipeline (generation, API, UI), deliver weekly reports, add calendar sharing API + UI, and basic real-time presence for collaborative views.
- Rationale: Repo already contains schema, AI endpoints and analytics components references: `prisma/schema.prisma`, `src/app/api/ai/insights/route.ts`, `src/lib/ai/insights-engine.ts`, `src/components/analytics/insights-card.tsx`. Implementing these closes several 70%/40% items in the PRD and unlocks better user value. (`Project Requirements Document.md`, `README.md`, `prisma/schema.prisma`)

Ground-truth snippet (schema verifies Insight model exists):
```prisma
// path: prisma/schema.prisma
model Insight {
  id          String      @id @default(cuid())
  type        InsightType
  title       String
  content     String
  data        Json
  score       Float?
  userId      String
  validFrom   DateTime
  validTo     DateTime
  createdAt   DateTime    @default(now())
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@index([type])
  @@index([validFrom, validTo])
}
```
(`prisma/schema.prisma`)

Scope for this phase (in-scope)
- AI Insights engine: implement `src/lib/ai/insights-engine.ts` logic, scoring and caching.
- Insights API: implement `src/app/api/ai/insights/route.ts` for on-demand generation & retrieval.
- Analytics UI: `src/app/(dashboard)/analytics/page.tsx` improvements, `src/components/analytics/insights-card.tsx` UI, and a weekly reports page.
- Calendar sharing: backend `src/app/api/calendars/share/route.ts`, service `src/services/sharing.service.ts`, and frontend `src/components/calendar/share-dialog.tsx`.
- Real-time presence: lightweight Pusher wrapper `src/lib/realtime/pusher.ts` (or extend existing), hook `src/hooks/use-realtime.ts` improvements for presence.
- Tests: unit tests for engine and services; integration test for API routes; Playwright E2E for the sharing flow and insights display.
- DB migrations / seeds if required: small seed data for insights and share entries.

Out-of-scope
- Full ML model training; rely on deterministic heuristics + small ML/LLM calls (wrapper interfaces).
- Complex enterprise RBAC beyond basic share permissions (VIEW/EDIT/ADMIN exist on schema).

Milestones & Timeline (example)
- Milestone 1 (2 days): Core insights engine + unit tests
- Milestone 2 (2 days): Insights API + integration tests
- Milestone 3 (2 days): Analytics UI cards + weekly reports UI
- Milestone 4 (2 days): Calendar sharing API + UI + E2E
- Milestone 5 (1 day): Real-time presence integration + E2E sync check
- Buffer & polish (1–2 days): performance, accessibility, docs

Success criteria
- Insights API returns cached or newly generated insights in <= 2s for cached, <= 6s for LLM-backed generation (measured locally).
- Weekly report generation produces an Insight row in DB (`Insight` model). (`prisma/schema.prisma`)
- Calendar sharing allows user A to add a share row (`CalendarShare`) granting VIEW to user B and B can see the calendar.
- E2E tests (Playwright): user can share, accept, and view shared calendar and see an insights card on analytics page.

Execution Plan — Step-by-step

Phase A — Insights Engine (Implementation & Tests)
1. Design:
   - Input: aggregated events, tasks, focus sessions for a user and date range.
   - Output: one or more Insight records (type, title, content, score, data).
   - Storage: write `Insight` rows in DB (`prisma/schema.prisma`).
   - Cache: in Redis (if configured) keyed by `insights:userId:range`.

2. Tasks:
   - Implement `src/lib/ai/insights-engine.ts` (core generation + scoring + persistence).
   - Add small helper `src/lib/ai/llm-client.ts` — wrapper to call configured LLM (Resend? or generic provider).
   - Unit tests for generation and scoring logic in `tests/unit/insights.spec.ts`.

3. Acceptance checklist:
   - [ ] Unit tests cover core scoring rules.
   - [ ] Engine writes Insight rows and returns them.
   - [ ] Respects `validFrom`/`validTo` windows.

Files to create (Phase A)
```typescript name=src/lib/ai/insights-engine.ts
// path: src/lib/ai/insights-engine.ts
/**
 * Lightweight insights engine: analyze events/tasks/sessions and produce Insight records.
 * TODO: wire LLM client and tune scoring.
 */
import { prisma } from '../../lib/db/prisma';
import type { InsightType } from '../../types/db';

export async function generateInsightsForUser(userId: string, rangeStart: Date, rangeEnd: Date) {
  // TODO: load events/tasks/focus sessions, derive metrics, call LLM if needed,
  // create or update Insight rows.
  return [];
}
```

```typescript name=src/lib/ai/llm-client.ts
// path: src/lib/ai/llm-client.ts
/**
 * Thin wrapper around configured LLM provider (OpenAI / provider configured via env).
 * Implement rate-limiting & error handling here.
 */
export async function callLLM(prompt: string, opts?: { maxTokens?: number }) {
  // TODO: implement provider calls using env vars (no secrets here)
  return { text: 'stubbed insight' };
}
```

```typescript name=tests/unit/insights.spec.ts
// path: tests/unit/insights.spec.ts
import { describe, it } from 'vitest';
import { generateInsightsForUser } from '../../src/lib/ai/insights-engine';

describe('insights-engine', () => {
  it('generates insights (stubbed) without throwing', async () => {
    const res = await generateInsightsForUser('test-user', new Date('2025-01-01'), new Date('2025-01-07'));
    // expectations TBD after implementation
  });
});
```

Phase B — Insights API (Integration)
1. Design:
   - GET / POST endpoints under `src/app/api/ai/insights/route.ts` to fetch cached insights and to trigger regeneration.
   - Use authentication middleware (existing NextAuth route pattern) to verify user.
   - Return paged insights.

2. Tasks:
   - Implement API route that calls `generateInsightsForUser` and returns results.
   - Add integration tests `tests/integration/api/insights.spec.ts`.

3. Acceptance checklist:
   - [ ] API returns existing insights.
   - [ ] POST regeneration triggers engine and returns new insights.
   - [ ] Auth enforced.

Files to create (Phase B)
```typescript name=src/app/api/ai/insights/route.ts
// path: src/app/api/ai/insights/route.ts
import { NextResponse } from 'next/server';
import { generateInsightsForUser } from '../../../../lib/ai/insights-engine';
import { getSessionUserId } from '../../../../lib/auth/auth'; // existing helper

export async function GET(req: Request) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // parse query dates
  const insights = await generateInsightsForUser(userId, new Date(), new Date());
  return NextResponse.json({ insights });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // trigger regeneration (body may contain range)
  const { start, end } = await req.json();
  const insights = await generateInsightsForUser(userId, new Date(start), new Date(end));
  return NextResponse.json({ insights });
}
```

```typescript name=tests/integration/api/insights.spec.ts
// path: tests/integration/api/insights.spec.ts
import { describe, it } from 'vitest';
// TODO: use test-server or handler to call route handlers
describe('API: /api/ai/insights', () => {
  it('returns 401 for unauthenticated requests', async () => {
    // Implementation stub
  });
});
```

Phase C — Analytics UI & Weekly Report
1. Design:
   - Add insights card UI `src/components/analytics/insights-card.tsx` (exists in repo per PRD but may be incomplete).
   - Add analytics/dashboard page improvements to show insights and weekly report generation trigger `src/app/(dashboard)/analytics/page.tsx`.
   - Provide "Generate weekly report" button that calls POST insights endpoint.

2. Tasks:
   - Implement minimal accessible card with title, excerpt, CTA to view details.
   - Implement page-level fetching using server actions or client fetch depending on SSR needs.
   - Add E2E test `tests/e2e/analytics.spec.ts` that asserts insight card visible.

3. Acceptance checklist:
   - [ ] Insights card displays items from API.
   - [ ] Weekly report generation button triggers POST and adds an Insight row.
   - [ ] All interactive elements keyboard accessible.

Files to create / update (Phase C)
```tsx name=src/components/analytics/insights-card.tsx
// path: src/components/analytics/insights-card.tsx
import React from 'react';

export function InsightsCard({ insight }: { insight: any }) {
  return (
    <article aria-labelledby={`insight-${insight.id}`} className="p-4 bg-white rounded shadow">
      <h3 id={`insight-${insight.id}`} className="text-lg font-semibold">{insight.title}</h3>
      <p className="text-sm text-muted-foreground">{insight.content}</p>
      <div className="mt-2 text-xs text-muted-foreground">Score: {insight.score ?? '—'}</div>
    </article>
  );
}
```

```tsx name=src/app/(dashboard)/analytics/page.tsx
// path: src/app/(dashboard)/analytics/page.tsx
import React from 'react';
import { InsightsCard } from '../../../components/analytics/insights-card';

export default async function AnalyticsPage() {
  // Server fetch to /api/ai/insights
  // TODO: call API and map insights
  const insights: any[] = [];
  return (
    <main>
      <h1 className="text-2xl font-bold">Analytics & Insights</h1>
      <section className="grid gap-4 mt-4">{insights.map(i => <InsightsCard key={i.id} insight={i} />)}</section>
    </main>
  );
}
```

Phase D — Calendar Sharing (Backend + UI + Tests)
1. Design:
   - Backend: POST to `src/app/api/calendars/share/route.ts` to create `CalendarShare` (`Permission` enum present in schema). (`prisma/schema.prisma`)
   - Service: `src/services/sharing.service.ts` to encapsulate creation, validation (user exists, calendar ownership), email notifications.
   - Frontend: `src/components/calendar/share-dialog.tsx` component to add collaborators by email, set permission, and show share link.
   - Seed: add sample shares for e2e testing.

2. Tasks:
   - Implement service + API route with ownership checks and create CalendarShare row.
   - Implement dialog component with form and client-side validation (email).
   - Add integration tests and E2E tests that simulate share flow.

3. Acceptance checklist:
   - [ ] Only calendar owner can create share (ownership verified).
   - [ ] Recipient receives a CalendarShare row and can view shared calendar.
   - [ ] Share link or invite flow operates (basic).

Files to create (Phase D)
```typescript name=src/services/sharing.service.ts
// path: src/services/sharing.service.ts
import { prisma } from '../lib/db/prisma';

export async function shareCalendar(calendarId: string, ownerId: string, recipientEmail: string, permission: 'VIEW' | 'EDIT' | 'ADMIN') {
  // 1. validate calendar belongs to ownerId
  // 2. find or create recipient user
  // 3. create CalendarShare row
  // 4. return share row
  return null;
}
```

```typescript name=src/app/api/calendars/share/route.ts
// path: src/app/api/calendars/share/route.ts
import { NextResponse } from 'next/server';
import { shareCalendar } from '../../../../services/sharing.service';
import { getSessionUserId } from '../../../../lib/auth/auth';

export async function POST(req: Request) {
  const userId = await getSessionUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { calendarId, email, permission } = await req.json();
  const share = await shareCalendar(calendarId, userId, email, permission);
  return NextResponse.json({ share });
}
```

```tsx name=src/components/calendar/share-dialog.tsx
// path: src/components/calendar/share-dialog.tsx
import React, { useState } from 'react';

export function ShareDialog({ calendarId }: { calendarId: string }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'VIEW'|'EDIT'|'ADMIN'>('VIEW');
  const handleShare = async () => {
    await fetch('/api/calendars/share', { method: 'POST', body: JSON.stringify({ calendarId, email, permission }) });
  };
  return (
    <div>
      <label>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <label>Permission</label>
      <select value={permission} onChange={e => setPermission(e.target.value as any)} />
      <button onClick={handleShare}>Share</button>
    </div>
  );
}
```

Phase E — Real-time presence
1. Design:
   - Use existing `src/lib/realtime/pusher.ts` or extend it to support presence channels for calendar views.
   - Implement `src/hooks/use-realtime.ts` presence functionality: join/leave, presence list fetch, reconnection.
   - Emit presence updates on share acceptance and when users open shared calendar pages.

2. Tasks:
   - Add presence join/leave API client in frontend.
   - Add presence list UI to calendar sidebar showing who is viewing (basic).
   - Add E2E test verifying presence updates across two browser sessions (Playwright).

3. Acceptance checklist:
   - [ ] Presence list shows online viewers for a shared calendar within ~5s of connect.
   - [ ] Reconnect logic gracefully restores presence.

Files to update / create (Phase E)
```typescript name=src/lib/realtime/pusher.ts
// path: src/lib/realtime/pusher.ts
// (extend or create thin wrapper used by hooks)
export function initPusherClient(key: string, cluster?: string) {
  // TODO: initialize Pusher or Socket.io client with safe defaults
  return null;
}
```

Phase F — Tests, Monitoring & Release
1. Add integration and E2E tests (Playwright) for:
   - Insights generation + UI display
   - Share flow end-to-end: owner shares → recipient sees calendar
   - Presence sync between sessions
2. Add monitoring hooks (emit Sentry events on insights-engine failures).
3. Add migration/seed updates if new seed data needed.
4. Docs: update `docs/` with "How Insights Work" and "Calendar Sharing Guide".

Files to create (Phase F)
```ts name=scripts/seed-insights.ts
// path: scripts/seed-insights.ts
// small script to seed example insights for development/testing
import { prisma } from '../src/lib/db/prisma';
async function seed() {
  // TODO: create sample Insight rows
}
seed();
```

Operational checklist (per milestone)
- Code implemented with tests → PR
- PR review: API, security (ownership checks), input validation
- Performance: measure insights generation latency and add Redis caching if >2s for common requests
- Accessibility: keyboard focus and ARIA for new components
- Docs: update `docs/ARCHITECTURE.md` or new doc pages
- Release: merge → preview deploy → smoke E2E → promote to production

Risk mitigation
- LLM/third-party outages: insights engine must gracefully fallback to heuristic insights (no LLM) and log via Sentry. (`Project Requirements Document.md`, `README.md`)
- DB schema migration: add small migration for any new fields, test locally with `pnpm prisma migrate dev`. (`README.md`)
- Real-time scaling: use presence channel max limits and fallback polling if channels fail.

Developer & QA handoff checklist
- [ ] Unit tests (Vitest) pass
- [ ] Integration tests pass locally
- [ ] Playwright E2E smoke flows pass in preview
- [ ] PR includes migration/seed changes and docs
- [ ] Performance metrics captured (latency) and acceptable
- [ ] Security checklist: auth enforced for APIs, ownership checks for sharing

What I created for you in this plan
- A strategic next-phase definition aligned to the PRD and repo artifacts (`prisma/schema.prisma`, `src/app/api/ai/insights/route.ts`, `src/components/analytics/insights-card.tsx`). (`Project Requirements Document.md`, `README.md`, `prisma/schema.prisma`)
- A phased execution plan, checklists, acceptance criteria and risk mitigations.
- Concrete file templates/stubs (above) to jumpstart implementation, including unit/integration/E2E test placeholders.

Next immediate recommended actions
1. Pick a small team or single engineer to implement Phase A (insights engine). Merge the stubs above into a feature branch.
2. Wire environment secrets for LLM provider (add names to `.env.example`) and configure Sentry/Redis as needed (see `.env.local` keys). (`.env.local`)
3. Run unit tests and iterate.
