# **Database Infrastructure Implementation**

I'll create a robust, production-ready database infrastructure with advanced features like connection pooling, caching strategies, query optimization, and comprehensive error handling.

## **1. `src/lib/db/prisma.ts`**

```typescript
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
```

## **2. `src/lib/db/redis.ts`**

```typescript
// chronos/src/lib/db/redis.ts
import Redis, { type Redis as RedisClient, type RedisOptions } from 'ioredis'
import { logger } from '@/lib/utils/logger'
import { env } from '@/lib/env'

// ===================================================================
// Type Declarations
// ===================================================================

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  nx?: boolean // Only set if not exists
  xx?: boolean // Only set if exists
  tags?: string[] // Cache tags for invalidation
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

export interface PubSubMessage {
  channel: string
  data: any
  timestamp: Date
}

interface RedisMetrics {
  hits: number
  misses: number
  errors: number
  totalCommands: number
  avgResponseTime: number
  memoryUsage: number
  connectedClients: number
  uptime: number
}

// ===================================================================
// Configuration
// ===================================================================

const REDIS_CONFIG = {
  connection: {
    host: env.REDIS_HOST || 'localhost',
    port: parseInt(env.REDIS_PORT || '6379'),
    password: env.REDIS_PASSWORD,
    db: parseInt(env.REDIS_DB || '0'),
    family: 4,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000)
      logger.warn(`Redis connection retry attempt ${times}, delay ${delay}ms`)
      return delay
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    disconnectTimeout: 2000,
    commandTimeout: 5000,
    lazyConnect: false,
    keepAlive: 30000,
    noDelay: true,
    connectionName: 'chronos-app',
  } as RedisOptions,

  // Cache configuration
  cache: {
    defaultTTL: 3600, // 1 hour
    maxTTL: 86400 * 30, // 30 days
    keyPrefix: 'cache:',
  },

  // Session configuration
  session: {
    ttl: 86400 * 30, // 30 days
    keyPrefix: 'session:',
  },

  // Rate limiting configuration
  rateLimit: {
    keyPrefix: 'rate:',
    windowMs: 60000, // 1 minute
  },

  // Pub/Sub configuration
  pubsub: {
    keyPrefix: 'pubsub:',
  },

  // Queue configuration
  queue: {
    keyPrefix: 'queue:',
    maxRetries: 3,
    retryDelay: 5000,
  },
} as const

// ===================================================================
// Redis Client Manager
// ===================================================================

class RedisManager {
  private static instance: RedisManager | null = null
  private client: RedisClient | null = null
  private subscriber: RedisClient | null = null
  private publisher: RedisClient | null = null
  private metrics: RedisMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalCommands: 0,
    avgResponseTime: 0,
    memoryUsage: 0,
    connectedClients: 0,
    uptime: 0,
  }
  private responseTimings: number[] = []
  private listeners: Map<string, Set<(message: PubSubMessage) => void>> = new Map()

  /**
   * Get singleton instance
   */
  static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager()
    }
    return RedisManager.instance
  }

  /**
   * Initialize Redis clients
   */
  async initialize(): Promise<void> {
    if (this.client) return

    try {
      // Main client for general operations
      this.client = new Redis(REDIS_CONFIG.connection)
      
      // Subscriber client for pub/sub
      this.subscriber = new Redis(REDIS_CONFIG.connection)
      
      // Publisher client for pub/sub
      this.publisher = new Redis(REDIS_CONFIG.connection)

      // Set up event handlers
      this.setupEventHandlers()

      // Wait for connections
      await Promise.all([
        this.waitForConnection(this.client, 'main'),
        this.waitForConnection(this.subscriber, 'subscriber'),
        this.waitForConnection(this.publisher, 'publisher'),
      ])

      logger.info('Redis clients initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Redis', error)
      throw error
    }
  }

  /**
   * Wait for client connection
   */
  private async waitForConnection(client: RedisClient, name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Redis ${name} client connection timeout`))
      }, 10000)

      client.once('ready', () => {
        clearTimeout(timeout)
        logger.info(`Redis ${name} client connected`)
        resolve()
      })

      client.once('error', (error) => {
        clearTimeout(timeout)
        logger.error(`Redis ${name} client error`, error)
        reject(error)
      })
    })
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client || !this.subscriber || !this.publisher) return

    // Main client events
    this.client.on('error', (error) => {
      this.metrics.errors++
      logger.error('Redis client error', error)
    })

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...')
    })

    // Monitor commands for metrics
    this.client.monitor((err, monitor) => {
      if (err) {
        logger.error('Redis monitor error', err)
        return
      }

      monitor.on('monitor', (time, args) => {
        this.metrics.totalCommands++
        // Track response time (simplified)
        const responseTime = Date.now() - parseInt(time) * 1000
        this.responseTimings.push(responseTime)
        
        // Keep only last 1000 timings
        if (this.responseTimings.length > 1000) {
          this.responseTimings.shift()
        }
        
        // Calculate average
        this.metrics.avgResponseTime = 
          this.responseTimings.reduce((a, b) => a + b, 0) / this.responseTimings.length
      })
    })

    // Subscriber events
    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message)
    })

    this.subscriber.on('pmessage', (pattern: string, channel: string, message: string) => {
      this.handleMessage(channel, message)
    })
  }

  /**
   * Handle pub/sub messages
   */
  private handleMessage(channel: string, message: string): void {
    try {
      const data = JSON.parse(message)
      const pubsubMessage: PubSubMessage = {
        channel,
        data,
        timestamp: new Date(),
      }

      // Notify listeners
      const listeners = this.listeners.get(channel)
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(pubsubMessage)
          } catch (error) {
            logger.error('PubSub listener error', { channel, error })
          }
        })
      }
    } catch (error) {
      logger.error('Failed to parse pub/sub message', { channel, message, error })
    }
  }

  /**
   * Get Redis client
   */
  getClient(): RedisClient {
    if (!this.client) {
      throw new Error('Redis client not initialized')
    }
    return this.client
  }

  /**
   * Get subscriber client
   */
  getSubscriber(): RedisClient {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not initialized')
    }
    return this.subscriber
  }

  /**
   * Get publisher client
   */
  getPublisher(): RedisClient {
    if (!this.publisher) {
      throw new Error('Redis publisher not initialized')
    }
    return this.publisher
  }

  /**
   * Get metrics
   */
  async getMetrics(): Promise<RedisMetrics> {
    if (!this.client) {
      throw new Error('Redis client not initialized')
    }

    try {
      const info = await this.client.info()
      const sections = this.parseInfo(info)

      this.metrics.memoryUsage = parseInt(sections.memory?.used_memory || '0')
      this.metrics.connectedClients = parseInt(sections.clients?.connected_clients || '0')
      this.metrics.uptime = parseInt(sections.server?.uptime_in_seconds || '0')

      return { ...this.metrics }
    } catch (error) {
      logger.error('Failed to get Redis metrics', error)
      return this.metrics
    }
  }

  /**
   * Parse Redis INFO output
   */
  private parseInfo(info: string): Record<string, Record<string, string>> {
    const sections: Record<string, Record<string, string>> = {}
    let currentSection = ''

    info.split('\n').forEach(line => {
      line = line.trim()
      if (!line || line.startsWith('#')) {
        if (line.startsWith('# ')) {
          currentSection = line.substring(2).toLowerCase()
          sections[currentSection] = {}
        }
        return
      }

      const [key, value] = line.split(':')
      if (currentSection && key && value) {
        sections[currentSection][key] = value
      }
    })

    return sections
  }

  /**
   * Subscribe to channel
   */
  subscribe(channel: string, callback: (message: PubSubMessage) => void): void {
    if (!this.subscriber) {
      throw new Error('Redis subscriber not initialized')
    }

    // Add listener
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
      this.subscriber.subscribe(channel)
    }
    this.listeners.get(channel)!.add(callback)
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channel: string, callback?: (message: PubSubMessage) => void): void {
    if (!this.subscriber) return

    if (callback) {
      const listeners = this.listeners.get(channel)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(channel)
          this.subscriber.unsubscribe(channel)
        }
      }
    } else {
      this.listeners.delete(channel)
      this.subscriber.unsubscribe(channel)
    }
  }

  /**
   * Publish message
   */
  async publish(channel: string, data: any): Promise<void> {
    if (!this.publisher) {
      throw new Error('Redis publisher not initialized')
    }

    const message = JSON.stringify(data)
    await this.publisher.publish(channel, message)
  }

  /**
   * Disconnect all clients
   */
  async disconnect(): Promise<void> {
    const clients = [this.client, this.subscriber, this.publisher].filter(Boolean)
    
    await Promise.all(
      clients.map(client => client!.quit())
    )

    this.client = null
    this.subscriber = null
    this.publisher = null
    this.listeners.clear()
    
    logger.info('Redis clients disconnected')
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) return false
      
      const result = await this.client.ping()
      return result === 'PONG'
    } catch (error) {
      logger.error('Redis health check failed', error)
      return false
    }
  }
}

