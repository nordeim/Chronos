// chronos/src/lib/auth/auth.config.ts
import type { NextAuthConfig, DefaultSession, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db/prisma'
import { 
  sendVerificationEmail, 
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendSecurityAlert,
} from '@/lib/email/sender'
import { analyticsService } from '@/services/analytics.service'
import { generateUsername } from '@/lib/utils/username'
import { rateLimit } from '@/lib/api/rate-limit'
import { z } from 'zod'

// ===================================================================
// Type Declarations
// ===================================================================

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      username: string | null
      email: string
      emailVerified: Date | null
      name: string | null
      avatar: string | null
      bio: string | null
      timezone: string
      locale: string
      subscriptionTier: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
      subscriptionStatus: string
      onboardingCompleted: boolean
      preferences: Record<string, any>
      role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
      createdAt: Date
      lastActiveAt: Date
    } & DefaultSession['user']
    expires: string
    accessToken?: string
    error?: string
  }

  interface User {
    id: string
    username: string | null
    email: string
    emailVerified: Date | null
    name: string | null
    avatar: string | null
    bio: string | null
    timezone: string
    locale: string
    subscriptionTier: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
    subscriptionStatus: string
    onboardingCompleted: boolean
    preferences: Record<string, any>
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    createdAt: Date
    lastActiveAt: Date
    stripeCustomerId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string | null
    email: string
    emailVerified: Date | null
    name: string | null
    avatar: string | null
    subscriptionTier: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
    subscriptionStatus: string
    onboardingCompleted: boolean
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: string
  }
}

// ===================================================================
// Environment Validation
// ===================================================================

const envSchema = z.object({
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string(),
  EMAIL_FROM: z.string().email(),
  RESEND_API_KEY: z.string(),
})

// Validate environment variables at startup
try {
  envSchema.parse(process.env)
} catch (error) {
  console.error('❌ Invalid environment variables for auth:', error)
  throw new Error('Invalid environment variables for auth configuration')
}

// ===================================================================
// Configuration Constants
// ===================================================================

export const AUTH_CONSTANTS = {
  SESSION_MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds
  SESSION_UPDATE_AGE: 24 * 60 * 60, // Update session every 24 hours
  JWT_MAX_AGE: 30 * 24 * 60 * 60, // 30 days
  VERIFICATION_TOKEN_EXPIRES: 24 * 60 * 60 * 1000, // 24 hours in ms
  PASSWORD_RESET_EXPIRES: 60 * 60 * 1000, // 1 hour in ms
  MAGIC_LINK_EXPIRES: 10 * 60 * 1000, // 10 minutes in ms
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPTS_WINDOW: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  OTP_LENGTH: 6,
  OTP_EXPIRES: 5 * 60 * 1000, // 5 minutes
  ALLOWED_EMAIL_DOMAINS: process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [],
  BLOCKED_EMAIL_DOMAINS: ['tempmail.com', 'throwaway.email', 'guerrillamail.com'],
  IP_RATE_LIMIT: 10, // requests per minute
  USER_RATE_LIMIT: 5, // requests per minute
} as const

// ===================================================================
// Validation Schemas
// ===================================================================

export const authSchemas = {
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, 'Password must be at least 8 characters')
    .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  username: z
    .string()
    .min(AUTH_CONSTANTS.USERNAME_MIN_LENGTH)
    .max(AUTH_CONSTANTS.USERNAME_MAX_LENGTH)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens')
    .toLowerCase()
    .trim(),
  name: z.string().min(1).max(100).trim(),
  otp: z.string().length(AUTH_CONSTANTS.OTP_LENGTH).regex(/^\d+$/, 'OTP must be numeric'),
}

// ===================================================================
// Security Headers
// ===================================================================

export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
} as const

// ===================================================================
// Main Configuration
// ===================================================================

