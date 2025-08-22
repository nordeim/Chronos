// Additional advanced features for chronos/src/lib/db/queries.ts
// Add these to the existing queries implementation

// ===================================================================
// Advanced Query Patterns
// ===================================================================

/**
 * Cursor-based pagination for large datasets
 */
export async function paginateWithCursor<T>(
  model: any,
  options: {
    where?: any
    orderBy?: any
    take?: number
    cursor?: string
    include?: any
  }
): Promise<{
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}> {
  const take = options.take || 20
  const cursor = options.cursor
  
  const query: any = {
    take: take + 1, // Fetch one extra to check if there's more
    where: options.where,
    orderBy: options.orderBy || { createdAt: 'desc' },
    include: options.include,
  }
  
  if (cursor) {
    query.cursor = { id: cursor }
    query.skip = 1 // Skip the cursor item
  }
  
  const items = await model.findMany(query)
  
  const hasMore = items.length > take
  const data = hasMore ? items.slice(0, -1) : items
  const nextCursor = hasMore ? data[data.length - 1].id : null
  
  return {
    data,
    nextCursor,
    hasMore,
  }
}

/**
 * Full-text search with ranking
 */
export async function fullTextSearch(
  table: string,
  searchQuery: string,
  options: {
    fields: string[]
    limit?: number
    threshold?: number
  }
): Promise<Array<{ id: string; score: number; data: any }>> {
  const searchVector = options.fields.map(f => `to_tsvector('english', ${f})`).join(' || ')
  const query = `
    SELECT 
      *,
      ts_rank(${searchVector}, query) as score
    FROM 
      ${table},
      plainto_tsquery('english', $1) query
    WHERE 
      ${searchVector} @@ query
      ${options.threshold ? `AND ts_rank(${searchVector}, query) > ${options.threshold}` : ''}
    ORDER BY 
      score DESC
    LIMIT $2
  `
  
  const results = await prisma.$queryRawUnsafe(query, searchQuery, options.limit || 50)
  
  return results as any[]
}

/**
 * Batch upsert with conflict resolution
 */
export async function batchUpsert<T>(
  model: any,
  data: T[],
  uniqueFields: string[],
  updateFields: string[]
): Promise<number> {
  if (data.length === 0) return 0
  
  const operations = data.map(item => 
    model.upsert({
      where: uniqueFields.reduce((acc, field) => ({
        ...acc,
        [field]: (item as any)[field],
      }), {}),
      update: updateFields.reduce((acc, field) => ({
        ...acc,
        [field]: (item as any)[field],
      }), {}),
      create: item,
    })
  )
  
  const results = await prisma.$transaction(operations)
  return results.length
}

/**
 * Optimistic locking for concurrent updates
 */
export async function updateWithOptimisticLock<T>(
  model: any,
  id: string,
  version: number,
  updateData: any
): Promise<T | null> {
  try {
    const result = await model.update({
      where: {
        id,
        version, // Version must match
      },
      data: {
        ...updateData,
        version: { increment: 1 }, // Increment version
      },
    })
    
    return result
  } catch (error) {
    if (error.code === 'P2025') {
      // Record not found or version mismatch
      return null
    }
    throw error
  }
}

/**
 * Graph traversal query for hierarchical data
 */
export async function getDescendants(
  table: string,
  rootId: string,
  options: {
    maxDepth?: number
    includeRoot?: boolean
  } = {}
): Promise<any[]> {
  const maxDepth = options.maxDepth || 10
  const includeRoot = options.includeRoot ?? true
  
  const query = `
    WITH RECURSIVE descendants AS (
      SELECT *, 0 as depth
      FROM ${table}
      WHERE id = $1
      
      UNION ALL
      
      SELECT t.*, d.depth + 1
      FROM ${table} t
      INNER JOIN descendants d ON t.parent_id = d.id
      WHERE d.depth < $2
    )
    SELECT * FROM descendants
    ${!includeRoot ? 'WHERE depth > 0' : ''}
    ORDER BY depth, created_at
  `
  
  return prisma.$queryRawUnsafe(query, rootId, maxDepth)
}

/**
 * Window function for running totals/rankings
 */
export async function getRunningTotals(
  userId: string,
  dateRange: TimeRange
): Promise<Array<{
  date: Date
  value: number
  runningTotal: number
  rank: number
}>> {
  const query = `
    SELECT 
      date,
      value,
      SUM(value) OVER (ORDER BY date) as running_total,
      RANK() OVER (ORDER BY value DESC) as rank
    FROM (
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as value
      FROM tasks
      WHERE 
        user_id = $1 
        AND created_at BETWEEN $2 AND $3
        AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
    ) daily_totals
    ORDER BY date
  `
  
  return prisma.$queryRawUnsafe(
    query,
    userId,
    dateRange.start,
    dateRange.end
  )
}

