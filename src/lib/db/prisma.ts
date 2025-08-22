// chronos/src/lib/db/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { withOptimize } from '@prisma/extension-optimize'
import { readReplicas } from '@prisma/extension-read-replicas'
import chalk from 'chalk'
import { performance } from 'perf_hooks'
import { cache } from 'react'
import { logger } from '@/lib/utils/logger'
import { env } from '@/lib/env'

// ===================================================================
// Type Declarations
// ===================================================================

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var prismaQueryCount: number
  // eslint-disable-next-line no-var
  var prismaQueryTime: number
}

type LogLevel = 'info' | 'query' | 'warn' | 'error'

interface QueryEvent {
  timestamp: Date
  query: string
  params: string
  duration: number
  target: string
}

interface PrismaMetrics {
  totalQueries: number
  totalTime: number
  averageTime: number
  slowQueries: QueryEvent[]
  errors: number
}

// ===================================================================
// Configuration
// ===================================================================

const DATABASE_CONFIG = {
  // Connection pool settings
  connection: {
    connection_limit: parseInt(env.DATABASE_CONNECTION_LIMIT || '10'),
    pool_timeout: parseInt(env.DATABASE_POOL_TIMEOUT || '10'),
    statement_timeout: parseInt(env.DATABASE_STATEMENT_TIMEOUT || '10000'),
    idle_in_transaction_session_timeout: parseInt(env.DATABASE_IDLE_TIMEOUT || '10000'),
  },
  
  // Query performance
  slowQueryThreshold: parseInt(env.SLOW_QUERY_THRESHOLD || '1000'), // ms
  maxSlowQueries: 100,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // ms
  
  // Cache settings
  cacheTime: 60, // seconds
  
  // Logging
  logLevel: (env.DATABASE_LOG_LEVEL || 'error') as LogLevel,
  coloredLogs: env.NODE_ENV === 'development',
} as const

// ===================================================================
// Prisma Client Factory
// ===================================================================

class PrismaClientSingleton {
  private static instance: PrismaClient | null = null
  private static metrics: PrismaMetrics = {
    totalQueries: 0,
    totalTime: 0,
    averageTime: 0,
    slowQueries: [],
    errors: 0,
  }

