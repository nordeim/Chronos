# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Development Commands

### Essential Commands
- Install dependencies: `pnpm install` — shown in Quick Start and multiple setup sections. (`README.md`)
- Run development server: `pnpm dev` — Quick Start / Local Development. (`README.md`)
- Build for production: `pnpm build` then `pnpm start`. (`README.md`)
- Format / lint / checks referenced as scripts: `pnpm format`, `pnpm lint`, `pnpm type-check`, `pnpm check-all`. (`README.md`)

Code example (from README quick start):
```bash
// path: README.md
# Clone the repository
git clone https://github.com/nordeim/Chronos.git
cd Chronos

# Install dependencies with pnpm (recommended)
pnpm install
...
# Start the development server
pnpm dev
```

### Database Operations
- Generate Prisma client: `pnpm prisma generate` — Quick Start & Database Setup. (`README.md`)
- Run migrations / push schema:
  - Local dev migration flow: `pnpm prisma migrate dev` (docs & scripts mention). (`README.md`)
  - Production: `pnpm prisma migrate deploy` (Deployment section). (`README.md`)
- Seed database: `pnpm prisma db seed` or `pnpm prisma db push` — shown in Quick Start. (`README.md`)

Schema location: `prisma/schema.prisma` (schema and models present). (`Project Requirements Document.md`, `prisma/`)

### Deployment
- Vercel deployment (recommended) — steps and Vercel CLI instructions referenced. (`README.md`)
- Docker: Build and run example given (`docker build -t chronos .` / `docker run -p 3000:3000 --env-file .env.local chronos`). (`README.md`)
- Self-host/pm2 instructions also provided. (`README.md`)

CI/CD: GitHub Actions workflows hinted in repository layout (`.github/workflows/ci.yml`, `.github/workflows/deploy.yml`) — see repo structure. (`README.md`)

## Architecture Overview

### Core Technology Stack
- Framework: Next.js (App Router, Next.js 15 referenced). (`Project Requirements Document.md`)
- Language / Runtime: TypeScript + Node.js 22 / React 19. (`Project Requirements Document.md`)
- Package manager: pnpm (commands in README). (`README.md`)
- ORM / DB: Prisma + PostgreSQL (schema in `prisma/schema.prisma`). (`prisma/schema.prisma`, `Project Requirements Document.md`)
- Auth: Auth.js / NextAuth referenced (`src/app/api/auth/[...nextauth]/route.ts`, `src/lib/auth/`). (`README.md`, `Project Requirements Document.md`)
- Real-time: Pusher / Socket.io mentioned (`src/lib/realtime/pusher.ts`, webhook routes). (`Project Requirements Document.md`, `README.md`)
- Storage: AWS S3 / Vercel Blob referenced; env vars for AWS present. (`Project Requirements Document.md`, `.env.local`)
- UI libs: Radix UI, Tailwind CSS, Framer Motion listed. (`Project Requirements Document.md`)
- State: Zustand for client state; TanStack Query for server state. (`Project Requirements Document.md`)
- Validation/forms: React Hook Form + Zod referenced. (`Project Requirements Document.md`)
- Testing: Vitest (unit), Playwright (E2E). (`Project Requirements Document.md`)
- Monitoring / Analytics: Sentry, PostHog, Vercel Analytics mentioned. (`Project Requirements Document.md`, `README.md`)

Every technology above is referenced in the repository documentation and PRD. (`README.md`, `Project Requirements Document.md`)

### Database Schema (high-level)
Key models and relations (schema located at `prisma/schema.prisma`):
- Core user & auth: `User`, `Account`, `Session` — user identity, OAuth accounts and sessions. (`prisma/schema.prisma`)
- Calendars & sharing: `Calendar`, `CalendarShare` — user calendars and share permissions. (`prisma/schema.prisma`)
- Events & attendees: `Event`, `EventAttendee`, `EventTag` — calendar events, attendees, tags. (`prisma/schema.prisma`)
- Tasks & assignments: `Task`, `TaskAssignment`, `TaskTag` — task hierarchy, assignments, tags. (`prisma/schema.prisma`)
- Organization: `Category`, `Tag` — categories and tags per user. (`prisma/schema.prisma`)
- Productivity data: `FocusSession`, `Insight` — tracking sessions and generated insights. (`prisma/schema.prisma`)
- Notifications: `Notification` — in-app/email reminder records. (`prisma/schema.prisma`)

Notable constraints and indices:
- Many-to-many join models use compound IDs (e.g., `EventTag` has `@@id([eventId, tagId])`). (`prisma/schema.prisma`)
- Unique constraints and `@@index` used for performance on common query fields (e.g., `@@unique([userId, name])`, `@@index([startDateTime, endDateTime])`). (`prisma/schema.prisma`)

