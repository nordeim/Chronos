# **Configuration Files Implementation**

I'll create each configuration file with meticulous attention to detail, ensuring they work together harmoniously to support our Chronos application's architecture and development workflow.

## **1. `.gitignore`**
```gitignore
# chronos/.gitignore
# Dependencies
node_modules/
.pnp/
.pnp.js
.yarn/install-state.gz

# Testing
coverage/
*.lcov
.nyc_output/

# Next.js
.next/
out/
dist/
build/

# Production
*.pid
*.seed
*.pid.lock

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
.pnpm-debug.log*

# Environment files
.env
.env*.local
.env.development
.env.production
.env.test

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
!.vscode/launch.json
!.vscode/tasks.json
*.code-workspace
.history/

# IDE - IntelliJ/WebStorm
.idea/
*.iml
*.iws
*.ipr
.idea_modules/

# IDE - Sublime Text
*.sublime-project
*.sublime-workspace

# OS Files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
desktop.ini

# Database
*.db
*.sqlite
*.sqlite3
prisma/migrations/dev/

# Logs
logs/
*.log

# Cache
.cache/
.parcel-cache/
.turbo/
.metro-health-check*

# Testing
test-results/
playwright-report/
playwright/.cache/
e2e/screenshots/
e2e/videos/
cypress/videos/
cypress/screenshots/

# Misc
*.swp
*.swo
*~
.tmp/
temp/
tmp/

# PWA files
public/sw.js
public/workbox-*.js
public/worker-*.js
public/sw.js.map
public/workbox-*.js.map
public/worker-*.js.map

# Sentry
.sentryclirc

# Bundle analyzer
.analyze/
stats.html

# Storybook
storybook-static/
build-storybook.log

# Documentation
docs/.vitepress/dist/
docs/.vitepress/cache/

# Local development
*.local
local/
.local-chromium/

# Generated files
generated/
src/generated/

# Uploads (local development)
uploads/
public/uploads/

# Lock files (keep only one)
# Uncomment the ones you don't use:
# package-lock.json
# yarn.lock
```

## **2. `package.json`**
```json
{
  "name": "chronos",
  "version": "1.0.0",
  "description": "Where Time Meets Intelligence - A next-generation productivity application",
  "author": "Chronos Team",
  "license": "MIT",
  "private": true,
  "homepage": "https://chronos.app",
  "repository": {
    "type": "git",
    "url": "https://github.com/nordeim/Chronos.git"
  },
  "bugs": {
    "url": "https://github.com/nordeim/Chronos/issues"
  },
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "next dev --turbo",
    "dev:debug": "NODE_OPTIONS='--inspect' next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "preview": "next build && next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md,mdx,css}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,md,mdx,css}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "pnpm run type-check && pnpm run lint && pnpm run test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "analyze": "ANALYZE=true pnpm build",
    "prepare": "husky install",
    "postinstall": "prisma generate",
    "clean": "rm -rf .next .turbo node_modules coverage dist",
    "check-all": "pnpm run type-check && pnpm run lint && pnpm run format:check && pnpm run test"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.0.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@hookform/resolvers": "^3.9.0",
    "@prisma/client": "^6.0.0",
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.2",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-tooltip": "^1.1.3",
    "@sentry/nextjs": "^8.0.0",
    "@t3-oss/env-nextjs": "^0.11.0",
    "@tanstack/react-query": "^5.60.0",
    "@tiptap/core": "^2.10.0",
    "@tiptap/pm": "^2.10.0",
    "@tiptap/react": "^2.10.0",
    "@tiptap/starter-kit": "^2.10.0",
    "@vercel/analytics": "^1.3.1",
    "@vercel/og": "^0.6.3",
    "@vercel/speed-insights": "^1.0.12",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0",
    "focus-trap-react": "^10.3.0",
    "framer-motion": "^11.11.0",
    "ioredis": "^5.4.1",
    "lucide-react": "^0.454.0",
    "next": "15.0.3",
    "next-auth": "5.0.0-beta.25",
    "next-themes": "^0.4.3",
    "posthog-js": "^1.174.0",
    "pusher": "^5.2.0",
    "pusher-js": "^8.4.0-rc2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.0",
    "react-hot-toast": "^2.4.1",
    "react-intersection-observer": "^9.13.1",
    "react-use": "^17.5.1",
    "recharts": "^2.13.0",
    "resend": "^4.0.0",
    "sharp": "^0.33.5",
    "sonner": "^1.5.0",
    "superjson": "^2.2.1",
    "tailwind-merge": "^2.5.4",
    "usehooks-ts": "^3.1.0",
    "vaul": "^1.1.0",
    "zod": "^3.24.0",
    "zustand": "^5.0.1"
  },
  "devDependencies": {
    "@faker-js/faker": "^9.2.0",
    "@next/bundle-analyzer": "^15.0.3",
    "@playwright/test": "^1.48.0",
    "@tailwindcss/forms": "^0.5.9",
    "@tailwindcss/typography": "^0.5.15",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.2",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.9.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^8.14.0",
    "@typescript-eslint/parser": "^8.14.0",
    "@vitejs/plugin-react": "^4.3.3",
    "@vitest/coverage-v8": "^2.1.0",
    "@vitest/ui": "^2.1.0",
    "autoprefixer": "^10.4.20",
    "dotenv-cli": "^7.4.2",
    "eslint": "^9.14.0",
    "eslint-config-next": "15.0.3",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-tailwindcss": "^3.17.5",
    "husky": "^9.1.6",
    "jsdom": "^25.0.1",
    "lint-staged": "^15.2.10",
    "postcss": "^8.4.49",
    "prettier": "^3.3.3",
    "prettier-plugin-tailwindcss": "^0.6.8",
    "prisma": "^6.0.0",
    "tailwindcss": "^3.4.15",
    "tailwindcss-animate": "^1.0.7",
    "tsx": "^4.19.2",
    "typescript": "^5.7.0",
    "vite-tsconfig-paths": "^5.1.0",
    "vitest": "^2.1.0"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,mdx,css,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

## **3. `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/lib/utils/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/public/*": ["./public/*"]
    },
    "baseUrl": "."
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/*.mjs",
    ".next/types/**/*.ts",
    "src/types/**/*.d.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "dist",
    "build",
    "coverage",
    ".turbo",
    "storybook-static"
  ]
}
```

## **4. `tailwind.config.ts`**
```typescript
// chronos/tailwind.config.ts
import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'
import tailwindcssAnimate from 'tailwindcss-animate'
import tailwindcssForms from '@tailwindcss/forms'
import tailwindcssTypography from '@tailwindcss/typography'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          purple: '#8b5cf6',
          pink: '#ec4899',
          orange: '#f97316',
          teal: '#14b8a6',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        display: ['var(--font-cal-sans)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-out': 'fade-out 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-out',
        'zoom-in': 'zoom-in 0.2s ease-out',
        'zoom-out': 'zoom-out 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-soft': 'bounce-soft 1s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-in': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'zoom-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'zoom-out': {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.95)', opacity: '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'bounce-soft': {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        'glow': {
          from: { boxShadow: '0 0 10px -10px currentColor' },
          to: { boxShadow: '0 0 20px -10px currentColor' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-shine': 'linear-gradient(110deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%)',
        'gradient-mesh': 'url("data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="gray" stroke-width="0.5" opacity="0.1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)" /%3E%3C/svg%3E")',
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 16px -4px rgba(0, 0, 0, 0.1)',
        'hard': '0 8px 32px -8px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px -5px rgba(59, 130, 246, 0.5)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    tailwindcssForms({
      strategy: 'class',
    }),
    tailwindcssTypography,
  ],
}