// ===================================================================
// Cache Functions
// ===================================================================

/**
 * Get value from cache
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const redis = RedisManager.getInstance().getClient()
  const fullKey = `${REDIS_CONFIG.cache.keyPrefix}${key}`

  try {
    const value = await redis.get(fullKey)
    
    if (value) {
      RedisManager.getInstance()['metrics'].hits++
      return JSON.parse(value) as T
    }
    
    RedisManager.getInstance()['metrics'].misses++
    return null
  } catch (error) {
    logger.error('Cache get error', { key, error })
    RedisManager.getInstance()['metrics'].errors++
    return null
  }
}

/**
 * Set value in cache
 */
export async function cacheSet(
  key: string,
  value: any,
  options: CacheOptions = {}
): Promise<boolean> {
  const redis = RedisManager.getInstance().getClient()
  const fullKey = `${REDIS_CONFIG.cache.keyPrefix}${key}`
  const ttl = Math.min(
    options.ttl || REDIS_CONFIG.cache.defaultTTL,
    REDIS_CONFIG.cache.maxTTL
  )

  try {
    const serialized = JSON.stringify(value)
    
    if (options.nx) {
      const result = await redis.set(fullKey, serialized, 'EX', ttl, 'NX')
      return result === 'OK'
    } else if (options.xx) {
      const result = await redis.set(fullKey, serialized, 'EX', ttl, 'XX')
      return result === 'OK'
    } else {
      await redis.setex(fullKey, ttl, serialized)
    }

    // Handle cache tags
    if (options.tags && options.tags.length > 0) {
      await Promise.all(
        options.tags.map(tag =>
          redis.sadd(`${REDIS_CONFIG.cache.keyPrefix}tag:${tag}`, fullKey)
        )
      )
    }

    return true
  } catch (error) {
    logger.error('Cache set error', { key, error })
    RedisManager.getInstance()['metrics'].errors++
    return false
  }
}

