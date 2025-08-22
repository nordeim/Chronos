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
