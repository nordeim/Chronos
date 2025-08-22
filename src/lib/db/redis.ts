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