// ===================================================================
// Performance Monitoring
// ===================================================================

/**
 * Query with execution plan analysis
 */
export async function analyzeQuery(sql: string, params: any[] = []): Promise<{
  result: any[]
  plan: any
  executionTime: number
}> {
  const startTime = performance.now()
  
  // Get execution plan
  const planQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`
  const [plan] = await prisma.$queryRawUnsafe(planQuery, ...params)
  
  // Execute actual query
  const result = await prisma.$queryRawUnsafe(sql, ...params)
  
  const executionTime = performance.now() - startTime
  
  return {
    result,
    plan: plan['QUERY PLAN'],
    executionTime,
  }
}

/**
 * Index usage statistics
 */
export async function getIndexUsageStats(tableName: string): Promise<any[]> {
  const query = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan as index_scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size
    FROM pg_stat_user_indexes
    WHERE tablename = $1
    ORDER BY idx_scan DESC
  `
  
  return prisma.$queryRawUnsafe(query, tableName)
}

// ===================================================================
// Data Aggregation
// ===================================================================

/**
 * Time-series aggregation with gap filling
 */
export async function getTimeSeriesData(
  userId: string,
  metric: 'events' | 'tasks' | 'focus_time',
  range: TimeRange,
  interval: 'hour' | 'day' | 'week' | 'month'
): Promise<Array<{ timestamp: Date; value: number }>> {
  const intervalExpression = {
    hour: "date_trunc('hour', created_at)",
    day: "date_trunc('day', created_at)",
    week: "date_trunc('week', created_at)",
    month: "date_trunc('month', created_at)",
  }[interval]
  
  const table = {
    events: 'events',
    tasks: 'tasks',
    focus_time: 'focus_sessions',
  }[metric]
  
  const valueExpression = metric === 'focus_time' 
    ? 'SUM(actual_duration) / 3600.0' // Convert to hours
    : 'COUNT(*)'
  
  const query = `
    WITH time_series AS (
      SELECT generate_series(
        date_trunc('${interval}', $2::timestamp),
        date_trunc('${interval}', $3::timestamp),
        '1 ${interval}'::interval
      ) AS timestamp
    ),
    data AS (
      SELECT 
        ${intervalExpression} as timestamp,
        ${valueExpression} as value
      FROM ${table}
      WHERE 
        user_id = $1
        AND created_at BETWEEN $2 AND $3
        AND deleted_at IS NULL
      GROUP BY ${intervalExpression}
    )
    SELECT 
      ts.timestamp,
      COALESCE(d.value, 0) as value
    FROM time_series ts
    LEFT JOIN data d ON ts.timestamp = d.timestamp
    ORDER BY ts.timestamp
  `
  
  return prisma.$queryRawUnsafe(query, userId, range.start, range.end)
}

/**
 * Multi-dimensional aggregation
 */
export async function getMultiDimensionalStats(
  userId: string,
  dimensions: string[],
  measures: Array<{ field: string; aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' }>,
  filters: Record<string, any> = {}
): Promise<any[]> {
  const groupBy = dimensions.join(', ')
  const selectClauses = [
    ...dimensions,
    ...measures.map(m => `${m.aggregation}(${m.field}) as ${m.field}_${m.aggregation}`),
  ]
  
  const whereConditions = ['user_id = $1', 'deleted_at IS NULL']
  const params = [userId]
  
  Object.entries(filters).forEach(([key, value], index) => {
    whereConditions.push(`${key} = $${index + 2}`)
    params.push(value)
  })
  
  const query = `
    SELECT ${selectClauses.join(', ')}
    FROM tasks
    WHERE ${whereConditions.join(' AND ')}
    GROUP BY ${groupBy}
    ORDER BY ${groupBy}
  `
  
  return prisma.$queryRawUnsafe(query, ...params)
}

// ===================================================================
// Export Enhanced Queries
// ===================================================================

export const advancedQueries = {
  // Pagination
  paginateWithCursor,
  
  // Search
  fullTextSearch,
  
  // Batch operations
  batchUpsert,
  
  // Concurrency
  updateWithOptimisticLock,
  
  // Hierarchical data
  getDescendants,
  
  // Analytics
  getRunningTotals,
  getTimeSeriesData,
  getMultiDimensionalStats,
  
  // Performance
  analyzeQuery,
  getIndexUsageStats,
}
