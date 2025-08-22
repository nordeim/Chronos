// chronos/src/lib/auth/auth.ts
import NextAuth from 'next-auth'
import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import authConfig from './auth.config'
import { providers } from './providers'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { AUTH_CONSTANTS } from './auth.config'

// ===================================================================
// Initialize NextAuth
// ===================================================================

const { 
  handlers, 
  auth: baseAuth, 
  signIn: baseSignIn, 
  signOut: baseSignOut,
  unstable_update: update,
} = NextAuth({
  ...authConfig,
  providers,
})

// ===================================================================
// Cached Auth Function
// ===================================================================

export const auth = cache(baseAuth)

// ===================================================================
// Export NextAuth Functions
// ===================================================================

export { handlers, update }

// ===================================================================
// Custom Sign In Function
// ===================================================================

export async function signIn(
  provider: string,
  options?: {
    redirectTo?: string
    redirect?: boolean
    email?: string
    password?: string
    rememberMe?: boolean
  }
) {
  try {
    // Set remember me cookie if requested
    if (options?.rememberMe) {
      cookies().set('remember-me', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })
    }

    const result = await baseSignIn(provider, {
      ...options,
      redirect: false,
    })

    if (options?.redirect !== false && options?.redirectTo) {
      redirect(options.redirectTo)
    }

    return result
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

// ===================================================================
// Custom Sign Out Function
// ===================================================================

export async function signOut(options?: { redirectTo?: string; redirect?: boolean }) {
  try {
    // Clear remember me cookie
    cookies().delete('remember-me')
    
    // Clear any other custom cookies
    cookies().delete('chronos-session')
    
    await baseSignOut({
      ...options,
      redirect: options?.redirect !== false,
    })

    if (options?.redirect !== false && options?.redirectTo) {
      redirect(options.redirectTo)
    }
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

// ===================================================================
// Session Management Functions
// ===================================================================

/**
 * Get the current user session
 */
export async function getSession() {
  const session = await auth()
  return session
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session?.user
}

/**
 * Require authentication or redirect
 */
export async function requireAuth(redirectTo: string = '/login') {
  const session = await getSession()
  
  if (!session?.user) {
    redirect(redirectTo)
  }
  
  return session
}

/**
 * Require specific role or redirect
 */
export async function requireRole(
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN',
  redirectTo: string = '/unauthorized'
) {
  const session = await requireAuth()
  
  const roleHierarchy = {
    USER: 0,
    ADMIN: 1,
    SUPER_ADMIN: 2,
  }
  
  const userRole = session.user.role || 'USER'
  
  if (roleHierarchy[userRole] < roleHierarchy[role]) {
    redirect(redirectTo)
  }
  
  return session
}

/**
 * Require onboarding completion
 */
export async function requireOnboarding(redirectTo: string = '/onboarding') {
  const session = await requireAuth()
  
  if (!session.user.onboardingCompleted) {
    redirect(redirectTo)
  }
  
  return session
}

/**
 * Require email verification
 */
export async function requireEmailVerification(redirectTo: string = '/auth/verify-email') {
  const session = await requireAuth()
  
  if (!session.user.emailVerified) {
    redirect(redirectTo)
  }
  
  return session
}

// ===================================================================
// User Management Functions
// ===================================================================

/**
 * Create a new user account
 */
export async function createUser(data: {
  email: string
  password: string
  name?: string
  username?: string
}) {
  try {
    // Validate input
    const schema = z.object({
      email: z.string().email().toLowerCase(),
      password: z.string().min(8).max(128),
      name: z.string().optional(),
      username: z.string().min(3).max(30).optional(),
    })
    
    const validated = schema.parse(data)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })
    
    if (existingUser) {
      throw new Error('User already exists with this email')
    }
    
    // Check username availability
    if (validated.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: validated.username },
      })
      
      if (existingUsername) {
        throw new Error('Username is already taken')
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 12)
    
    // Generate username if not provided
    const username = validated.username || `user_${nanoid(8)}`
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        username,
        // Store password in a separate secure table or service
        // This is a simplified example
      },
    })
    
    // Create verification token
    const verificationToken = nanoid(32)
    const expires = new Date(Date.now() + AUTH_CONSTANTS.VERIFICATION_TOKEN_EXPIRES)
    
    // Store verification token (implement your token storage)
    // await storeVerificationToken(user.email, verificationToken, expires)
    
    // Send verification email
    // await sendVerificationEmail(user.email, verificationToken)
    
    return user
  } catch (error) {
    console.error('Create user error:', error)
    throw error
  }
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string
    username?: string
    bio?: string
    avatar?: string
    timezone?: string
    locale?: string
    preferences?: Record<string, any>
  }
) {
  try {
    // Validate username if provided
    if (data.username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: userId },
        },
      })
      
      if (existingUsername) {
        throw new Error('Username is already taken')
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })
    
    // Update session
    await update({
      user: {
        name: updatedUser.name,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
      },
    })
    
    return updatedUser
  } catch (error) {
    console.error('Update user error:', error)
    throw error
  }
}

