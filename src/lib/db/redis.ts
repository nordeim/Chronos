// Additional features for chronos/src/lib/db/redis.ts
// Add these to the existing Redis implementation

// ===================================================================
// Advanced Caching Strategies
// ===================================================================

/**
 * Lazy cache loading with background refresh
 */
export async function cacheLazyLoad<T>(
  key: string,
  loader: () => Promise<T>,
  options: CacheOptions & { 
    staleTime?: number // Time before considering stale
    refreshInBackground?: boolean 
  } = {}
): Promise<T> {
  const redis = RedisManager.getInstance().getClient()
  const fullKey = `${REDIS_CONFIG.cache.keyPrefix}${key}`
  const metaKey = `${fullKey}:meta`
  
  try {
    // Try to get from cache
    const [cached, meta] = await Promise.all([
      redis.get(fullKey),
      redis.get(metaKey),
    ])
    
    if (cached) {
      const data = JSON.parse(cached) as T
      const metadata = meta ? JSON.parse(meta) : null
      
      // Check if stale
      if (metadata && options.staleTime) {
        const age = Date.now() - metadata.timestamp
        const isStale = age > options.staleTime * 1000
        
        if (isStale && options.refreshInBackground) {
          // Return stale data but refresh in background
          loader().then(fresh => {
            cacheSet(key, fresh, options)
          }).catch(console.error)
        }
      }
      
      return data
    }
    
    // Load fresh data
    const fresh = await loader()
    
    // Store with metadata
    await Promise.all([
      cacheSet(key, fresh, options),
      redis.setex(metaKey, options.ttl || REDIS_CONFIG.cache.defaultTTL, 
        JSON.stringify({ timestamp: Date.now() })
      ),
    ])
    
    return fresh
  } catch (error) {
    logger.error('Lazy cache load error', { key, error })
    return loader()
  }
}

/**
 * Write-through cache pattern
 */
export async function cacheWriteThrough<T>(
  key: string,
  value: T,
  writer: (value: T) => Promise<void>,
  options: CacheOptions = {}
): Promise<void> {
  // Write to database first
  await writer(value)
  
  // Then update cache
  await cacheSet(key, value, options)
}

/**
 * Write-behind cache pattern (with batching)
 */
class WriteBehindCache {
  private queue: Map<string, { value: any; timestamp: number }> = new Map()
  private flushInterval: NodeJS.Timeout | null = null
  
  constructor(
    private writer: (batch: Array<{ key: string; value: any }>) => Promise<void>,
    private options: {
      batchSize?: number
      flushIntervalMs?: number
      maxQueueSize?: number
    } = {}
  ) {
    this.startFlushing()
  }
  
  async write(key: string, value: any): Promise<void> {
    // Add to queue
    this.queue.set(key, { value, timestamp: Date.now() })
    
    // Write to cache immediately
    await cacheSet(key, value)
    
    // Check if we need to flush
    if (this.queue.size >= (this.options.batchSize || 100)) {
      await this.flush()
    }
  }
  
  private async flush(): Promise<void> {
    if (this.queue.size === 0) return
    
    const batch = Array.from(this.queue.entries()).map(([key, data]) => ({
      key,
      value: data.value,
    }))
    
    this.queue.clear()
    
    try {
      await this.writer(batch)
    } catch (error) {
      logger.error('Write-behind flush error', error)
      // Re-add to queue on failure
      batch.forEach(item => {
        this.queue.set(item.key, { value: item.value, timestamp: Date.now() })
      })
    }
  }
  
  private startFlushing(): void {
    const interval = this.options.flushIntervalMs || 5000
    this.flushInterval = setInterval(() => {
      this.flush().catch(console.error)
    }, interval)
  }
  
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    this.flush().catch(console.error)
  }
}

// ===================================================================
// Geo-spatial Functions
// ===================================================================

/**
 * Add location to geo index
 */
export async function geoAdd(
  key: string,
  longitude: number,
  latitude: number,
  member: string
): Promise<number> {
  const redis = RedisManager.getInstance().getClient()
  return redis.geoadd(key, longitude, latitude, member)
}

/**
 * Find nearby locations
 */
export async function geoRadius(
  key: string,
  longitude: number,
  latitude: number,
  radius: number,
  unit: 'm' | 'km' | 'mi' | 'ft' = 'km',
  options: {
    withCoord?: boolean
    withDist?: boolean
    withHash?: boolean
    count?: number
    sort?: 'ASC' | 'DESC'
  } = {}
): Promise<Array<{ member: string; dist?: number; coord?: [number, number] }>> {
  const redis = RedisManager.getInstance().getClient()
  const args: any[] = [key, longitude, latitude, radius, unit]
  
  if (options.withCoord) args.push('WITHCOORD')
  if (options.withDist) args.push('WITHDIST')
  if (options.withHash) args.push('WITHHASH')
  if (options.count) args.push('COUNT', options.count)
  if (options.sort) args.push(options.sort)
  
  const results = await redis.georadius(...args)
  
  // Parse results based on options
  return results.map((result: any) => {
    if (typeof result === 'string') {
      return { member: result }
    }
    
    const parsed: any = { member: result[0] }
    let index = 1
    
    if (options.withDist) {
      parsed.dist = parseFloat(result[index])
      index++
    }
    
    if (options.withCoord) {
      parsed.coord = result[index].map(parseFloat)
    }
    
    return parsed
  })
}