  /**
   * Get or create Prisma client instance
   */
  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = PrismaClientSingleton.createClient()
    }
    return PrismaClientSingleton.instance
  }

  /**
   * Create configured Prisma client
   */
  private static createClient(): PrismaClient {
    const logLevels: Prisma.LogLevel[] = []
    
    if (DATABASE_CONFIG.logLevel === 'query') {
      logLevels.push('query')
    }
    if (['info', 'warn', 'error'].includes(DATABASE_CONFIG.logLevel)) {
      logLevels.push('info', 'warn', 'error')
    }

    // Base client configuration
    const prismaClient = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'warn',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
      ],
      errorFormat: env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
      datasourceUrl: env.DATABASE_URL,
    })

    // Apply extensions
    const extendedClient = this.applyExtensions(prismaClient)
    
    // Set up event listeners
    this.setupEventListeners(extendedClient)
    
    // Apply middleware
    this.applyMiddleware(extendedClient)

    return extendedClient
  }

  /**
   * Apply Prisma extensions
   */
  private static applyExtensions(client: PrismaClient): PrismaClient {
    let extended = client

    // Add Accelerate for edge caching (if configured)
    if (env.PRISMA_ACCELERATE_URL) {
      extended = extended.$extends(withAccelerate()) as PrismaClient
    }

    // Add Optimize for query analysis (development only)
    if (env.NODE_ENV === 'development' && env.PRISMA_OPTIMIZE_API_KEY) {
      extended = extended.$extends(
        withOptimize({
          apiKey: env.PRISMA_OPTIMIZE_API_KEY,
        })
      ) as PrismaClient
    }

    // Add read replicas for scaling
    if (env.DATABASE_REPLICA_URL) {
      extended = extended.$extends(
        readReplicas({
          replicas: [
            {
              name: 'replica1',
              url: env.DATABASE_REPLICA_URL,
            },
          ],
        })
      ) as PrismaClient
    }

    // Custom extensions
    extended = extended.$extends({
      name: 'chronos-extensions',
      
      // Model extensions
      model: {
        $allModels: {
          // Soft delete functionality
          async softDelete<T>(
            this: T,
            where: any
          ): Promise<any> {
            const context = Prisma.getExtensionContext(this)
            return (context as any).update({
              where,
              data: { deletedAt: new Date() },
            })
          },

          // Find with soft delete filter
          async findManyActive<T>(
            this: T,
            args?: any
          ): Promise<any[]> {
            const context = Prisma.getExtensionContext(this)
            return (context as any).findMany({
              ...args,
              where: {
                ...args?.where,
                deletedAt: null,
              },
            })
          },

          // Count active records
          async countActive<T>(
            this: T,
            args?: any
          ): Promise<number> {
            const context = Prisma.getExtensionContext(this)
            return (context as any).count({
              ...args,
              where: {
                ...args?.where,
                deletedAt: null,
              },
            })
          },
        },
      },

      // Query extensions
      query: {
        $allModels: {
          // Automatic retry on failure
          async $allOperations({ operation, model, args, query }) {
            let retries = 0
            let lastError: Error | null = null

            while (retries < DATABASE_CONFIG.maxRetries) {
              try {
                return await query(args)
              } catch (error) {
                lastError = error as Error
                retries++
                
                if (retries < DATABASE_CONFIG.maxRetries) {
                  await new Promise(resolve => 
                    setTimeout(resolve, DATABASE_CONFIG.retryDelay * retries)
                  )
                }
              }
            }

            throw lastError
          },
        },
      },

      // Result extensions
      result: {
        user: {
          // Computed field for full name
          fullName: {
            needs: { name: true },
            compute(user) {
              return user.name || 'Anonymous User'
            },
          },
          
          // Computed field for initials
          initials: {
            needs: { name: true },
            compute(user) {
              if (!user.name) return 'AU'
              return user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            },
          },
        },
      },
    }) as PrismaClient

    return extended
  }

  /**
   * Set up event listeners for monitoring
   */
  private static setupEventListeners(client: PrismaClient): void {
    // Query event listener
    ;(client.$on as any)('query', (e: QueryEvent) => {
      const duration = e.duration

      // Update metrics
      this.metrics.totalQueries++
      this.metrics.totalTime += duration
      this.metrics.averageTime = this.metrics.totalTime / this.metrics.totalQueries

      // Track slow queries
      if (duration > DATABASE_CONFIG.slowQueryThreshold) {
        this.metrics.slowQueries.push(e)
        
        // Keep only recent slow queries
        if (this.metrics.slowQueries.length > DATABASE_CONFIG.maxSlowQueries) {
          this.metrics.slowQueries.shift()
        }

        // Log slow query
        if (DATABASE_CONFIG.coloredLogs) {
          console.log(
            chalk.yellow('[SLOW QUERY]'),
            chalk.gray(`${duration}ms`),
            chalk.cyan(e.query)
          )
        } else {
          logger.warn('Slow query detected', {
            duration,
            query: e.query,
            params: e.params,
          })
        }
      }

      // Development logging
      if (env.NODE_ENV === 'development' && DATABASE_CONFIG.logLevel === 'query') {
        if (DATABASE_CONFIG.coloredLogs) {
          console.log(
            chalk.blue('[QUERY]'),
            chalk.gray(`${duration}ms`),
            chalk.white(e.query)
          )
        }
      }
    })

    // Error event listener
    ;(client.$on as any)('error', (e: any) => {
      this.metrics.errors++
      
      if (DATABASE_CONFIG.coloredLogs) {
        console.error(
          chalk.red('[DATABASE ERROR]'),
          e.message
        )
      } else {
        logger.error('Database error', e)
      }
    })

    // Warning event listener
    ;(client.$on as any)('warn', (e: any) => {
      if (DATABASE_CONFIG.coloredLogs) {
        console.warn(
          chalk.yellow('[DATABASE WARNING]'),
          e.message
        )
      } else {
        logger.warn('Database warning', e)
      }
    })
  }

  /**
   * Apply global middleware
   */
  private static applyMiddleware(client: PrismaClient): void {
    // Soft delete middleware
    client.$use(async (params, next) => {
      // Handle soft deletes for findUnique and findFirst
      if (params.model && ['findUnique', 'findFirst'].includes(params.action)) {
        if (!params.args?.where?.deletedAt) {
          params.args = {
            ...params.args,
            where: {
              ...params.args?.where,
              deletedAt: null,
            },
          }
        }
      }

      // Handle soft deletes for findMany
      if (params.model && params.action === 'findMany') {
        if (!params.args?.where?.deletedAt) {
          params.args = {
            ...params.args,
            where: {
              ...params.args?.where,
              deletedAt: null,
            },
          }
        }
      }

      // Convert delete to soft delete
      if (params.model && params.action === 'delete') {
        params.action = 'update'
        params.args = {
          ...params.args,
          data: { deletedAt: new Date() },
        }
      }

      // Convert deleteMany to soft delete
      if (params.model && params.action === 'deleteMany') {
        params.action = 'updateMany'
        params.args = {
          ...params.args,
          data: { deletedAt: new Date() },
        }
      }

      return next(params)
    })

    // Logging middleware
    client.$use(async (params, next) => {
      const start = performance.now()
      
      try {
        const result = await next(params)
        const duration = performance.now() - start

        // Log in development
        if (env.NODE_ENV === 'development') {
          global.prismaQueryCount = (global.prismaQueryCount || 0) + 1
          global.prismaQueryTime = (global.prismaQueryTime || 0) + duration
        }

        return result
      } catch (error) {
        const duration = performance.now() - start
        
        logger.error('Database query failed', {
          model: params.model,
          action: params.action,
          duration,
          error,
        })
        
        throw error
      }
    })

    // Auto-update timestamps
    client.$use(async (params, next) => {
      if (params.model) {
        // Auto-set createdAt on create
        if (params.action === 'create') {
          params.args.data = {
            ...params.args.data,
            createdAt: params.args.data.createdAt || new Date(),
            updatedAt: new Date(),
          }
        }

        // Auto-update updatedAt on update
        if (params.action === 'update' || params.action === 'updateMany') {
          params.args.data = {
            ...params.args.data,
            updatedAt: new Date(),
          }
        }
      }

      return next(params)
    })
  }

  /**
   * Get metrics
   */
  static getMetrics(): PrismaMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset metrics
   */
  static resetMetrics(): void {
    this.metrics = {
      totalQueries: 0,
      totalTime: 0,
      averageTime: 0,
      slowQueries: [],
      errors: 0,
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const client = this.getInstance()
      await client.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      logger.error('Database health check failed', error)
      return false
    }
  }

  /**
   * Disconnect client
   */
  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect()
      this.instance = null
    }
  }
}