export const authConfig: NextAuthConfig = {
  // Core Configuration
  adapter: PrismaAdapter(prisma),
  
  // Session Configuration
  session: {
    strategy: 'jwt',
    maxAge: AUTH_CONSTANTS.SESSION_MAX_AGE,
    updateAge: AUTH_CONSTANTS.SESSION_UPDATE_AGE,
  },

  // JWT Configuration
  jwt: {
    maxAge: AUTH_CONSTANTS.JWT_MAX_AGE,
  },

  // Page Routes
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding',
  },

  // Security
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === 'production',

  // Callbacks
  callbacks: {
    // ===========================
    // Sign In Callback
    // ===========================
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // Rate limiting
        const identifier = user.email || user.id
        const rateLimitResult = await rateLimit(identifier, AUTH_CONSTANTS.USER_RATE_LIMIT)
        
        if (!rateLimitResult.success) {
          throw new Error('Too many login attempts. Please try again later.')
        }

        // Check if email is blocked
        if (user.email) {
          const domain = user.email.split('@')[1]
          if (AUTH_CONSTANTS.BLOCKED_EMAIL_DOMAINS.includes(domain)) {
            throw new Error('Email domain is not allowed')
          }

          // Check allowed domains (for enterprise)
          if (AUTH_CONSTANTS.ALLOWED_EMAIL_DOMAINS.length > 0) {
            if (!AUTH_CONSTANTS.ALLOWED_EMAIL_DOMAINS.includes(domain)) {
              throw new Error('Email domain is not authorized for this application')
            }
          }
        }

        // OAuth Sign In
        if (account?.provider && account.provider !== 'credentials') {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true },
          })

          if (existingUser) {
            // Check if this OAuth account is already linked
            const linkedAccount = existingUser.accounts.find(
              (acc) => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
            )

            if (!linkedAccount) {
              // Link the new OAuth account to existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              })
            }

            // Update last active
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastActiveAt: new Date() },
            })
          } else {
            // Create new user with OAuth account
            const username = await generateUsername(user.name || user.email?.split('@')[0] || 'user')
            
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                username,
                avatar: user.image,
                emailVerified: new Date(),
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    refresh_token: account.refresh_token,
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state,
                  },
                },
              },
            })

            // Send welcome email
            if (user.email) {
              await sendWelcomeEmail(user.email, user.name || 'there')
            }
          }

          // Track login event
          await analyticsService.track({
            event: 'user_login',
            userId: existingUser?.id || user.id,
            properties: {
              provider: account.provider,
              method: 'oauth',
            },
          })

          return true
        }

        // Credentials Sign In
        if (account?.provider === 'credentials') {
          // Additional security checks for credentials login
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          if (!dbUser) {
            throw new Error('Invalid credentials')
          }

          if (!dbUser.emailVerified) {
            // Send verification email
            await sendVerificationEmail(dbUser.email, dbUser.name || 'there')
            throw new Error('Please verify your email before signing in')
          }

          // Update last active
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastActiveAt: new Date() },
          })

          // Track login event
          await analyticsService.track({
            event: 'user_login',
            userId: dbUser.id,
            properties: {
              method: 'credentials',
            },
          })

          return true
        }

        // Email Magic Link Sign In
        if (account?.provider === 'email') {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          if (dbUser) {
            // Update email verified status
            if (!dbUser.emailVerified) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { 
                  emailVerified: new Date(),
                  lastActiveAt: new Date(),
                },
              })
            } else {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { lastActiveAt: new Date() },
              })
            }
          }

          return true
        }

        return true
      } catch (error) {
        console.error('Sign in error:', error)
        throw error
      }
    },

    // ===========================
    // JWT Callback
    // ===========================
    async jwt({ token, user, account, profile, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.emailVerified = user.emailVerified
        token.name = user.name
        token.avatar = user.avatar
        token.username = user.username
        token.subscriptionTier = user.subscriptionTier
        token.subscriptionStatus = user.subscriptionStatus
        token.onboardingCompleted = user.onboardingCompleted
        token.role = user.role || 'USER'

        // Store OAuth tokens
        if (account) {
          token.accessToken = account.access_token
          token.refreshToken = account.refresh_token
          token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined
        }
      }

      // Update session
      if (trigger === 'update' && session) {
        // Allow certain fields to be updated from the client
        if (session.name !== undefined) token.name = session.name
        if (session.avatar !== undefined) token.avatar = session.avatar
        if (session.username !== undefined) token.username = session.username
        if (session.onboardingCompleted !== undefined) {
          token.onboardingCompleted = session.onboardingCompleted
        }
      }

      // Refresh access token if needed (for OAuth providers)
      if (token.accessTokenExpires && Date.now() > token.accessTokenExpires) {
        try {
          // Implementation depends on the OAuth provider
          // This is a placeholder for token refresh logic
          const refreshedTokens = await refreshAccessToken(token)
          return { ...token, ...refreshedTokens }
        } catch (error) {
          console.error('Failed to refresh access token:', error)
          return { ...token, error: 'RefreshAccessTokenError' }
        }
      }

      // Periodic user data refresh (every 24 hours)
      const lastRefresh = token.lastRefresh as number | undefined
      const shouldRefresh = !lastRefresh || Date.now() - lastRefresh > 24 * 60 * 60 * 1000

      if (shouldRefresh && token.id) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              id: true,
              email: true,
              emailVerified: true,
              name: true,
              username: true,
              avatar: true,
              subscriptionTier: true,
              subscriptionStatus: true,
              onboardingCompleted: true,
              preferences: true,
            },
          })

          if (freshUser) {
            token = {
              ...token,
              ...freshUser,
              lastRefresh: Date.now(),
            }
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error)
        }
      }

      return token
    },

    // ===========================
    // Session Callback
    // ===========================
    async session({ session, token, user }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          email: token.email,
          emailVerified: token.emailVerified,
          name: token.name,
          avatar: token.avatar,
          username: token.username,
          subscriptionTier: token.subscriptionTier,
          subscriptionStatus: token.subscriptionStatus,
          onboardingCompleted: token.onboardingCompleted,
          role: token.role,
          bio: null,
          timezone: 'UTC',
          locale: 'en',
          preferences: {},
          createdAt: new Date(),
          lastActiveAt: new Date(),
        }

        if (token.error) {
          session.error = token.error as string
        }

        if (token.accessToken) {
          session.accessToken = token.accessToken as string
        }
      }

      return session
    },

    // ===========================
    // Redirect Callback
    // ===========================
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      
      // Redirect to dashboard after sign in
      if (url === baseUrl) return `${baseUrl}/calendar`
      
      return baseUrl
    },
  },

  // Events
  events: {
    async signIn({ user, account, profile }) {
      console.log(`✅ User signed in: ${user.email}`)
      
      // Send security alert for new device/location
      if (user.email && account?.provider !== 'credentials') {
        // Implement device/location tracking
        const isNewDevice = true // Placeholder - implement actual device detection
        
        if (isNewDevice) {
          await sendSecurityAlert(user.email, {
            type: 'new_device_login',
            provider: account?.provider || 'unknown',
            timestamp: new Date(),
          })
        }
      }
    },

    async signOut({ session, token }) {
      console.log(`👋 User signed out: ${token?.email}`)
      
      // Clean up any active sessions or temporary data
      if (token?.id) {
        await prisma.user.update({
          where: { id: token.id },
          data: { lastActiveAt: new Date() },
        })
      }
    },

    async createUser({ user }) {
      console.log(`🎉 New user created: ${user.email}`)
      
      // Initialize user preferences and settings
      await prisma.user.update({
        where: { id: user.id },
        data: {
          preferences: {
            theme: 'system',
            notifications: {
              email: true,
              push: true,
              desktop: true,
            },
            privacy: {
              profileVisible: true,
              calendarVisible: false,
            },
          },
        },
      })

      // Create default calendar
      await prisma.calendar.create({
        data: {
          name: 'Personal',
          isDefault: true,
          userId: user.id,
          color: '#3B82F6',
        },
      })

      // Create default categories
      const defaultCategories = [
        { name: 'Work', slug: 'work', color: '#3B82F6' },
        { name: 'Personal', slug: 'personal', color: '#10B981' },
        { name: 'Health', slug: 'health', color: '#F59E0B' },
        { name: 'Learning', slug: 'learning', color: '#8B5CF6' },
      ]

      await prisma.category.createMany({
        data: defaultCategories.map((cat) => ({
          ...cat,
          userId: user.id,
        })),
      })
    },

    async updateUser({ user }) {
      console.log(`📝 User updated: ${user.email}`)
    },

    async linkAccount({ user, account, profile }) {
      console.log(`🔗 Account linked: ${account.provider} for ${user.email}`)
    },

    async session({ session, token }) {
      // Update last active timestamp periodically
      if (token?.id) {
        const lastUpdate = (token as any).lastActiveUpdate as number | undefined
        const shouldUpdate = !lastUpdate || Date.now() - lastUpdate > 5 * 60 * 1000 // Every 5 minutes

        if (shouldUpdate) {
          await prisma.user.update({
            where: { id: token.id },
            data: { lastActiveAt: new Date() },
          }).catch(console.error)
        }
      }
    },
  },
}

// ===================================================================
// Helper Functions
// ===================================================================

async function refreshAccessToken(token: JWT) {
  // This is a placeholder function
  // Implement actual token refresh logic based on your OAuth providers
  try {
    // Example for Google OAuth
    if (token.refreshToken) {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
        }),
      })

      const refreshedTokens = await response.json()

      if (!response.ok) {
        throw refreshedTokens
      }

      return {
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
        refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      }
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return {
      error: 'RefreshAccessTokenError',
    }
  }
}

export default authConfig
