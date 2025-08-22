// chronos/src/lib/auth/providers.ts
import type { Provider } from 'next-auth/providers'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Discord from 'next-auth/providers/discord'
import Email from 'next-auth/providers/email'
import Credentials from 'next-auth/providers/credentials'
import Apple from 'next-auth/providers/apple'
import Microsoft from 'next-auth/providers/microsoft-entra-id'
import Slack from 'next-auth/providers/slack'
import Notion from 'next-auth/providers/notion'
import LinkedIn from 'next-auth/providers/linkedin'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { sendVerificationEmail, sendMagicLinkEmail } from '@/lib/email/sender'
import { authSchemas, AUTH_CONSTANTS } from './auth.config'
import { rateLimit } from '@/lib/api/rate-limit'
import { generateOTP, verifyOTP } from '@/lib/utils/otp'

// ===================================================================
// Provider Configuration
// ===================================================================

export const providers: Provider[] = [
  // ===========================
  // Google OAuth Provider
  // ===========================
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
        scope: [
          'openid',
          'email',
          'profile',
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/calendar.events',
        ].join(' '),
      },
    },
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        emailVerified: profile.email_verified ? new Date() : null,
      }
    },
  }),

  // ===========================
  // GitHub OAuth Provider
  // ===========================
  GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: 'read:user user:email',
      },
    },
    profile(profile) {
      return {
        id: profile.id.toString(),
        name: profile.name || profile.login,
        email: profile.email,
        image: profile.avatar_url,
        username: profile.login,
        bio: profile.bio,
      }
    },
  }),

  // ===========================
  // Discord OAuth Provider
  // ===========================
  Discord({
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: 'identify email guilds',
      },
    },
    profile(profile) {
      const image = profile.avatar
        ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${
            profile.avatar.startsWith('a_') ? 'gif' : 'png'
          }`
        : null

      return {
        id: profile.id,
        name: profile.global_name || profile.username,
        email: profile.email,
        image,
        username: profile.username,
        emailVerified: profile.verified ? new Date() : null,
      }
    },
  }),

  // ===========================
  // Apple OAuth Provider
  // ===========================
  ...(process.env.APPLE_ID && process.env.APPLE_SECRET
    ? [
        Apple({
          clientId: process.env.APPLE_ID,
          clientSecret: process.env.APPLE_SECRET,
          authorization: {
            params: {
              scope: 'name email',
              response_mode: 'form_post',
            },
          },
          profile(profile) {
            return {
              id: profile.sub,
              name: profile.name
                ? `${profile.name.firstName} ${profile.name.lastName}`
                : profile.email?.split('@')[0],
              email: profile.email,
              image: null,
            }
          },
        }),
      ]
    : []),

  // ===========================
  // Microsoft OAuth Provider
  // ===========================
  ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
    ? [
        Microsoft({
          clientId: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
          authorization: {
            params: {
              scope: 'openid profile email offline_access Calendars.ReadWrite',
            },
          },
          profile(profile) {
            return {
              id: profile.sub,
              name: profile.name,
              email: profile.email || profile.preferred_username,
              image: null,
            }
          },
        }),
      ]
    : []),

  // ===========================
  // Slack OAuth Provider
  // ===========================
  ...(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET
    ? [
        Slack({
          clientId: process.env.SLACK_CLIENT_ID,
          clientSecret: process.env.SLACK_CLIENT_SECRET,
          authorization: {
            params: {
              scope: 'identity.basic identity.email identity.avatar',
            },
          },
        }),
      ]
    : []),

  // ===========================
  // Notion OAuth Provider
  // ===========================
  ...(process.env.NOTION_CLIENT_ID && process.env.NOTION_CLIENT_SECRET
    ? [
        Notion({
          clientId: process.env.NOTION_CLIENT_ID,
          clientSecret: process.env.NOTION_CLIENT_SECRET,
          redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/notion`,
        }),
      ]
    : []),

  // ===========================
  // LinkedIn OAuth Provider
  // ===========================
  ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
    ? [
        LinkedIn({
          clientId: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          authorization: {
            params: {
              scope: 'openid profile email',
            },
          },
          issuer: 'https://www.linkedin.com',
          jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
          profile(profile) {
            return {
              id: profile.sub,
              name: profile.name,
              email: profile.email,
              image: profile.picture,
            }
          },
        }),
      ]
    : []),

  // ===========================
  // Email Magic Link Provider
  // ===========================
  Email({
    server: {
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT || 587),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM || 'noreply@chronos.app',
    maxAge: AUTH_CONSTANTS.MAGIC_LINK_EXPIRES / 1000, // Convert to seconds
    async sendVerificationRequest({ identifier: email, url, provider, theme }) {
      try {
        // Rate limiting
        const rateLimitResult = await rateLimit(email, 3) // Max 3 emails per hour
        if (!rateLimitResult.success) {
          throw new Error('Too many verification emails requested')
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { email },
          select: { name: true, emailVerified: true },
        })

        const isNewUser = !user
        const name = user?.name || 'there'

        // Send magic link email
        await sendMagicLinkEmail({
          to: email,
          name,
          url,
          isNewUser,
          host: new URL(url).host,
        })
      } catch (error) {
        console.error('Failed to send verification email:', error)
        throw new Error('Failed to send verification email')
      }
    },
  }),

  // ===========================
  // Credentials Provider
  // ===========================
  Credentials({
    id: 'credentials',
    name: 'Email & Password',
    credentials: {
      email: {
        label: 'Email',
        type: 'email',
        placeholder: 'you@example.com',
      },
      password: {
        label: 'Password',
        type: 'password',
        placeholder: '••••••••',
      },
      otp: {
        label: 'One-Time Password',
        type: 'text',
        placeholder: '123456',
        optional: true,
      },
      rememberMe: {
        label: 'Remember me',
        type: 'checkbox',
        optional: true,
      },
    },
    async authorize(credentials, req) {
      try {
        // Validate credentials
        const schema = z.object({
          email: authSchemas.email,
          password: z.string().min(1, 'Password is required'),
          otp: z.string().optional(),
        })

        const { email, password, otp } = schema.parse(credentials)

        // Rate limiting
        const rateLimitResult = await rateLimit(email, AUTH_CONSTANTS.USER_RATE_LIMIT)
        if (!rateLimitResult.success) {
          throw new Error('Too many login attempts. Please try again later.')
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
            timezone: true,
            locale: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            onboardingCompleted: true,
            preferences: true,
            createdAt: true,
            lastActiveAt: true,
            deletedAt: true,
          },
        })

        if (!user) {
          // Don't reveal if user exists
          throw new Error('Invalid email or password')
        }

        if (user.deletedAt) {
          throw new Error('This account has been deleted')
        }

        // Verify password (implement your password verification)
        // This is a placeholder - you need to implement actual password storage
        const passwordHash = await prisma.userPassword.findUnique({
          where: { userId: user.id },
          select: { hash: true },
        })

        if (!passwordHash) {
          throw new Error('Invalid email or password')
        }

        const isValidPassword = await bcrypt.compare(password, passwordHash.hash)
        if (!isValidPassword) {
          // Track failed login attempt
          await prisma.loginAttempt.create({
            data: {
              userId: user.id,
              email: user.email,
              success: false,
              ipAddress: req.headers?.['x-forwarded-for'] as string || 'unknown',
              userAgent: req.headers?.['user-agent'] as string || 'unknown',
            },
          })

          throw new Error('Invalid email or password')
        }

        // Check 2FA if enabled
        const twoFactorEnabled = user.preferences?.security?.twoFactorEnabled
        if (twoFactorEnabled && !otp) {
          // Generate and send OTP
          const generatedOTP = generateOTP()
          await storeOTP(user.id, generatedOTP)
          await sendOTPEmail(user.email, generatedOTP)
          
          throw new Error('OTP_REQUIRED')
        }

        if (twoFactorEnabled && otp) {
          const isValidOTP = await verifyOTP(user.id, otp)
          if (!isValidOTP) {
            throw new Error('Invalid OTP')
          }
        }

        // Track successful login
        await prisma.loginAttempt.create({
          data: {
            userId: user.id,
            email: user.email,
            success: true,
            ipAddress: req.headers?.['x-forwarded-for'] as string || 'unknown',
            userAgent: req.headers?.['user-agent'] as string || 'unknown',
          },
        })

        // Update last active
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          timezone: user.timezone,
          locale: user.locale,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          onboardingCompleted: user.onboardingCompleted,
          preferences: user.preferences as Record<string, any>,
          createdAt: user.createdAt,
          lastActiveAt: user.lastActiveAt,
        }
      } catch (error) {
        console.error('Credentials auth error:', error)
        
        // Return specific error messages for the client
        if (error instanceof Error) {
          if (error.message === 'OTP_REQUIRED') {
            throw new Error('OTP_REQUIRED')
          }
          throw error
        }
        
        throw new Error('Authentication failed')
      }
    },
  }),
]

// ===================================================================
// Helper Functions
// ===================================================================

/**
 * Store OTP for user
 */
async function storeOTP(userId: string, otp: string) {
  const expires = new Date(Date.now() + AUTH_CONSTANTS.OTP_EXPIRES)
  
  // Store in database or cache
  await prisma.verificationToken.create({
    data: {
      identifier: userId,
      token: otp,
      expires,
    },
  })
}

/**
 * Send OTP via email
 */
async function sendOTPEmail(email: string, otp: string) {
  // Implement OTP email sending
  console.log(`Sending OTP ${otp} to ${email}`)
}

// ===================================================================
// Export Providers
// ===================================================================

export default providers