Minimal schema snippet:
```prisma
// path: prisma/schema.prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String?
  avatar            String?
  emailVerified     DateTime?
  timezone          String    @default("UTC")
  locale            String    @default("en")
  preferences       Json      @default("{}")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  accounts          Account[]
  sessions          Session[]
  calendars         Calendar[]
  events            Event[]
  tasks             Task[]
}
```

(Full schema available at `prisma/schema.prisma` and described in the PRD.) (`prisma/schema.prisma`, `Project Requirements Document.md`)

### Authentication Flow
- Auth uses Auth.js / NextAuth pattern with an API route at `src/app/api/auth/[...nextauth]/route.ts` and helpers in `src/lib/auth/` — session-based strategy. (`README.md`, `Project Requirements Document.md`)
- Middleware exists at `src/middleware.ts` for route protection, locale and rate limiting (listed in app overview). (`README.md`)
- Onboarding/preferences stored on `User.preferences` and `User.onboardingStatus` fields in schema. (`prisma/schema.prisma`)

### App Structure
Major directories and purpose (from project documentation):
- `src/app/` — Next.js App Router routes and page-level layout/components (landing, auth, dashboard groups). (`README.md`)
- `src/components/` — UI components split by concern (ui, calendar, tasks, shared, analytics, focus). (`README.md`)
- `src/lib/` — core libraries: `auth`, `db`, `api` utilities, `ai` logic, `email`, `realtime`. (`README.md`)
- `src/stores/` — Zustand stores for client state: `calendar-store.ts`, `task-store.ts`, `ui-store.ts`, etc. (`README.md`)
- `src/services/` — business logic services (`event.service.ts`, `task.service.ts`, `analytics.service.ts`). (`README.md`)
- `prisma/` — schema, seed and migrations. (`README.md`, `prisma/`)

Key routes called out in layout:
- Auth routes under `(auth)` group (login/signup/reset). (`README.md`)
- Dashboard protected routes under `(dashboard)` group (calendar, tasks, focus, analytics). (`README.md`)
- API routes under `src/app/api/` including `events`, `tasks`, `ai`, `webhooks`, `cron`. (`README.md`)

### State Management
- Client store: Zustand — files `src/stores/calendar-store.ts`, `src/stores/task-store.ts`. (`README.md`)
- Server state / data fetching: TanStack Query mentioned in Tech Stack. (`Project Requirements Document.md`)

### Real-time Features
- WebSocket / Pusher integration for real-time sync and presence; pusher configuration and webhook handlers referenced (`src/lib/realtime/pusher.ts`, `src/app/api/webhooks/pusher/route.ts`). (`Project Requirements Document.md`, `README.md`)
- Optimistic updates and offline queue patterns referenced in hooks and stores (e.g., `use-realtime.ts`, store descriptions). (`README.md`)

### File Upload / Storage
- S3 is supported as storage backend; related env vars present: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`. (`.env.local`, `Project Requirements Document.md`)
- Upload signing and storage flows are referenced in `src/app/api/` and `src/services` sections. (`README.md`)

### Testing
- Unit tests: Vitest — configuration file referenced (`vitest.config.ts`) and `tests/unit/` layout. (`Project Requirements Document.md`, `README.md`)
- E2E tests: Playwright — `tests/e2e/` contains specs (e.g., `auth.spec.ts`, `calendar.spec.ts`, `tasks.spec.ts`). (`README.md`)
- Integration tests: `tests/integration/` (API integration). (`README.md`)

## Key Patterns

### [Pattern 1: Service Layer encapsulation]
- What/Why/Where: Business logic for domain operations lives in `src/services/` and exposes cohesive methods for controllers and UI to consume; keeps controllers (API routes) thin and testable. (`README.md`)
```typescript
// path: src/services/event.service.ts
- createEvent() - Create new calendar events with conflict detection
- updateEvent() - Modify events with optimistic updates
- deleteEvent() - Remove events with cascade handling
- getEvents() - Fetch events with filtering and pagination
- handleRecurring() - Process recurring event patterns
- detectConflicts() - Real-time scheduling conflict detection
```
(Methods listed in PRD and README; implementors should mirror this thin-controller / service pattern.) (`Project Requirements Document.md`, `README.md`)

### [Pattern 2: Prisma schema-first data modeling]
- What/Why/Where: The project uses a Prisma schema (`prisma/schema.prisma`) as the canonical data model; relations and indices are defined there, and Prisma client is generated to provide typed DB access. (`prisma/schema.prisma`, `README.md`)
```prisma
// path: prisma/schema.prisma
model Calendar {
  id           String          @id @default(cuid())
  name         String
  description  String?
  color        String          @default("#3B82F6")
  isDefault    Boolean         @default(false)
  userId       String
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  user         User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  events       Event[]
  shares       CalendarShare[]
}
```

### Error Handling
- Global boundaries and middleware:
  - Client error boundaries: `src/app/error.tsx` and `src/app/not-found.tsx` for graceful fallback UI. (`README.md`)
  - Server-side middleware for auth, rate limiting and logging at `src/middleware.ts`. (`README.md`)
- Logging / monitoring hooks: Sentry referenced in deployment / monitoring instructions. (`Project Requirements Document.md`)

Example (routing / middleware mention):
```typescript
// path: src/middleware.ts
// middleware responsibilities listed in README: authentication verification, locale detection, rate limiting, request logging and analytics
```
(`README.md`)

## Visual Development & Testing

### Design System
- Tokens & libraries: Tailwind CSS as primary styling system; Radix UI for primitives and Framer Motion for animations. (`Project Requirements Document.md`)
- Component organization: `src/components/ui/` for base UI components and `src/components/shared/` for cross-cutting UI like `command-palette.tsx`. (`README.md`)

### Quick Visual Check (6 steps)
1. Start dev server: `pnpm dev`. (`README.md`)
2. Open `http://localhost:3000` and verify landing page renders. (`README.md`)
3. Open Dashboard routes (calendar/task pages) — check major UI: `src/app/(dashboard)/calendar/page.tsx`, `src/app/(dashboard)/tasks/page.tsx`. (`README.md`)
4. Exercise command palette: activate ⌘+K and ensure NLP quick-add UI exists (`src/components/shared/command-palette.tsx`). (`README.md`)
5. Run E2E smoke tests: Playwright/`tests/e2e/*` if present. (`Project Requirements Document.md`, `README.md`)
6. Verify core animations (Framer Motion) and responsive breakpoints using devtools. (`Project Requirements Document.md`)

