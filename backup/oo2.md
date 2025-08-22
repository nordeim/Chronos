# **Core Configuration Files Implementation**

I'll create these two foundational files with exceptional attention to detail, ensuring they provide a rock-solid foundation for our Chronos application.

## **1. `src/app/globals.css`**

```css
/* chronos/src/app/globals.css */

/* ===================================================================
   Tailwind CSS Directives
   =================================================================== */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ===================================================================
   Font Face Declarations
   =================================================================== */
@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/inter-var.woff2') format('woff2-variations');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
    U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Cal Sans';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/cal-sans.woff2') format('woff2');
}

/* ===================================================================
   CSS Custom Properties - Design Tokens
   =================================================================== */
@layer base {
  :root {
    /* Color Palette - Light Mode */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    
    --success: 142 76% 36%;
    --success-foreground: 210 40% 98%;
    
    --warning: 38 92% 50%;
    --warning-foreground: 222.2 84% 4.9%;
    
    --error: 0 84.2% 60.2%;
    --error-foreground: 210 40% 98%;
    
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    
    --radius: 0.5rem;
    
    /* Spacing Scale */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-2xl: 3rem;
    --spacing-3xl: 4rem;
    
    /* Typography Scale */
    --font-inter: 'Inter Variable', system-ui, -apple-system, sans-serif;
    --font-cal: 'Cal Sans', var(--font-inter);
    --font-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
    
    /* Animation Timing */
    --animation-fast: 150ms;
    --animation-base: 250ms;
    --animation-slow: 350ms;
    --animation-slower: 500ms;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    --shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
    
    /* Z-Index Scale */
    --z-base: 0;
    --z-dropdown: 10;
    --z-sticky: 20;
    --z-overlay: 30;
    --z-modal: 40;
    --z-popover: 50;
    --z-tooltip: 60;
    --z-toast: 70;
    --z-maximum: 9999;
  }
  
  .dark {
    /* Color Palette - Dark Mode */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    
    --destructive: 0 62.8% 50.6%;
    --destructive-foreground: 210 40% 98%;
    
    --success: 142 76% 46%;
    --success-foreground: 210 40% 98%;
    
    --warning: 38 92% 60%;
    --warning-foreground: 222.2 84% 4.9%;
    
    --error: 0 62.8% 50.6%;
    --error-foreground: 210 40% 98%;
    
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

/* ===================================================================
   Global Styles
   =================================================================== */
@layer base {
  * {
    @apply border-border;
  }
  
  html {
    @apply scroll-smooth antialiased;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: 'rlig' 1, 'calt' 1, 'ss01' 1, 'ss02' 1;
  }
  
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-inter);
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    line-height: 1.5;
    min-height: 100vh;
    min-height: 100dvh;
  }
  
  /* Focus Visible Styles */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
  
  /* Selection Styles */
  ::selection {
    @apply bg-primary/20 text-primary-foreground;
  }
  
  /* Scrollbar Styles */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/20 rounded-full;
    @apply hover:bg-muted-foreground/30;
  }
  
  /* Firefox Scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted-foreground) / 0.2) transparent;
  }
  
  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}

/* ===================================================================
   Typography Styles
   =================================================================== */
@layer base {
  h1, h2, h3, h4, h5, h6 {
    @apply font-display tracking-tight;
  }
  
  h1 {
    @apply text-4xl md:text-5xl lg:text-6xl font-bold;
  }
  
  h2 {
    @apply text-3xl md:text-4xl lg:text-5xl font-bold;
  }
  
  h3 {
    @apply text-2xl md:text-3xl lg:text-4xl font-semibold;
  }
  
  h4 {
    @apply text-xl md:text-2xl lg:text-3xl font-semibold;
  }
  
  h5 {
    @apply text-lg md:text-xl lg:text-2xl font-medium;
  }
  
  h6 {
    @apply text-base md:text-lg lg:text-xl font-medium;
  }
  
  p {
    @apply leading-relaxed;
  }
  
  code {
    @apply px-1.5 py-0.5 rounded-md bg-muted font-mono text-sm;
  }
  
  pre {
    @apply overflow-x-auto rounded-lg bg-muted p-4;
  }
  
  pre code {
    @apply p-0 bg-transparent;
  }
  
  blockquote {
    @apply border-l-4 border-primary/30 pl-4 italic;
  }
  
  mark {
    @apply bg-warning/20 text-warning-foreground px-1 rounded;
  }
}

/* ===================================================================
   Component Styles
   =================================================================== */
@layer components {
  /* Glass Morphism Card */
  .glass {
    @apply bg-background/80 backdrop-blur-xl backdrop-saturate-150;
    @apply border border-border/50;
    @apply shadow-xl;
  }
  
  .glass-subtle {
    @apply bg-background/60 backdrop-blur-md backdrop-saturate-150;
    @apply border border-border/30;
  }
  
  /* Gradient Backgrounds */
  .gradient-primary {
    @apply bg-gradient-to-br from-primary/90 via-primary to-primary/90;
  }
  
  .gradient-mesh {
    background-image: 
      radial-gradient(at 40% 20%, hsla(var(--primary), 0.3) 0px, transparent 50%),
      radial-gradient(at 80% 0%, hsla(var(--secondary), 0.2) 0px, transparent 50%),
      radial-gradient(at 40% 100%, hsla(var(--accent), 0.2) 0px, transparent 50%),
      radial-gradient(at 80% 100%, hsla(var(--primary), 0.15) 0px, transparent 50%);
  }
  
  .gradient-radial {
    background: radial-gradient(
      circle at center,
      hsl(var(--primary) / 0.1) 0%,
      transparent 70%
    );
  }
  
  /* Animated Gradient */
  .gradient-animated {
    @apply bg-gradient-to-r from-primary via-accent-purple to-accent-pink;
    background-size: 200% 200%;
    animation: gradient-shift 8s ease infinite;
  }
  
  /* Card Styles */
  .card-interactive {
    @apply transition-all duration-300 ease-out;
    @apply hover:shadow-xl hover:-translate-y-1;
    @apply active:scale-[0.98];
  }
  
  .card-glow {
    @apply relative overflow-hidden;
  }
  
  .card-glow::before {
    @apply absolute inset-0 -z-10;
    @apply bg-gradient-to-r from-primary/20 to-accent-purple/20;
    @apply blur-xl;
    content: '';
  }
  
  /* Button Styles */
  .btn-gradient {
    @apply relative overflow-hidden;
    @apply bg-gradient-to-r from-primary to-primary/80;
    @apply transition-all duration-300;
  }
  
  .btn-gradient:hover {
    @apply shadow-lg shadow-primary/25;
    @apply scale-105;
  }
  
  .btn-gradient:active {
    @apply scale-100;
  }
  
  /* Loading States */
  .skeleton {
    @apply relative overflow-hidden bg-muted/50;
  }
  
  .skeleton::after {
    @apply absolute inset-0;
    @apply bg-gradient-to-r from-transparent via-background/50 to-transparent;
    animation: shimmer 2s infinite;
    content: '';
    transform: translateX(-100%);
  }
  
  /* Pulse Dot */
  .pulse-dot {
    @apply relative inline-flex h-3 w-3;
  }
  
  .pulse-dot::before {
    @apply absolute inline-flex h-full w-full rounded-full bg-primary opacity-75;
    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    content: '';
  }
  
  .pulse-dot::after {
    @apply relative inline-flex h-3 w-3 rounded-full bg-primary;
    content: '';
  }
  
  /* Calendar Grid */
  .calendar-grid {
    @apply grid grid-cols-7 gap-px bg-border/20;
  }
  
  .calendar-cell {
    @apply relative bg-background p-2 min-h-[100px];
    @apply hover:bg-muted/50 transition-colors;
    @apply focus-within:ring-2 focus-within:ring-primary/50;
  }
  
  .calendar-cell-today {
    @apply bg-primary/5 font-semibold;
  }
  
  .calendar-cell-selected {
    @apply bg-primary/10 ring-2 ring-primary/50;
  }
  
  .calendar-cell-disabled {
    @apply opacity-50 cursor-not-allowed bg-muted/20;
  }
  
  /* Time Grid */
  .time-grid {
    @apply relative;
    background-image: repeating-linear-gradient(
      to bottom,
      hsl(var(--border) / 0.5) 0px,
      hsl(var(--border) / 0.5) 1px,
      transparent 1px,
      transparent 60px
    );
  }
  
  .time-slot {
    @apply h-[60px] border-b border-border/20;
    @apply hover:bg-muted/30 transition-colors;
  }
  
  .time-slot-active {
    @apply bg-primary/5 border-primary/30;
  }
  
  /* Event Cards */
  .event-card {
    @apply rounded-md p-2 text-xs font-medium;
    @apply truncate cursor-pointer select-none;
    @apply transition-all duration-200;
    @apply hover:shadow-md hover:scale-[1.02];
    @apply active:scale-[0.98];
  }
  
  .event-card-dragging {
    @apply opacity-50 cursor-move;
  }
  
  /* Task Items */
  .task-item {
    @apply flex items-center gap-3 p-3 rounded-lg;
    @apply border border-transparent;
    @apply hover:border-border hover:bg-muted/50;
    @apply transition-all duration-200;
  }
  
  .task-item-completed {
    @apply opacity-50 line-through;
  }
  
  .task-priority-high {
    @apply border-l-4 border-l-error;
  }
  
  .task-priority-medium {
    @apply border-l-4 border-l-warning;
  }
  
  .task-priority-low {
    @apply border-l-4 border-l-success;
  }
  
  /* Focus Timer */
  .timer-ring {
    @apply relative h-64 w-64;
  }
  
  .timer-ring svg {
    @apply -rotate-90 transform;
  }
  
  .timer-ring-bg {
    @apply stroke-muted;
  }
  
  .timer-ring-progress {
    @apply stroke-primary transition-all duration-1000 ease-linear;
  }
  
  /* Command Palette */
  .command-item {
    @apply flex items-center gap-3 px-3 py-2 rounded-md;
    @apply cursor-pointer select-none;
    @apply hover:bg-muted;
    @apply aria-selected:bg-muted aria-selected:text-foreground;
  }
  
  /* Kanban Board */
  .kanban-column {
    @apply flex-1 min-w-[300px] bg-muted/30 rounded-lg p-4;
    @apply border-2 border-dashed border-border/50;
  }
  
  .kanban-column-active {
    @apply border-primary/50 bg-primary/5;
  }
  
  .kanban-card {
    @apply bg-background rounded-lg p-3 mb-2 shadow-sm;
    @apply cursor-move select-none;
    @apply hover:shadow-md transition-shadow;
  }
  
  .kanban-card-dragging {
    @apply opacity-50 rotate-2;
  }
}

/* ===================================================================
   Utility Classes
   =================================================================== */
@layer utilities {
  /* Text Utilities */
  .text-balance {
    text-wrap: balance;
  }
  
  .text-gradient {
    @apply bg-gradient-to-r from-primary to-accent-purple;
    @apply bg-clip-text text-transparent;
  }
  
  .text-shimmer {
    @apply bg-gradient-to-r from-primary via-accent-purple to-primary;
    @apply bg-clip-text text-transparent;
    background-size: 200% 100%;
    animation: shimmer 3s linear infinite;
  }
  
  /* Animation Utilities */
  .animate-in {
    animation: fade-in var(--animation-base) ease-out;
  }
  
  .animate-out {
    animation: fade-out var(--animation-base) ease-out;
  }
  
  .animate-slide-in {
    animation: slide-in var(--animation-base) ease-out;
  }
  
  .animate-slide-out {
    animation: slide-out var(--animation-base) ease-out;
  }
  
  .animate-zoom-in {
    animation: zoom-in var(--animation-fast) ease-out;
  }
  
  .animate-zoom-out {
    animation: zoom-out var(--animation-fast) ease-out;
  }
  
  /* Transition Utilities */
  .transition-smooth {
    @apply transition-all duration-300 ease-out;
  }
  
  .transition-spring {
    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  .transition-bounce {
    transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  /* Scroll Utilities */
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  .scroll-fade {
    mask-image: linear-gradient(
      to bottom,
      transparent,
      black 20px,
      black calc(100% - 20px),
      transparent
    );
  }
  
  /* Backdrop Utilities */
  .backdrop-glass {
    @apply backdrop-blur-xl backdrop-saturate-150;
  }
  
  .backdrop-dim {
    @apply backdrop-brightness-50;
  }
  
  /* Grid Utilities */
  .grid-auto-fill-sm {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .grid-auto-fill-md {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .grid-auto-fill-lg {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  /* Aspect Ratio Utilities */
  .aspect-card {
    aspect-ratio: 16 / 9;
  }
  
  .aspect-avatar {
    aspect-ratio: 1 / 1;
  }
  
  /* Safe Area Utilities (for mobile) */
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }
  
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .safe-left {
    padding-left: env(safe-area-inset-left);
  }
  
  .safe-right {
    padding-right: env(safe-area-inset-right);
  }
}

/* ===================================================================
   Animations
   =================================================================== */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes slide-in {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slide-out {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
}

@keyframes zoom-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes zoom-out {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.95);
    opacity: 0;
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes glow {
  from {
    box-shadow: 0 0 10px -10px currentColor;
  }
  to {
    box-shadow: 0 0 20px -10px currentColor;
  }
}

@keyframes bounce-soft {
  0%, 100% {
    transform: translateY(-5%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

/* ===================================================================
   Print Styles
   =================================================================== */
@media print {
  body {
    @apply bg-white text-black;
  }
  
  .no-print {
    @apply hidden;
  }
  
  .print-break {
    page-break-after: always;
  }
  
  a {
    @apply text-black underline;
  }
  
  a[href^="http"]:after {
    content: " (" attr(href) ")";
  }
}

/* ===================================================================
   Custom Scrollbar Tracks for Different Sections
   =================================================================== */
.calendar-scroll::-webkit-scrollbar-thumb {
  @apply bg-primary/30;
}

.task-scroll::-webkit-scrollbar-thumb {
  @apply bg-success/30;
}

.focus-scroll::-webkit-scrollbar-thumb {
  @apply bg-warning/30;
}

/* ===================================================================
   Loading Spinner
   =================================================================== */
.spinner {
  @apply inline-block h-8 w-8;
  @apply animate-spin rounded-full;
  @apply border-4 border-solid border-current border-r-transparent;
}

.spinner-sm {
  @apply h-4 w-4 border-2;
}

.spinner-lg {
  @apply h-12 w-12 border-4;
}

/* ===================================================================
   Accessibility Utilities
   =================================================================== */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  :root {
    --border: 0 0% 0%;
  }
  
  .dark {
    --border: 0 0% 100%;
  }
}

/* ===================================================================
   End of Global Styles
   =================================================================== */
```