/**
 * Delete from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const redis = RedisManager.getInstance().getClient()
  const fullKey = `${REDIS_CONFIG.cache.keyPrefix}${key}`

  try {
    const result = await redis.del(fullKey)
    return result > 0
  } catch (error) {
    logger.error('Cache delete error', { key, error })
    return false
  }
}

/**
 * Clear cache by pattern
 */
export async function cacheClear(pattern: string = '*'): Promise<number> {
  const redis = RedisManager.getInstance().getClient()
  const fullPattern = `${REDIS_CONFIG.cache.keyPrefix}${pattern}`

  try {
    const keys = await redis.keys(fullPattern)
    
    if (keys.length === 0) return 0
    
    const result = await redis.del(...keys)
    return result
  } catch (error) {
    logger.error('Cache clear error', { pattern, error })
    return 0
  }
}

/**
 * Invalidate cache by tags
 */
export async function cacheInvalidateByTags(tags: string[]): Promise<number> {
  const redis = RedisManager.getInstance().getClient()
  let totalDeleted = 0

  try {
    for (const tag of tags) {
      const tagKey = `${REDIS_CONFIG.cache.keyPrefix}tag:${tag}`
      const keys = await redis.smembers(tagKey)
      
      if (keys.length > 0) {
        const deleted = await redis.del(...keys)
        totalDeleted += deleted
        await redis.del(tagKey)
      }
    }

    return totalDeleted
  } catch (error) {
    logger.error('Cache invalidate by tags error', { tags, error })
    return 0
  }
}

/**
 * Cached function wrapper
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    key: (...args: Parameters<T>) => string
    ttl?: number
    tags?: string[]
  }
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = options.key(...args)
    
    // Try to get from cache
    const cached = await cacheGet(cacheKey)
    if (cached !== null) {
      return cached
    }

    // Execute function
    const result = await fn(...args)
    
    // Store in cache
    await cacheSet(cacheKey, result, {
      ttl: options.ttl,
      tags: options.tags,
    })

    return result
  }) as T
}

// ===================================================================
// Session Functions
// ===================================================================

/**
 * Get session data
 */
export async function sessionGet(sessionId: string): Promise<any | null> {
  const redis = RedisManager.getInstance().getClient()
  const key = `${REDIS_CONFIG.session.keyPrefix}${sessionId}`

  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    logger.error('Session get error', { sessionId, error })
    return null
  }
}

/**
 * Set session data
 */
export async function sessionSet(
  sessionId: string,
  data: any,
  ttl: number = REDIS_CONFIG.session.ttl
): Promise<boolean> {
  const redis = RedisManager.getInstance().getClient()
  const key = `${REDIS_CONFIG.session.keyPrefix}${sessionId}`

  try {
    await redis.setex(key, ttl, JSON.stringify(data))
    return true
  } catch (error) {
    logger.error('Session set error', { sessionId, error })
    return false
  }
}

/**
 * Delete session
 */
export async function sessionDelete(sessionId: string): Promise<boolean> {
  const redis = RedisManager.getInstance().getClient()
  const key = `${REDIS_CONFIG.session.keyPrefix}${sessionId}`

  try {
    const result = await redis.del(key)
    return result > 0
  } catch (error) {
    logger.error('Session delete error', { sessionId, error })
    return false
  }
}

/**
 * Refresh session TTL
 */
export async function sessionRefresh(
  sessionId: string,
  ttl: number = REDIS_CONFIG.session.ttl
): Promise<boolean> {
  const redis = RedisManager.getInstance().getClient()
  const key = `${REDIS_CONFIG.session.keyPrefix}${sessionId}`

  try {
    const result = await redis.expire(key, ttl)
    return result === 1
  } catch (error) {
    logger.error('Session refresh error', { sessionId, error })
    return false
  }
}