// ===================================================================
// Export Prisma Client Instance
// ===================================================================

// Create singleton instance
const prismaClientSingleton = () => {
  return PrismaClientSingleton.getInstance()
}

// Global instance for development
if (env.NODE_ENV !== 'production') {
  global.prisma = global.prisma ?? prismaClientSingleton()
}

export const prisma = global.prisma ?? prismaClientSingleton()

// ===================================================================
// Utility Functions
// ===================================================================

/**
 * Execute a database transaction with retry logic
 */
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number
    timeout?: number
    isolationLevel?: Prisma.TransactionIsolationLevel
  }
): Promise<T> {
  const maxRetries = 3
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await prisma.$transaction(fn, {
        maxWait: options?.maxWait ?? 5000,
        timeout: options?.timeout ?? 10000,
        isolationLevel: options?.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted,
      })
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain errors
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2003', 'P2004'].includes(error.code)
      ) {
        throw error
      }

      // Wait before retry
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  throw lastError
}

/**
 * Execute a raw SQL query with proper typing
 */
export async function rawQuery<T = unknown>(
  query: string,
  values?: any[]
): Promise<T[]> {
  try {
    const result = await prisma.$queryRawUnsafe<T[]>(query, ...(values || []))
    return result
  } catch (error) {
    logger.error('Raw query failed', { query, values, error })
    throw error
  }
}

/**
 * Batch database operations for better performance
 */
export async function batchOperations<T>(
  operations: Promise<T>[]
): Promise<T[]> {
  const batchSize = 100
  const results: T[] = []

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch)
    results.push(...batchResults)
  }

  return results
}

/**
 * Create a cached database query
 */
export function cachedQuery<T extends (...args: any[]) => Promise<any>>(
  queryFn: T,
  ttl: number = DATABASE_CONFIG.cacheTime
): T {
  return cache(queryFn) as T
}

/**
 * Database connection status
 */
export async function getDatabaseStatus() {
  try {
    const startTime = performance.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = performance.now() - startTime

    const metrics = PrismaClientSingleton.getMetrics()

    return {
      connected: true,
      responseTime,
      metrics,
      pool: {
        // These would come from actual pool monitoring
        size: DATABASE_CONFIG.connection.connection_limit,
        available: 'unknown',
        waiting: 0,
      },
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metrics: PrismaClientSingleton.getMetrics(),
    }
  }
}

// ===================================================================
// Cleanup on app termination
// ===================================================================

if (env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await PrismaClientSingleton.disconnect()
  })
}

export default prisma