### Comprehensive Design Review
- If adding major UI features:
  - Validate tokens and Tailwind config in `tailwind.config.ts`. (`README.md`)
  - Verify accessibility roles and keyboard nav on shared components (`src/components/shared/*`). (`README.md`)
  - Run Playwright suite for end-to-end user flows in `tests/e2e/`. (`README.md`, `Project Requirements Document.md`)

### Playwright / E2E integration
- E2E specs live under `tests/e2e/` (examples: `auth.spec.ts`, `calendar.spec.ts`, `tasks.spec.ts`). Run with Playwright CLI or configured npm script. (`README.md`)
```javascript
// path: tests/e2e/auth.spec.ts
// (file exists per README structure — run using Playwright test runner)
```

### Design Compliance Checklist
- [ ] Visual hierarchy (components in `src/components/`)
- [ ] Token consistency (Tailwind + design tokens) (`tailwind.config.ts`)
- [ ] Responsiveness and breakpoints (app layouts under `src/app/`)
- [ ] Accessibility: keyboard navigation & ARIA on Radix-based components (`src/components/ui/`) (`Project Requirements Document.md`)
- [ ] Performance: check Core Web Vitals and bundle size (deployment guide references). (`Project Requirements Document.md`)
- [ ] Loading / empty / error states (`src/components/shared/loading-states.tsx`, `src/app/error.tsx`). (`README.md`)

## When to Use Automated Visual Testing

### Use Quick Visual Check for:
- Small UI tweaks (styling, spacing, color adjustments) — smoke with Playwright or manual checks. (`Project Requirements Document.md`, `README.md`)

### Use Comprehensive Design Review for:
- New pages, large layout changes, or state-driven UI (calendar/time-grid, kanban). (`README.md`)

### Skip Visual Testing for:
- Pure backend changes (service logic, DB migrations) that do not alter UI. (Repo separation between `src/services/` and `src/components/` indicates this pattern.) (`README.md`, `prisma/schema.prisma`)

## Environment Setup

List of required environment variable NAMES (no values) discovered in `.env.local` and docs:
- DATABASE_URL, DIRECT_URL (`.env.local`)
- NEXTAUTH_URL, NEXTAUTH_SECRET (`.env.local`)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET (`.env.local`)
- RESEND_API_KEY, EMAIL_FROM (`.env.local`)
- PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER (`.env.local`)
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME (`.env.local`)
- POSTHOG_KEY, SENTRY_DSN (`.env.local`)

(See `.env.local` for the complete list of names — do not include values.) (`.env.local`)

## Additional Context & Docs
- PRD and architecture overview live in `Project Requirements Document.md` — comprehensive decisions, stack, and roadmap. (`Project Requirements Document.md`)
- High-level onboarding and contributing info referenced in `README.md` and `docs/` (docs folder referenced). (`README.md`)
- Tests and CI referenced under `tests/` and `.github/workflows/` in the repository layout. (`README.md`)

Monorepo note: This repository appears as a single Next.js app (not a multi-package monorepo); root tooling (ESLint, Prettier, tsconfig) is referenced in the top-level file list. (`README.md`)

---

Self-check:
- All claims are substantiated by files present in the repository: `README.md`, `Project Requirements Document.md`, `prisma/schema.prisma`, `.env.local`, and the directory layout referenced throughout the docs. (`README.md`, `Project Requirements Document.md`, `prisma/schema.prisma`, `.env.local`)