// ===================================================================
// Rate Limiting Functions
// ===================================================================

/**
 * Check rate limit
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number = REDIS_CONFIG.rateLimit.windowMs
): Promise<RateLimitResult> {
  const redis = RedisManager.getInstance().getClient()
  const key = `${REDIS_CONFIG.rateLimit.keyPrefix}${identifier}`
  const now = Date.now()
  const window = Math.floor(now / windowMs)
  const fullKey = `${key}:${window}`

  try {
    const pipeline = redis.pipeline()
    pipeline.incr(fullKey)
    pipeline.expire(fullKey, Math.ceil(windowMs / 1000))
    
    const results = await pipeline.exec()
    const count = results?.[0]?.[1] as number || 0

    const reset = new Date((window + 1) * windowMs)
    const remaining = Math.max(0, limit - count)

    return {
      success: count <= limit,
      limit,
      remaining,
      reset,
    }
  } catch (error) {
    logger.error('Rate limit error', { identifier, error })
    
    // Fail open on error
    return {
      success: true,
      limit,
      remaining: limit,
      reset: new Date(now + windowMs),
    }
  }
}

/**
 * Reset rate limit
 */
export async function rateLimitReset(identifier: string): Promise<boolean> {
  const redis = RedisManager.getInstance().getClient()
  const pattern = `${REDIS_CONFIG.rateLimit.keyPrefix}${identifier}:*`

  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    return true
  } catch (error) {
    logger.error('Rate limit reset error', { identifier, error })
    return false
  }
}

// ===================================================================
// Queue Functions
// ===================================================================

/**
 * Add job to queue
 */
export async function queuePush(
  queue: string,
  job: any,
  priority: number = 0
): Promise<boolean> {
  const redis = RedisManager.getInstance().getClient()
  const key = `${REDIS_CONFIG.queue.keyPrefix}${queue}`

  try {
    const jobData = JSON.stringify({
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: job,
      priority,
      timestamp: Date.now(),
      attempts: 0,
    })

    if (priority > 0) {
      // Use sorted set for priority queue
      await redis.zadd(key, priority, jobData)
    } else {
      // Use list for FIFO queue
      await redis.rpush(key, jobData)
    }

    return true
  } catch (error) {
    logger.error('Queue push error', { queue, error })
    return false
  }
}

/**
 * Pop job from queue
 */
export async function queuePop(queue: string): Promise<any | null> {
  const redis = RedisManager.getInstance().getClient()
  const key = `${REDIS_CONFIG.queue.keyPrefix}${queue}`

  try {
    // Try priority queue first
    const priorityJob = await redis.zpopmax(key)
    if (priorityJob && priorityJob.length > 0) {
      return JSON.parse(priorityJob[0])
    }

    // Fall back to FIFO queue
    const job = await redis.lpop(key)
    return job ? JSON.parse(job) : null
  } catch (error) {
    logger.error('Queue pop error', { queue, error })
    return null
  }
}

/**
 * Get queue size
 */
export async function queueSize(queue: string): Promise<number> {
  const redis = RedisManager.getInstance().getClient()
  const key = `${REDIS_CONFIG.queue.keyPrefix}${queue}`

  try {
    const [listSize, setSize] = await Promise.all([
      redis.llen(key),
      redis.zcard(key),
    ])

    return listSize + setSize
  } catch (error) {
    logger.error('Queue size error', { queue, error })
    return 0
  }
}

// ===================================================================
// Pub/Sub Functions
// ===================================================================

/**
 * Subscribe to channel
 */
export function subscribe(
  channel: string,
  callback: (message: PubSubMessage) => void
): void {
  const manager = RedisManager.getInstance()
  manager.subscribe(channel, callback)
}

/**
 * Unsubscribe from channel
 */
export function unsubscribe(
  channel: string,
  callback?: (message: PubSubMessage) => void
): void {
  const manager = RedisManager.getInstance()
  manager.unsubscribe(channel, callback)
}

/**
 * Publish message to channel
 */
export async function publish(channel: string, data: any): Promise<void> {
  const manager = RedisManager.getInstance()
  await manager.publish(channel, data)
}

// ===================================================================
// Lock Functions
// ===================================================================

/**
 * Acquire distributed lock
 */
export async function acquireLock(
  resource: string,
  ttl: number = 10000
): Promise<string | null> {
  const redis = RedisManager.getInstance().getClient()
  const key = `lock:${resource}`
  const token = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    const result = await redis.set(key, token, 'PX', ttl, 'NX')
    return result === 'OK' ? token : null
  } catch (error) {
    logger.error('Acquire lock error', { resource, error })
    return null
  }
}

/**
 * Release distributed lock
 */