export default config
```

## **5. `postcss.config.mjs`**
```javascript
// chronos/postcss.config.mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
}

export default config
```

## **6. `.prettierrc.json`**
```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "semi": false,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "proseWrap": "preserve",
  "htmlWhitespaceSensitivity": "css",
  "embeddedLanguageFormatting": "auto",
  "singleAttributePerLine": false,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindConfig": "./tailwind.config.ts",
  "tailwindFunctions": ["clsx", "cn", "cva"],
  "overrides": [
    {
      "files": "*.json",
      "options": {
        "printWidth": 200
      }
    },
    {
      "files": ["*.md", "*.mdx"],
      "options": {
        "proseWrap": "always"
      }
    },
    {
      "files": "*.yml",
      "options": {
        "singleQuote": false
      }
    }
  ]
}
```

## **7. `.eslintrc.json`**
```json
{
  "$schema": "https://json.schemastore.org/eslintrc",
  "extends": [
    "next/core-web-vitals",
    "next/typescript",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:tailwindcss/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "tailwindcss"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json",
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "root": true,
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "settings": {
    "tailwindcss": {
      "callees": ["cn", "cva", "clsx"],
      "config": "./tailwind.config.ts"
    },
    "next": {
      "rootDir": "."
    }
  },
  "rules": {
    "@typescript-eslint/array-type": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        "prefer": "type-imports",
        "fixStyle": "inline-type-imports"
      }
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        "checksVoidReturn": {
          "attributes": false
        }
      }
    ],
    "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-expect-error": "allow-with-description",
        "ts-ignore": false,
        "ts-nocheck": false,
        "ts-check": false
      }
    ],
    "tailwindcss/no-custom-classname": "off",
    "tailwindcss/classnames-order": "warn",
    "import/order": [
      "warn",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling"],
          "index",
          "object",
          "type"
        ],
        "pathGroups": [
          {
            "pattern": "@/**",
            "group": "internal",
            "position": "after"
          }
        ],
        "pathGroupsExcludedImportTypes": ["type"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ],
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error", "info"]
      }
    ],
    "no-debugger": "error",
    "no-alert": "error",
    "prefer-const": "error",
    "prefer-template": "warn",
    "no-var": "error",
    "object-shorthand": "warn",
    "no-nested-ternary": "warn",
    "complexity": ["warn", 10],
    "max-depth": ["warn", 4],
    "max-lines": [
      "warn",
      {
        "max": 500,
        "skipBlankLines": true,
        "skipComments": true
      }
    ]
  },
  "overrides": [
    {
      "files": ["*.js", "*.jsx", "*.mjs", "*.cjs"],
      "extends": ["plugin:@typescript-eslint/disable-type-checked"]
    },
    {
      "files": ["*.test.ts", "*.test.tsx", "*.spec.ts", "*.spec.tsx"],
      "env": {
        "jest": true
      },
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "max-lines": "off"
      }
    }
  ],
  "ignorePatterns": [
    ".next",
    "out",
    "dist",
    "build",
    "coverage",
    "node_modules",
    "*.config.js",
    "*.config.mjs",
    "*.config.ts",
    "public",
    ".turbo",
    "storybook-static"
  ]
}
```

## **8. `eslint.config.mjs`**
```javascript
// chronos/eslint.config.mjs
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import tailwindcss from 'eslint-plugin-tailwindcss'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'public/**',
      '.turbo/**',
      'storybook-static/**',
      'prisma/generated/**',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'tailwindcss': tailwindcss,
      'react': react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'import': importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      tailwindcss: {
        callees: ['cn', 'cva', 'clsx'],
        config: './tailwind.config.ts',
      },
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',

      // React rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-boolean-value': ['warn', 'never'],
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-pascal-case': 'warn',
      'react/no-array-index-key': 'warn',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Tailwind CSS rules
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/no-contradicting-classname': 'error',

      // Import rules
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'warn',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',

      // General rules
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'info'],
        },
      ],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'prefer-template': 'warn',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'no-nested-ternary': 'warn',
      'complexity': ['warn', 15],
      'max-depth': ['warn', 4],
      'max-lines': [
        'warn',
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message: 'Prefer absolute imports using @/ alias',
            },
          ],
        },
      ],
    },
  },
  // Test files configuration
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines': 'off',
      'max-depth': 'off',
      'complexity': 'off',
    },
  },
  // Configuration files
  {
    files: ['*.config.{js,mjs,ts}'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'import/no-default-export': 'off',
    },
  },
  prettier,
]
```

## **9. `next.config.mjs`**
```javascript
// chronos/next.config.mjs
import { createRequire } from 'module'
import bundleAnalyzer from '@next/bundle-analyzer'