## **2. `prisma/schema.prisma`**

```prisma
// chronos/prisma/schema.prisma
// This is your Prisma schema file for Chronos
// Learn more: https://pris.ly/d/prisma-schema

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex", "jsonProtocol", "extendedWhereUnique"]
  binaryTargets   = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ====================================================================
// User & Authentication Models
// ====================================================================

model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  emailVerified         DateTime?
  name                  String?
  username              String?   @unique
  avatar                String?
  bio                   String?
  timezone              String    @default("UTC")
  locale                String    @default("en")
  dateFormat            String    @default("MM/dd/yyyy")
  timeFormat            String    @default("12h")
  weekStartsOn          Int       @default(0) // 0 = Sunday, 1 = Monday
  defaultCalendarView   ViewMode  @default(WEEK)
  
  // Preferences stored as JSON
  preferences           Json      @default("{}")
  notificationSettings  Json      @default("{}")
  keyboardShortcuts     Json      @default("{}")
  
  // Onboarding & Setup
  onboardingCompleted   Boolean   @default(false)
  onboardingStep        Int       @default(0)
  setupCompletedAt      DateTime?
  
  // Subscription & Billing
  subscriptionTier      Tier      @default(FREE)
  subscriptionStatus    SubscriptionStatus @default(ACTIVE)
  subscriptionEndDate   DateTime?
  stripeCustomerId      String?   @unique
  stripeSubscriptionId  String?   @unique
  
  // Activity Tracking
  lastActiveAt          DateTime  @default(now())
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  deletedAt             DateTime? // Soft delete
  
  // Relations
  accounts              Account[]
  sessions              Session[]
  calendars             Calendar[]
  events                Event[]
  tasks                 Task[]
  categories            Category[]
  tags                  Tag[]
  focusSessions         FocusSession[]
  insights              Insight[]
  notifications         Notification[]
  activityLogs          ActivityLog[]
  integrations          Integration[]
  aiSuggestions         AISuggestion[]
  templates             Template[]
  goals                 Goal[]
  habits                Habit[]
  
  // Sharing & Collaboration
  sharedCalendars       CalendarShare[]  @relation("SharedWith")
  ownedShares           CalendarShare[]  @relation("Owner")
  eventAttendances      EventAttendee[]
  taskAssignments       TaskAssignment[] @relation("AssignedTo")
  taskCreations         TaskAssignment[] @relation("AssignedBy")
  teamMemberships       TeamMember[]
  
  @@index([email])
  @@index([username])
  @@index([stripeCustomerId])
  @@index([lastActiveAt])
  @@index([createdAt])
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("sessions")
}

// ====================================================================
// Calendar & Event Models
// ====================================================================

model Calendar {
  id                String          @id @default(cuid())
  name              String
  slug              String?         @unique
  description       String?
  color             String          @default("#3B82F6")
  icon              String?
  isDefault         Boolean         @default(false)
  isPublic          Boolean         @default(false)
  isArchived        Boolean         @default(false)
  
  // Settings
  timezone          String?
  settings          Json            @default("{}")
  permissions       Json            @default("{}")
  
  // Metadata
  eventCount        Int             @default(0)
  lastEventAt       DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  deletedAt         DateTime?
  
  // Relations
  userId            String
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  events            Event[]
  shares            CalendarShare[]
  
  @@unique([userId, name])
  @@index([userId])
  @@index([slug])
  @@index([isPublic])
  @@map("calendars")
}

model CalendarShare {
  id           String     @id @default(cuid())
  calendarId   String
  sharedWithId String
  sharedById   String
  permission   Permission @default(VIEW)
  expiresAt    DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  calendar     Calendar   @relation(fields: [calendarId], references: [id], onDelete: Cascade)
  sharedWith   User       @relation("SharedWith", fields: [sharedWithId], references: [id], onDelete: Cascade)
  sharedBy     User       @relation("Owner", fields: [sharedById], references: [id], onDelete: Cascade)
  
  @@unique([calendarId, sharedWithId])
  @@index([sharedWithId])
  @@index([calendarId])
  @@map("calendar_shares")
}

model Event {
  id                String          @id @default(cuid())
  title             String
  slug              String?         @unique
  description       String?         @db.Text
  location          String?
  locationUrl       String?
  locationDetails   Json?           // { address, lat, lng, placeId }
  
  // Date & Time
  startDateTime     DateTime
  endDateTime       DateTime
  allDay            Boolean         @default(false)
  timezone          String          @default("UTC")
  
  // Recurrence
  isRecurring       Boolean         @default(false)
  recurringRule     String?         // RRULE format
  recurringId       String?         // Parent recurring event
  recurringEndDate  DateTime?
  excludeDates      DateTime[]      // Excluded dates for recurring events
  
  // Appearance
  color             String?
  icon              String?
  
  // Status & Privacy
  status            EventStatus     @default(CONFIRMED)
  visibility        Visibility      @default(PRIVATE)
  isBusy            Boolean         @default(true)
  isLocked          Boolean         @default(false)
  
  // Reminders & Notifications
  reminders         Json            @default("[]") // Array of reminder objects
  enableReminders   Boolean         @default(true)
  
  // Meeting Details
  meetingUrl        String?
  meetingProvider   String?         // zoom, meet, teams, etc.
  meetingDetails    Json?
  
  // Metadata
  metadata          Json            @default("{}")
  attachments       Json            @default("[]")
  source            String?         // google, outlook, manual, ai
  externalId        String?         // External calendar event ID
  
  // Timestamps
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  deletedAt         DateTime?
  
  // Relations
  userId            String
  calendarId        String
  categoryId        String?
  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  calendar          Calendar        @relation(fields: [calendarId], references: [id], onDelete: Cascade)
  category          Category?       @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  attendees         EventAttendee[]
  tasks             Task[]
  tags              EventTag[]
  comments          Comment[]       @relation("EventComments")
  activityLogs      ActivityLog[]
  
  @@index([userId])
  @@index([calendarId])
  @@index([startDateTime, endDateTime])
  @@index([recurringId])
  @@index([slug])
  @@index([status])
  @@map("events")
}

model EventAttendee {
  id                String          @id @default(cuid())
  eventId           String
  userId            String?
  email             String
  name              String?
  avatar            String?
  status            AttendeeStatus  @default(PENDING)
  role              AttendeeRole    @default(ATTENDEE)
  comment           String?
  notified          Boolean         @default(false)
  notifiedAt        DateTime?
  respondedAt       DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  event             Event           @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user              User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@unique([eventId, email])
  @@index([eventId])
  @@index([userId])
  @@index([status])
  @@map("event_attendees")
}

// ====================================================================
// Task Management Models
// ====================================================================

model Task {
  id                String           @id @default(cuid())
  title             String
  description       String?          @db.Text
  
  // Scheduling
  dueDate           DateTime?
  dueTime           String?          // Specific time if needed
  scheduledDate     DateTime?
  scheduledDuration Int?             // Duration in minutes
  completedAt       DateTime?
  
  // Priority & Status
  priority          Priority         @default(MEDIUM)
  status            TaskStatus       @default(TODO)
  progress          Int              @default(0) // 0-100
  
  // Time Tracking
  estimatedTime     Int?             // in minutes
  actualTime        Int?             // in minutes
  timeSpent         Int              @default(0) // Total time spent
  
  // Recurrence
  isRecurring       Boolean          @default(false)
  recurringRule     String?
  recurringId       String?
  
  // Organization
  order             Int              @default(0)
  column            String?          // For kanban view
  labels            String[]         // Quick labels
  
  // Metadata
  metadata          Json             @default("{}")
  attachments       Json             @default("[]")
  checklist         Json             @default("[]") // Subtask checklist
  
  // Timestamps
  startedAt         DateTime?
  pausedAt          DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  deletedAt         DateTime?
  
  // Relations
  userId            String
  categoryId        String?
  eventId           String?
  parentTaskId      String?
  goalId            String?
  user              User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  category          Category?        @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  event             Event?           @relation(fields: [eventId], references: [id], onDelete: SetNull)
  parentTask        Task?            @relation("TaskSubtasks", fields: [parentTaskId], references: [id], onDelete: Cascade)
  goal              Goal?            @relation(fields: [goalId], references: [id], onDelete: SetNull)
  subtasks          Task[]           @relation("TaskSubtasks")
  assignments       TaskAssignment[]
  tags              TaskTag[]
  focusSessions     FocusSession[]
  comments          Comment[]        @relation("TaskComments")
  activityLogs      ActivityLog[]
  dependencies      TaskDependency[] @relation("DependentTask")
  dependents        TaskDependency[] @relation("DependsOnTask")
  
  @@index([userId])
  @@index([status])
  @@index([dueDate])
  @@index([parentTaskId])
  @@index([eventId])
  @@index([priority, status])
  @@map("tasks")
}

model TaskAssignment {
  id          String   @id @default(cuid())
  taskId      String
  userId      String
  assignedBy  String
  role        String   @default("assignee")
  assignedAt  DateTime @default(now())
  
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user        User     @relation("AssignedTo", fields: [userId], references: [id], onDelete: Cascade)
  assignedByUser User  @relation("AssignedBy", fields: [assignedBy], references: [id], onDelete: Cascade)
  
  @@unique([taskId, userId])
  @@index([userId])
  @@index([taskId])
  @@map("task_assignments")
}

model TaskDependency {
  id              String   @id @default(cuid())
  dependentTaskId String
  dependsOnTaskId String
  type            DependencyType @default(FINISH_TO_START)
  createdAt       DateTime @default(now())
  
  dependentTask   Task     @relation("DependentTask", fields: [dependentTaskId], references: [id], onDelete: Cascade)
  dependsOnTask   Task     @relation("DependsOnTask", fields: [dependsOnTaskId], references: [id], onDelete: Cascade)
  
  @@unique([dependentTaskId, dependsOnTaskId])
  @@index([dependentTaskId])
  @@index([dependsOnTaskId])
  @@map("task_dependencies")
}

// ====================================================================
// Organization Models
// ====================================================================

model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String
  color       String   @default("#6B7280")
  icon        String?
  description String?
  order       Int      @default(0)
  isArchived  Boolean  @default(false)
  userId      String
  parentId    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Category[] @relation("CategoryHierarchy")
  events      Event[]
  tasks       Task[]
  
  @@unique([userId, slug])
  @@index([userId])
  @@index([parentId])
  @@map("categories")
}

model Tag {
  id          String     @id @default(cuid())
  name        String
  slug        String
  color       String     @default("#9CA3AF")
  description String?
  userId      String
  usageCount  Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Relations
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  events      EventTag[]
  tasks       TaskTag[]
  
  @@unique([userId, slug])
  @@index([userId])
  @@index([usageCount])
  @@map("tags")
}

model EventTag {
  eventId     String
  tagId       String
  createdAt   DateTime @default(now())
  
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tag         Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([eventId, tagId])
  @@index([tagId])
  @@map("event_tags")
}

model TaskTag {
  taskId      String
  tagId       String
  createdAt   DateTime @default(now())
  
  task        Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag         Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([taskId, tagId])
  @@index([tagId])
  @@map("task_tags")
}

// ====================================================================
// Productivity Models
// ====================================================================

model FocusSession {
  id          String      @id @default(cuid())
  type        SessionType @default(POMODORO)
  status      SessionStatus @default(ACTIVE)
  
  // Timing
  startTime   DateTime
  endTime     DateTime?
  pausedTime  DateTime?
  resumedTime DateTime?
  plannedDuration Int     // in minutes
  actualDuration Int?    // in seconds
  breakDuration Int?     // in seconds
  pauseCount  Int        @default(0)
  
  // Settings
  settings    Json       @default("{}") // Timer settings
  
  // Metadata
  notes       String?
  mood        Int?       // 1-5 rating
  productivity Int?      // 1-5 rating
  distractions Int      @default(0)
  
  // Timestamps
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Relations
  userId      String
  taskId      String?
  goalId      String?
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  task        Task?      @relation(fields: [taskId], references: [id], onDelete: SetNull)
  goal        Goal?      @relation(fields: [goalId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([startTime])
  @@index([status])
  @@map("focus_sessions")
}

model Goal {
  id            String     @id @default(cuid())
  title         String
  description   String?
  targetValue   Float
  currentValue  Float      @default(0)
  unit          String?
  type          GoalType
  status        GoalStatus @default(ACTIVE)
  priority      Priority   @default(MEDIUM)
  
  // Timing
  startDate     DateTime
  endDate       DateTime
  completedAt   DateTime?
  
  // Metadata
  color         String?
  icon          String?
  metadata      Json       @default("{}")
  
  // Timestamps
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  
  // Relations
  userId        String
  categoryId    String?
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks         Task[]
  focusSessions FocusSession[]
  habits        Habit[]
  milestones    Milestone[]
  
  @@index([userId])
  @@index([status])
  @@index([endDate])
  @@map("goals")
}

model Habit {
  id            String      @id @default(cuid())
  name          String
  description   String?
  frequency     Frequency
  targetCount   Int         @default(1)
  currentStreak Int         @default(0)
  bestStreak    Int         @default(0)
  totalCount    Int         @default(0)
  
  // Schedule
  scheduledDays Int[]       // 0-6 for days of week
  scheduledTime String?     // HH:mm format
  
  // Appearance
  color         String?
  icon          String?
  
  // Status
  isActive      Boolean     @default(true)
  isPaused      Boolean     @default(false)
  
  // Timestamps
  lastCompletedAt DateTime?
  startedAt     DateTime    @default(now())
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Relations
  userId        String
  goalId        String?
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal          Goal?       @relation(fields: [goalId], references: [id], onDelete: SetNull)
  logs          HabitLog[]
  
  @@index([userId])
  @@index([isActive])
  @@map("habits")
}

model HabitLog {
  id          String   @id @default(cuid())
  habitId     String
  date        DateTime
  completed   Boolean  @default(true)
  notes       String?
  createdAt   DateTime @default(now())
  
  habit       Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  
  @@unique([habitId, date])
  @@index([habitId])
  @@index([date])
  @@map("habit_logs")
}

model Milestone {
  id          String   @id @default(cuid())
  goalId      String
  title       String
  description String?
  targetValue Float
  completed   Boolean  @default(false)
  completedAt DateTime?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  goal        Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
  
  @@index([goalId])
  @@map("milestones")
}

// ====================================================================
// Analytics & AI Models
// ====================================================================

model Insight {
  id          String      @id @default(cuid())
  type        InsightType
  category    String
  title       String
  content     String      @db.Text
  data        Json
  score       Float?
  confidence  Float?      // AI confidence score
  impact      Impact      @default(MEDIUM)
  
  // Validity
  validFrom   DateTime
  validTo     DateTime
  isRead      Boolean     @default(false)
  isActionable Boolean   @default(true)
  isDismissed Boolean     @default(false)
  
  // Actions
  suggestedActions Json   @default("[]")
  actionTaken String?
  actionTakenAt DateTime?
  
  // Timestamps
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  // Relations
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([type])
  @@index([validFrom, validTo])
  @@index([isRead])
  @@map("insights")
}

model AISuggestion {
  id          String        @id @default(cuid())
  type        SuggestionType
  context     String        // Where the suggestion appears
  trigger     String        // What triggered the suggestion
  
  // Content
  title       String
  description String?
  suggestion  Json          // Structured suggestion data
  confidence  Float
  priority    Priority      @default(MEDIUM)
  
  // User Interaction
  status      SuggestionStatus @default(PENDING)
  accepted    Boolean?
  feedback    String?
  appliedAt   DateTime?
  dismissedAt DateTime?
  
  // Metadata
  metadata    Json          @default("{}")
  
  // Timestamps
  createdAt   DateTime      @default(now())
  expiresAt   DateTime?
  
  // Relations
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([createdAt])
  @@map("ai_suggestions")
}

// ====================================================================
// System Models
// ====================================================================

model Notification {
  id          String           @id @default(cuid())
  type        NotificationType
  channel     NotificationChannel @default(IN_APP)
  
  // Content
  title       String
  content     String
  data        Json?
  actionUrl   String?
  
  // Status
  isRead      Boolean          @default(false)
  readAt      DateTime?
  isSent      Boolean          @default(false)
  sentAt      DateTime?
  error       String?
  
  // Scheduling
  scheduledFor DateTime?
  
  // Timestamps
  createdAt   DateTime         @default(now())
  expiresAt   DateTime?
  
  // Relations
  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, isRead])
  @@index([type])
  @@index([createdAt])
  @@index([scheduledFor])
  @@map("notifications")
}

model ActivityLog {
  id          String       @id @default(cuid())
  action      String
  entityType  String
  entityId    String
  changes     Json?        // Before/after values
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime     @default(now())
  
  // Relations
  userId      String
  eventId     String?
  taskId      String?
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  event       Event?       @relation(fields: [eventId], references: [id], onDelete: SetNull)
  task        Task?        @relation(fields: [taskId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("activity_logs")
}

model Integration {
  id            String           @id @default(cuid())
  provider      String           // google, outlook, notion, etc.
  type          IntegrationType
  status        IntegrationStatus @default(PENDING)
  
  // Authentication
  accessToken   String?          @db.Text
  refreshToken  String?          @db.Text
  expiresAt     DateTime?
  scope         String?
  
  // Configuration
  config        Json             @default("{}")
  syncSettings  Json             @default("{}")
  lastSyncAt    DateTime?
  lastSyncStatus String?
  lastSyncError String?
  
  // Timestamps
  connectedAt   DateTime?
  disconnectedAt DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  
  // Relations
  userId        String
  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, provider])
  @@index([userId])
  @@index([provider])
  @@index([status])
  @@map("integrations")
}

model Template {
  id          String       @id @default(cuid())
  type        TemplateType
  name        String
  slug        String
  description String?
  
  // Content
  content     Json         // Template structure
  settings    Json         @default("{}")
  variables   Json         @default("[]") // Template variables
  
  // Metadata
  category    String?
  tags        String[]
  isPublic    Boolean      @default(false)
  isPremium   Boolean      @default(false)
  usageCount  Int          @default(0)
  rating      Float?
  
  // Timestamps
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  // Relations
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, slug])
  @@index([userId])
  @@index([type])
  @@index([isPublic])
  @@map("templates")
}

// ====================================================================
// Collaboration Models
// ====================================================================

model Team {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  avatar      String?
  
  // Settings
  settings    Json     @default("{}")
  features    String[] // Enabled features
  
  // Billing
  plan        TeamPlan @default(FREE)
  seats       Int      @default(5)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  members     TeamMember[]
  
  @@index([slug])
  @@map("teams")
}

model TeamMember {
  id          String   @id @default(cuid())
  teamId      String
  userId      String
  role        TeamRole @default(MEMBER)
  permissions Json     @default("[]")
  joinedAt    DateTime @default(now())
  
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([teamId, userId])
  @@index([userId])
  @@index([teamId])
  @@map("team_members")
}

model Comment {
  id          String   @id @default(cuid())
  content     String   @db.Text
  
  // Relations
  userId      String
  eventId     String?
  taskId      String?
  parentId    String?
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event       Event?   @relation("EventComments", fields: [eventId], references: [id], onDelete: Cascade)
  task        Task?    @relation("TaskComments", fields: [taskId], references: [id], onDelete: Cascade)
  parent      Comment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[] @relation("CommentReplies")
  
  // Metadata
  isEdited    Boolean  @default(false)
  editedAt    DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
  @@index([eventId])
  @@index([taskId])
  @@index([parentId])
  @@map("comments")
}

// ====================================================================
// Enums
// ====================================================================

enum ViewMode {
  DAY
  WEEK
  MONTH
  YEAR
  AGENDA
  TIMELINE
}

enum Tier {
  FREE
  STARTER
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  PAUSED
  TRIALING
}

enum Permission {
  VIEW
  COMMENT
  EDIT
  ADMIN
  OWNER
}

enum EventStatus {
  TENTATIVE
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum Visibility {
  PRIVATE
  PUBLIC
  SHARED
  TEAM
}

enum AttendeeStatus {
  PENDING
  ACCEPTED
  DECLINED
  TENTATIVE
  NO_RESPONSE
}

enum AttendeeRole {
  ORGANIZER
  REQUIRED
  OPTIONAL
  CHAIR
  OBSERVER
}

enum Priority {
  URGENT
  HIGH
  MEDIUM
  LOW
  NONE
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  BLOCKED
  IN_REVIEW
  COMPLETED
  CANCELLED
  ARCHIVED
}

enum DependencyType {
  FINISH_TO_START
  START_TO_START
  FINISH_TO_FINISH
  START_TO_FINISH
}

enum SessionType {
  POMODORO
  DEEP_WORK
  BREAK
  MEETING
  PLANNING
  REVIEW
  CUSTOM
}

enum SessionStatus {
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

enum GoalType {
  NUMERIC
  PERCENTAGE
  BINARY
  MILESTONE
  HABIT
}

enum GoalStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  FAILED
  ARCHIVED
}

enum Frequency {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
  CUSTOM
}

enum InsightType {
  PRODUCTIVITY
  TIME_USAGE
  PATTERN
  SUGGESTION
  ACHIEVEMENT
  WARNING
  TIP
}

enum Impact {
  HIGH
  MEDIUM
  LOW
  CRITICAL
}

enum SuggestionType {
  SCHEDULE
  TASK
  FOCUS
  BREAK
  REORGANIZE
  OPTIMIZE
}

enum SuggestionStatus {
  PENDING
  ACCEPTED
  REJECTED
  APPLIED
  EXPIRED
}

enum NotificationType {
  REMINDER
  INVITATION
  UPDATE
  ACHIEVEMENT
  SYSTEM
  ALERT
  DIGEST
}

enum NotificationChannel {
  IN_APP
  EMAIL
  PUSH
  SMS
  WEBHOOK
}

enum IntegrationType {
  CALENDAR
  TASK
  COMMUNICATION
  STORAGE
  ANALYTICS
  AUTOMATION
}

enum IntegrationStatus {
  PENDING
  CONNECTED
  DISCONNECTED
  ERROR
  EXPIRED
}

enum TemplateType {
  EVENT
  TASK
  PROJECT
  WORKFLOW
  ROUTINE
  GOAL
}

enum TeamPlan {
  FREE
  STARTER
  BUSINESS
  ENTERPRISE
}

enum TeamRole {
  OWNER
  ADMIN
  MANAGER
  MEMBER
  GUEST
}
```

---

These two files represent the foundation of our Chronos application:

## **`globals.css` Highlights:**
- **Comprehensive theming system** with CSS custom properties for easy customization
- **Beautiful animations** and transitions for delightful user interactions
- **Utility classes** for common patterns like glass morphism, gradients, and loading states
- **Accessibility-first** with focus states, reduced motion support, and high contrast modes
- **Component-specific styles** for calendar grids, task items, and focus timers
- **Print styles** for professional output

## **`schema.prisma` Highlights:**
- **Comprehensive data model** covering all features from the PRD
- **Optimized indexes** for query performance
- **Flexible JSON fields** for extensibility without schema changes
- **Soft delete support** for data recovery
- **Full audit trail** with activity logs
- **Team collaboration** models for future multi-user features
- **AI/ML integration** models for insights and suggestions
- **Robust relationships** with proper cascade rules

Together, these files provide a rock-solid foundation for building an exceptional productivity application that's both beautiful and functional.