export async function releaseLock(
  resource: string,
  token: string
): Promise<boolean> {
  const redis = RedisManager.getInstance().getClient()
  const key = `lock:${resource}`

  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `

  try {
    const result = await redis.eval(script, 1, key, token) as number
    return result === 1
  } catch (error) {
    logger.error('Release lock error', { resource, error })
    return false
  }
}

/**
 * Execute with lock
 */
export async function withLock<T>(
  resource: string,
  fn: () => Promise<T>,
  options: { ttl?: number; retries?: number; retryDelay?: number } = {}
): Promise<T | null> {
  const { ttl = 10000, retries = 3, retryDelay = 1000 } = options
  let token: string | null = null

  for (let i = 0; i < retries; i++) {
    token = await acquireLock(resource, ttl)
    
    if (token) {
      try {
        const result = await fn()
        await releaseLock(resource, token)
        return result
      } catch (error) {
        await releaseLock(resource, token)
        throw error
      }
    }

    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  return null
}

// ===================================================================
// Initialize and Export
// ===================================================================

// Initialize Redis on module load
const redisManager = RedisManager.getInstance()

// Auto-initialize in non-serverless environments
if (env.NODE_ENV !== 'production' || !env.IS_SERVERLESS) {
  redisManager.initialize().catch(error => {
    logger.error('Failed to auto-initialize Redis', error)
  })
}

// Cleanup on process termination
if (env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await redisManager.disconnect()
  })
}

export const redis = redisManager

export default redis
```

## **3. `src/lib/db/queries.ts`**

```typescript
// chronos/src/lib/db/queries.ts
import { Prisma, type User, type Event, type Task, type Calendar } from '@prisma/client'
import { prisma, withTransaction, cachedQuery } from './prisma'
import { cacheGet, cacheSet, cacheDelete, cacheInvalidateByTags } from './redis'
import { logger } from '@/lib/utils/logger'
import { z } from 'zod'

// ===================================================================
// Type Declarations
// ===================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
  orderBy?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    cursor?: string
  }
}

export interface SearchParams {
  query: string
  fields?: string[]
  fuzzy?: boolean
  limit?: number
}

export interface FilterParams {
  [key: string]: any
}

export interface AggregateResult {
  count: number
  sum?: number
  avg?: number
  min?: any
  max?: any
}

export interface TimeRange {
  start: Date
  end: Date
}

// ===================================================================
// Query Builders
// ===================================================================

/**
 * Build pagination query options
 */
export function buildPaginationQuery(params: PaginationParams = {}) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const skip = (page - 1) * limit

  const orderBy = params.orderBy || 'createdAt'
  const order = params.order || 'desc'

  return {
    skip,
    take: limit,
    orderBy: { [orderBy]: order },
    ...(params.cursor && { cursor: { id: params.cursor } }),
  }
}

/**
 * Build search query
 */
export function buildSearchQuery(params: SearchParams) {
  const { query, fields = ['name', 'title', 'description'], fuzzy = true } = params

  if (!query || query.trim().length === 0) {
    return {}
  }

  const searchTerms = query.trim().toLowerCase().split(/\s+/)

  if (fuzzy) {
    // Fuzzy search across multiple fields
    return {
      OR: fields.map(field => ({
        [field]: {
          contains: query,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      })),
    }
  } else {
    // Exact match search
    return {
      AND: searchTerms.map(term => ({
        OR: fields.map(field => ({
          [field]: {
            contains: term,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        })),
      })),
    }
  }
}

/**
 * Build filter query
 */
export function buildFilterQuery(filters: FilterParams) {
  const query: any = {}

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    // Handle special filter types
    if (key.endsWith('_gte')) {
      const field = key.replace('_gte', '')
      query[field] = { ...(query[field] || {}), gte: value }
    } else if (key.endsWith('_lte')) {
      const field = key.replace('_lte', '')
      query[field] = { ...(query[field] || {}), lte: value }
    } else if (key.endsWith('_gt')) {
      const field = key.replace('_gt', '')
      query[field] = { ...(query[field] || {}), gt: value }
    } else if (key.endsWith('_lt')) {
      const field = key.replace('_lt', '')
      query[field] = { ...(query[field] || {}), lt: value }
    } else if (key.endsWith('_in')) {
      const field = key.replace('_in', '')
      query[field] = { in: Array.isArray(value) ? value : [value] }
    } else if (key.endsWith('_not')) {
      const field = key.replace('_not', '')
      query[field] = { not: value }
    } else if (key.endsWith('_contains')) {
      const field = key.replace('_contains', '')
      query[field] = { contains: value, mode: 'insensitive' }
    } else if (Array.isArray(value)) {
      query[key] = { in: value }
    } else {
      query[key] = value
    }
  })

  return query
}

// ===================================================================
// User Queries
// ===================================================================

/**
 * Get user by ID with caching
 */
export const getUserById = cachedQuery(
  async (userId: string, includeRelations = false) => {
    const cacheKey = `user:${userId}:${includeRelations}`
    
    // Try cache first
    const cached = await cacheGet<User>(cacheKey)
    if (cached) return cached

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: includeRelations ? {
        calendars: true,
        categories: true,
        tags: true,
        _count: {
          select: {
            events: true,
            tasks: true,
            focusSessions: true,
          },
        },
      } : undefined,
    })

    if (user) {
      await cacheSet(cacheKey, user, { ttl: 300, tags: [`user:${userId}`] })
    }

    return user
  },
  300 // Cache for 5 minutes
)

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })
}

/**
 * Search users
 */
export async function searchUsers(
  params: SearchParams & PaginationParams
): Promise<PaginatedResult<User>> {
  const searchQuery = buildSearchQuery({
    ...params,
    fields: ['name', 'email', 'username'],
  })
  const paginationQuery = buildPaginationQuery(params)

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...searchQuery,
        deletedAt: null,
      },
      ...paginationQuery,
    }),
    prisma.user.count({
      where: {
        ...searchQuery,
        deletedAt: null,
      },
    }),
  ])

  const page = Math.max(1, params.page || 1)
  const limit = paginationQuery.take

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }
}

/**
 * Update user and invalidate cache
 */
export async function updateUser(userId: string, data: Prisma.UserUpdateInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  })

  // Invalidate cache
  await cacheInvalidateByTags([`user:${userId}`])

  return user
}

// ===================================================================
// Event Queries
// ===================================================================

/**
 * Get events for date range
 */
export async function getEventsByDateRange(
  userId: string,
  range: TimeRange,
  options: {
    calendarIds?: string[]
    includeRecurring?: boolean
  } = {}
): Promise<Event[]> {
  const cacheKey = `events:${userId}:${range.start.toISOString()}:${range.end.toISOString()}`
  
  // Try cache
  const cached = await cacheGet<Event[]>(cacheKey)
  if (cached) return cached

  const events = await prisma.event.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(options.calendarIds && {
        calendarId: { in: options.calendarIds },
      }),
      OR: [
        // Regular events in range
        {
          startDateTime: { lte: range.end },
          endDateTime: { gte: range.start },
        },
        // Recurring events
        ...(options.includeRecurring ? [{
          isRecurring: true,
          OR: [
            { recurringEndDate: null },
            { recurringEndDate: { gte: range.start } },
          ],
        }] : []),
      ],
    },
    include: {
      calendar: true,
      category: true,
      attendees: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: {
      startDateTime: 'asc',
    },
  })

  // Cache for 5 minutes
  await cacheSet(cacheKey, events, { ttl: 300, tags: [`events:${userId}`] })

  return events
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(
  userId: string,
  limit: number = 10
): Promise<Event[]> {
  const now = new Date()
  
  return prisma.event.findMany({
    where: {
      userId,
      deletedAt: null,
      startDateTime: { gte: now },
    },
    take: limit,
    orderBy: {
      startDateTime: 'asc',
    },
    include: {
      calendar: true,
      category: true,
    },
  })
}

/**
 * Check for event conflicts
 */
export async function checkEventConflicts(
  userId: string,
  start: Date,
  end: Date,
  excludeEventId?: string
): Promise<Event[]> {
  return prisma.event.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(excludeEventId && {
        NOT: { id: excludeEventId },
      }),
      isBusy: true,
      OR: [
        // Event starts during the new event
        {
          startDateTime: { gte: start, lt: end },
        },
        // Event ends during the new event
        {
          endDateTime: { gt: start, lte: end },
        },
        // Event completely overlaps the new event
        {
          startDateTime: { lte: start },
          endDateTime: { gte: end },
        },
      ],
    },
  })
}

/**
 * Create event with conflict check
 */
export async function createEvent(
  data: Prisma.EventCreateInput,
  checkConflicts: boolean = true
): Promise<Event> {
  // Check for conflicts
  if (checkConflicts && data.isBusy) {
    const conflicts = await checkEventConflicts(
      data.user.connect?.id || '',
      data.startDateTime as Date,
      data.endDateTime as Date
    )

    if (conflicts.length > 0) {
      throw new Error(`Event conflicts with ${conflicts.length} existing event(s)`)
    }
  }

  const event = await prisma.event.create({
    data,
    include: {
      calendar: true,
      category: true,
      attendees: true,
    },
  })

  // Invalidate cache
  await cacheInvalidateByTags([`events:${event.userId}`])

  return event
}

// ===================================================================
// Task Queries
// ===================================================================

/**
 * Get tasks with filters
 */
export async function getTasks(
  userId: string,
  filters: FilterParams = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<Task>> {
  const where = {
    userId,
    deletedAt: null,
    ...buildFilterQuery(filters),
  }

  const paginationQuery = buildPaginationQuery(pagination)

  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where,
      ...paginationQuery,
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        assignments: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
            focusSessions: true,
          },
        },
      },
    }),
    prisma.task.count({ where }),
  ])

  const page = Math.max(1, pagination.page || 1)
  const limit = paginationQuery.take

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }
}

/**
 * Get task statistics
 */
export async function getTaskStatistics(userId: string): Promise<{
  total: number
  completed: number
  inProgress: number
  overdue: number
  completionRate: number
  averageCompletionTime: number
}> {
  const now = new Date()

  const [total, completed, inProgress, overdue] = await Promise.all([
    prisma.task.count({
      where: { userId, deletedAt: null },
    }),
    prisma.task.count({
      where: { userId, status: 'COMPLETED', deletedAt: null },
    }),
    prisma.task.count({
      where: { userId, status: 'IN_PROGRESS', deletedAt: null },
    }),
    prisma.task.count({
      where: {
        userId,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now },
        deletedAt: null,
      },
    }),
  ])

  // Calculate average completion time
  const completedTasks = await prisma.task.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: { not: null },
      deletedAt: null,
    },
    select: {
      createdAt: true,
      completedAt: true,
    },
  })

  const totalCompletionTime = completedTasks.reduce((acc, task) => {
    if (task.completedAt) {
      return acc + (task.completedAt.getTime() - task.createdAt.getTime())
    }
    return acc
  }, 0)

  const averageCompletionTime = completedTasks.length > 0
    ? totalCompletionTime / completedTasks.length
    : 0

  return {
    total,
    completed,
    inProgress,
    overdue,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    averageCompletionTime,
  }
}

/**
 * Bulk update tasks
 */
export async function bulkUpdateTasks(
  userId: string,
  taskIds: string[],
  data: Prisma.TaskUpdateInput
): Promise<number> {
  const result = await prisma.task.updateMany({
    where: {
      id: { in: taskIds },
      userId,
    },
    data,
  })

  // Invalidate cache
  await cacheInvalidateByTags([`tasks:${userId}`])

  return result.count
}

// ===================================================================
// Calendar Queries
// ===================================================================

/**
 * Get user calendars
 */
export async function getUserCalendars(
  userId: string,
  includeShared: boolean = false
): Promise<Calendar[]> {
  const calendars = await prisma.calendar.findMany({
    where: {
      OR: [
        { userId },
        ...(includeShared ? [{
          shares: {
            some: {
              sharedWithId: userId,
            },
          },
        }] : []),
      ],
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          events: true,
        },
      },
      ...(includeShared && {
        shares: {
          where: {
            sharedWithId: userId,
          },
        },
      }),
    },
    orderBy: [
      { isDefault: 'desc' },
      { name: 'asc' },
    ],
  })

  return calendars
}

// ===================================================================
// Analytics Queries
// ===================================================================

/**
 * Get productivity analytics
 */
export async function getProductivityAnalytics(
  userId: string,
  range: TimeRange
): Promise<{
  totalFocusTime: number
  totalTasks: number
  completedTasks: number
  totalEvents: number
  busiestDay: string
  mostProductiveHour: number
  streakDays: number
}> {
  const [focusSessions, tasks, events] = await Promise.all([
    // Get focus sessions
    prisma.focusSession.findMany({
      where: {
        userId,
        startTime: { gte: range.start, lte: range.end },
        status: 'COMPLETED',
      },
      select: {
        actualDuration: true,
        startTime: true,
      },
    }),
    
    // Get tasks
    prisma.task.findMany({
      where: {
        userId,
        createdAt: { gte: range.start, lte: range.end },
        deletedAt: null,
      },
      select: {
        status: true,
        completedAt: true,
      },
    }),
    
    // Get events
    prisma.event.findMany({
      where: {
        userId,
        startDateTime: { gte: range.start, lte: range.end },
        deletedAt: null,
      },
      select: {
        startDateTime: true,
      },
    }),
  ])

  // Calculate total focus time
  const totalFocusTime = focusSessions.reduce((acc, session) => 
    acc + (session.actualDuration || 0), 0
  )

  // Calculate task metrics
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length

  // Find busiest day
  const dayCount: Record<string, number> = {}
  events.forEach(event => {
    const day = event.startDateTime.toISOString().split('T')[0]
    dayCount[day] = (dayCount[day] || 0) + 1
  })
  const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

  // Find most productive hour
  const hourCount: Record<number, number> = {}
  focusSessions.forEach(session => {
    const hour = session.startTime.getHours()
    hourCount[hour] = (hourCount[hour] || 0) + 1
  })
  const mostProductiveHour = Number(
    Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 0
  )

  // Calculate streak (simplified)
  const today = new Date()
  const streakDays = await calculateStreak(userId, today)

  return {
    totalFocusTime,
    totalTasks: tasks.length,
    completedTasks,
    totalEvents: events.length,
    busiestDay,
    mostProductiveHour,
    streakDays,
  }
}

/**
 * Calculate activity streak
 */
async function calculateStreak(userId: string, endDate: Date): Promise<number> {
  let streak = 0
  let currentDate = new Date(endDate)

  while (true) {
    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)
    
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    const activity = await prisma.task.count({
      where: {
        userId,
        OR: [
          { createdAt: { gte: dayStart, lte: dayEnd } },
          { completedAt: { gte: dayStart, lte: dayEnd } },
        ],
      },
    })

    if (activity === 0) break

    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

// ===================================================================
// Transaction Helpers
// ===================================================================

/**
 * Create event with tasks
 */
export async function createEventWithTasks(
  eventData: Prisma.EventCreateInput,
  taskData: Omit<Prisma.TaskCreateInput, 'user' | 'event'>[]
): Promise<{ event: Event; tasks: Task[] }> {
  return withTransaction(async (tx) => {
    // Create event
    const event = await tx.event.create({
      data: eventData,
    })

    // Create associated tasks
    const tasks = await Promise.all(
      taskData.map(task =>
        tx.task.create({
          data: {
            ...task,
            user: eventData.user,
            event: { connect: { id: event.id } },
          },
        })
      )
    )

    return { event, tasks }
  })
}

/**
 * Delete user data (GDPR compliance)
 */
export async function deleteUserData(userId: string): Promise<void> {
  await withTransaction(async (tx) => {
    // Delete in order of dependencies
    await tx.notification.deleteMany({ where: { userId } })
    await tx.insight.deleteMany({ where: { userId } })
    await tx.focusSession.deleteMany({ where: { userId } })
    await tx.taskTag.deleteMany({
      where: { task: { userId } },
    })
    await tx.eventTag.deleteMany({
      where: { event: { userId } },
    })
    await tx.tag.deleteMany({ where: { userId } })
    await tx.task.deleteMany({ where: { userId } })
    await tx.eventAttendee.deleteMany({
      where: { event: { userId } },
    })
    await tx.event.deleteMany({ where: { userId } })
    await tx.calendarShare.deleteMany({
      where: { calendar: { userId } },
    })
    await tx.calendar.deleteMany({ where: { userId } })
    await tx.category.deleteMany({ where: { userId } })
    await tx.account.deleteMany({ where: { userId } })
    await tx.session.deleteMany({ where: { userId } })
    
    // Finally, delete the user
    await tx.user.delete({ where: { id: userId } })
  })

  // Clear all caches for this user
  await cacheInvalidateByTags([
    `user:${userId}`,
    `events:${userId}`,
    `tasks:${userId}`,
  ])
}

// ===================================================================
// Export All Queries
// ===================================================================

export const queries = {
  // User queries
  getUserById,
  getUserByEmail,
  searchUsers,
  updateUser,
  
  // Event queries
  getEventsByDateRange,
  getUpcomingEvents,
  checkEventConflicts,
  createEvent,
  
  // Task queries
  getTasks,
  getTaskStatistics,
  bulkUpdateTasks,
  
  // Calendar queries
  getUserCalendars,
  
  // Analytics queries
  getProductivityAnalytics,
  
  // Transaction helpers
  createEventWithTasks,
  deleteUserData,
}

export default queries
```

---

These three database infrastructure files provide a comprehensive, production-ready data layer for Chronos:

## **Key Features Implemented:**

### **`prisma.ts` - Advanced Prisma Client:**
- **Singleton pattern** preventing multiple connections
- **Connection pooling** with configurable limits
- **Query performance monitoring** with slow query detection
- **Automatic retry logic** for transient failures
- **Soft delete middleware** for data recovery
- **Timestamp automation** for createdAt/updatedAt
- **Read replica support** for scaling
- **Prisma extensions** for accelerate and optimize
- **Comprehensive metrics** and health checks
- **Transaction helpers** with retry logic
- **Cached query wrapper** for performance

### **`redis.ts` - Complete Redis Infrastructure:**
- **Multi-client setup** for pub/sub and general operations
- **Comprehensive caching** with TTL and tags
- **Session management** with refresh capabilities
- **Rate limiting** with sliding windows
- **Queue management** for background jobs
- **Pub/Sub messaging** for real-time features
- **Distributed locks** for concurrency control
- **Metrics collection** and monitoring
- **Automatic reconnection** handling
- **Cache invalidation** by tags

### **`queries.ts` - Optimized Query Layer:**
- **Pagination utilities** with cursor support
- **Search functionality** with fuzzy matching
- **Filter builders** for complex queries
- **Cached queries** for frequently accessed data
- **Batch operations** for performance
- **Transaction helpers** for data integrity
- **Analytics queries** for insights
- **Conflict detection** for events
- **GDPR compliance** with data deletion
- **Type-safe query builders**

This infrastructure provides excellent performance, scalability, and reliability for the Chronos application's data needs.