const require = createRequire(import.meta.url)

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React configuration
  reactStrictMode: true,
  
  // Experimental features for Next.js 15
  experimental: {
    reactCompiler: true,
    ppr: true, // Partial Pre-Rendering
    taint: true,
    typedRoutes: true,
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB', 'INP'],
    optimizePackageImports: [
      '@radix-ui/react-*',
      'lucide-react',
      'date-fns',
      'framer-motion',
      '@tanstack/react-query',
      'recharts',
    ],
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'chronos.app', '*.chronos.app'],
    },
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn', 'info'] }
      : false,
  },

  // Styling
  sassOptions: {
    includePaths: ['./src/styles'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self' 'unsafe-eval' 'unsafe-inline' * data: blob:;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.pusher.com wss://*.pusher.com https://*.vercel.app https://vercel.live https://*.supabase.co https://*.sentry.io; frame-src 'self' https:;",
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, immutable, max-age=31536000',
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/calendar',
        permanent: false,
      },
      {
        source: '/signin',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/signup',
        permanent: true,
      },
    ]
  },

  // Rewrites for API proxying
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    }
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'chronos-assets.s3.amazonaws.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Internationalization (future feature)
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
    defaultLocale: 'en',
    localeDetection: true,
  },

  // Output configuration
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  
  // Build configuration
  productionBrowserSourceMaps: false,
  swcMinify: true,
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@radix-ui': {
      transform: '@radix-ui/react-{{member}}',
    },
  },

  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimization for production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 &&
                /node_modules[/\\]/.test(module.identifier())
            },
            name(module) {
              const hash = require('crypto')
                .createHash('sha1')
                .update(module.identifier())
                .digest('hex')
              return `lib-${hash.substring(0, 8)}`
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              const hash = require('crypto')
                .createHash('sha1')
                .update(chunks.map(c => c.name).join('_'))
                .digest('hex')
              return `shared-${hash.substring(0, 8)}`
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
        maxAsyncRequests: 30,
        maxInitialRequests: 25,
        enforceSizeThreshold: 50000,
      }
    }

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    // Aliases (backup for TypeScript paths)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    }

    return config
  },

  // Environment variables to expose to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV,
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Telemetry
  telemetry: false,
}

export default withBundleAnalyzer(nextConfig)
```

---

These configuration files represent a production-ready setup that:

1. **Enforces code quality** through ESLint and Prettier
2. **Optimizes performance** with Next.js 15's latest features
3. **Ensures type safety** with strict TypeScript configuration
4. **Provides beautiful styling** with an extensive Tailwind configuration
5. **Maintains security** with proper headers and CSP policies
6. **Supports scalability** with proper code splitting and optimization
7. **Enhances developer experience** with helpful scripts and tooling

Each file has been carefully crafted to work together as a cohesive system, providing the foundation for building the exceptional Chronos application we've envisioned.