/**
 * Delete user account
 */
export async function deleteUser(userId: string) {
  try {
    // Soft delete to preserve data integrity
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `deleted_${nanoid(8)}@deleted.chronos`,
        username: `deleted_${nanoid(8)}`,
      },
    })
    
    // Sign out the user
    await signOut({ redirect: false })
    
    return deletedUser
  } catch (error) {
    console.error('Delete user error:', error)
    throw error
  }
}

// ===================================================================
// Security Functions
// ===================================================================

/**
 * Verify CSRF token
 */
export async function verifyCSRFToken(token: string) {
  // Implement CSRF verification logic
  const sessionToken = cookies().get('next-auth.csrf-token')?.value
  
  if (!sessionToken || !token) {
    return false
  }
  
  const [tokenValue] = sessionToken.split('|')
  return token === tokenValue
}

/**
 * Check if request is from a trusted origin
 */
export async function isTrustedOrigin() {
  const headersList = headers()
  const origin = headersList.get('origin')
  const host = headersList.get('host')
  
  if (!origin || !host) {
    return false
  }
  
  const trustedOrigins = [
    process.env.NEXTAUTH_URL,
    'http://localhost:3000',
    'https://chronos.app',
    'https://www.chronos.app',
  ].filter(Boolean)
  
  return trustedOrigins.includes(origin)
}

/**
 * Generate secure token
 */
export function generateSecureToken(length: number = 32) {
  return nanoid(length)
}

/**
 * Hash password
 */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword)
}

// ===================================================================
// OAuth Account Management
// ===================================================================

/**
 * Link OAuth account to existing user
 */
export async function linkOAuthAccount(
  userId: string,
  account: {
    provider: string
    providerAccountId: string
    access_token?: string
    refresh_token?: string
    expires_at?: number
  }
) {
  try {
    const linkedAccount = await prisma.account.create({
      data: {
        userId,
        type: 'oauth',
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
      },
    })
    
    return linkedAccount
  } catch (error) {
    console.error('Link OAuth account error:', error)
    throw error
  }
}

/**
 * Unlink OAuth account from user
 */
export async function unlinkOAuthAccount(userId: string, provider: string) {
  try {
    // Check if user has other auth methods
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    })
    
    if (!user) {
      throw new Error('User not found')
    }
    
    if (user.accounts.length <= 1) {
      throw new Error('Cannot unlink the only authentication method')
    }
    
    await prisma.account.deleteMany({
      where: {
        userId,
        provider,
      },
    })
    
    return true
  } catch (error) {
    console.error('Unlink OAuth account error:', error)
    throw error
  }
}

// ===================================================================
// Session Validation
// ===================================================================

/**
 * Validate and refresh session if needed
 */
export async function validateSession() {
  try {
    const session = await getSession()
    
    if (!session) {
      return null
    }
    
    // Check if session is expired
    const sessionExpiry = new Date(session.expires)
    if (sessionExpiry < new Date()) {
      await signOut({ redirect: false })
      return null
    }
    
    // Refresh user data if needed
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        deletedAt: true,
      },
    })
    
    if (!user || user.deletedAt) {
      await signOut({ redirect: false })
      return null
    }
    
    // Update session if user data changed
    if (
      user.name !== session.user.name ||
      user.username !== session.user.username ||
      user.avatar !== session.user.avatar
    ) {
      await update({
        user: {
          name: user.name,
          username: user.username,
          avatar: user.avatar,
        },
      })
    }
    
    return session
  } catch (error) {
    console.error('Validate session error:', error)
    return null
  }
}

// ===================================================================
// Export Auth Instance
// ===================================================================

export default {
  handlers,
  auth,
  signIn,
  signOut,
  getSession,
  getCurrentUser,
  isAuthenticated,
  requireAuth,
  requireRole,
  requireOnboarding,
  requireEmailVerification,
  createUser,
  updateUser,
  deleteUser,
  validateSession,
  linkOAuthAccount,
  unlinkOAuthAccount,
  verifyCSRFToken,
  isTrustedOrigin,
  generateSecureToken,
  hashPassword,
  verifyPassword,
}