// ===================================================================
// HyperLogLog Functions (for unique counting)
// ===================================================================

/**
 * Add items to HyperLogLog
 */
export async function hyperlogAdd(key: string, ...items: string[]): Promise<number> {
  const redis = RedisManager.getInstance().getClient()
  return redis.pfadd(key, ...items)
}

/**
 * Get HyperLogLog count
 */
export async function hyperlogCount(...keys: string[]): Promise<number> {
  const redis = RedisManager.getInstance().getClient()
  return redis.pfcount(...keys)
}

/**
 * Merge HyperLogLogs
 */
export async function hyperlogMerge(destKey: string, ...sourceKeys: string[]): Promise<void> {
  const redis = RedisManager.getInstance().getClient()
  await redis.pfmerge(destKey, ...sourceKeys)
}

// ===================================================================
// Stream Functions (for event sourcing)
// ===================================================================

/**
 * Add event to stream
 */
export async function streamAdd(
  stream: string,
  event: Record<string, any>,
  options: {
    maxLength?: number
    id?: string
  } = {}
): Promise<string> {
  const redis = RedisManager.getInstance().getClient()
  const args: any[] = [stream]
  
  if (options.maxLength) {
    args.push('MAXLEN', '~', options.maxLength)
  }
  
  args.push(options.id || '*')
  
  // Flatten event object into field-value pairs
  Object.entries(event).forEach(([field, value]) => {
    args.push(field, JSON.stringify(value))
  })
  
  return redis.xadd(...args)
}

/**
 * Read from stream
 */
export async function streamRead(
  stream: string,
  options: {
    count?: number
    block?: number
    lastId?: string
  } = {}
): Promise<Array<{ id: string; data: Record<string, any> }>> {
  const redis = RedisManager.getInstance().getClient()
  const lastId = options.lastId || '$'
  
  const args: any[] = []
  if (options.count) args.push('COUNT', options.count)
  if (options.block !== undefined) args.push('BLOCK', options.block)
  args.push('STREAMS', stream, lastId)
  
  const results = await redis.xread(...args)
  
  if (!results || results.length === 0) return []
  
  const [, messages] = results[0]
  
  return messages.map(([id, fields]: [string, string[]]) => {
    const data: Record<string, any> = {}
    
    for (let i = 0; i < fields.length; i += 2) {
      const field = fields[i]
      const value = fields[i + 1]
      
      try {
        data[field] = JSON.parse(value)
      } catch {
        data[field] = value
      }
    }
    
    return { id, data }
  })
}

// ===================================================================
// Sorted Set Functions (for leaderboards, rankings)
// ===================================================================

/**
 * Add to sorted set with score
 */
export async function sortedSetAdd(
  key: string,
  score: number,
  member: string
): Promise<number> {
  const redis = RedisManager.getInstance().getClient()
  return redis.zadd(key, score, member)
}

/**
 * Get rank in sorted set
 */
export async function sortedSetRank(
  key: string,
  member: string,
  reverse: boolean = false
): Promise<number | null> {
  const redis = RedisManager.getInstance().getClient()
  const rank = reverse 
    ? await redis.zrevrank(key, member)
    : await redis.zrank(key, member)
  
  return rank !== null ? rank + 1 : null // Convert to 1-based ranking
}

/**
 * Get top N from sorted set
 */
export async function sortedSetTop(
  key: string,
  count: number,
  options: {
    withScores?: boolean
    reverse?: boolean
  } = {}
): Promise<Array<{ member: string; score?: number; rank?: number }>> {
  const redis = RedisManager.getInstance().getClient()
  
  const results = options.reverse
    ? await redis.zrevrange(key, 0, count - 1, options.withScores ? 'WITHSCORES' : undefined)
    : await redis.zrange(key, 0, count - 1, options.withScores ? 'WITHSCORES' : undefined)
  
  if (!options.withScores) {
    return results.map((member: string, index: number) => ({
      member,
      rank: index + 1,
    }))
  }
  
  const parsed: Array<{ member: string; score: number; rank: number }> = []
  for (let i = 0; i < results.length; i += 2) {
    parsed.push({
      member: results[i],
      score: parseFloat(results[i + 1]),
      rank: Math.floor(i / 2) + 1,
    })
  }
  
  return parsed
}

// Export enhanced manager
export { WriteBehindCache }
