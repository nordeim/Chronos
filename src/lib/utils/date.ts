// chronos/src/lib/utils/date.ts
import {
  format,
  parse,
  parseISO,
  isValid,
  isBefore,
  isAfter,
  isEqual,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
  isToday,
  isTomorrow,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  isPast,
  isFuture,
  isWithinInterval,
  isWeekend,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  addHours,
  addMinutes,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  subHours,
  subMinutes,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  startOfHour,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  endOfHour,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  getDay,
  getDate,
  getMonth,
  getYear,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  formatDistance,
  formatDistanceToNow,
  formatDuration,
  intervalToDuration,
  min,
  max,
  isDate,
} from 'date-fns'
import {
  utcToZonedTime,
  zonedTimeToUtc,
  formatInTimeZone,
  getTimezoneOffset,
} from 'date-fns-tz'
import { enUS, es, fr, de, ja, zhCN } from 'date-fns/locale'
import { RRule, RRuleSet, rrulestr } from 'rrule'

// ===================================================================
// Type Declarations
// ===================================================================

export interface TimeRange {
  start: Date
  end: Date
}

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  duration: number // in minutes
}

export interface WorkingHours {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  isWorkingDay: boolean
}

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval?: number
  count?: number
  until?: Date
  byDay?: string[] // MO, TU, WE, TH, FR, SA, SU
  byMonth?: number[]
  byMonthDay?: number[]
  bySetPos?: number[]
}

export interface Holiday {
  date: Date
  name: string
  type: 'PUBLIC' | 'BANK' | 'OBSERVANCE'
  country?: string
}

export interface DateFormatOptions {
  locale?: Locale
  timezone?: string
  format?: string
  relative?: boolean
}

export interface CalendarWeek {
  weekNumber: number
  year: number
  days: Date[]
  startDate: Date
  endDate: Date
}

export interface MonthCalendar {
  month: number
  year: number
  weeks: CalendarWeek[]
  startDate: Date
  endDate: Date
  totalDays: number
}

// ===================================================================
// Configuration
// ===================================================================

const DATE_CONFIG = {
  defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  defaultLocale: enUS,
  defaultDateFormat: 'MMM dd, yyyy',
  defaultTimeFormat: 'h:mm a',
  defaultDateTimeFormat: 'MMM dd, yyyy h:mm a',
  weekStartsOn: 0 as const, // Sunday
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  workingHours: {
    start: '09:00',
    end: '17:00',
  },
  timeSlotDuration: 30, // minutes
  businessHoursOnly: false,
} as const

// Locale mapping
const LOCALES: Record<string, Locale> = {
  'en': enUS,
  'en-US': enUS,
  'es': es,
  'es-ES': es,
  'fr': fr,
  'fr-FR': fr,
  'de': de,
  'de-DE': de,
  'ja': ja,
  'ja-JP': ja,
  'zh': zhCN,
  'zh-CN': zhCN,
}

// Common date formats
export const DATE_FORMATS = {
  date: {
    short: 'MM/dd/yy',
    medium: 'MMM dd, yyyy',
    long: 'MMMM dd, yyyy',
    full: 'EEEE, MMMM dd, yyyy',
    iso: 'yyyy-MM-dd',
    compact: 'MMM dd',
    numeric: 'MM/dd/yyyy',
  },
  time: {
    short: 'h:mm a',
    medium: 'h:mm:ss a',
    long: 'h:mm:ss a zzz',
    military: 'HH:mm',
    iso: 'HH:mm:ss',
  },
  dateTime: {
    short: 'MM/dd/yy h:mm a',
    medium: 'MMM dd, yyyy h:mm a',
    long: 'MMMM dd, yyyy h:mm:ss a',
    full: 'EEEE, MMMM dd, yyyy h:mm:ss a zzz',
    iso: "yyyy-MM-dd'T'HH:mm:ss",
    isoWithTz: "yyyy-MM-dd'T'HH:mm:ssXXX",
  },
} as const

// ===================================================================
// Core Date Functions
// ===================================================================

/**
 * Format date with timezone support
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string = DATE_CONFIG.defaultDateFormat,
  options: DateFormatOptions = {}
): string {
  const d = normalizeDate(date)
  if (!isValid(d)) return 'Invalid Date'

  const { locale = DATE_CONFIG.defaultLocale, timezone } = options

  if (timezone) {
    return formatInTimeZone(d, timezone, formatStr, { locale })
  }

  return format(d, formatStr, { locale })
}

/**
 * Format date as relative time
 */
export function formatRelativeTime(
  date: Date | string | number,
  baseDate: Date = new Date(),
  options: { locale?: Locale; addSuffix?: boolean } = {}
): string {
  const d = normalizeDate(date)
  if (!isValid(d)) return 'Invalid Date'

  const { locale = DATE_CONFIG.defaultLocale, addSuffix = true } = options

  // Special cases for common relative times
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'

  // Use date-fns formatDistance for other cases
  return formatDistance(d, baseDate, { locale, addSuffix })
}

/**
 * Smart date formatter - chooses format based on context
 */
export function formatSmartDate(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const d = normalizeDate(date)
  if (!isValid(d)) return 'Invalid Date'

  const now = new Date()

  // Today: show time only
  if (isSameDay(d, now)) {
    return `Today at ${formatDate(d, DATE_FORMATS.time.short, options)}`
  }

  // Yesterday
  if (isYesterday(d)) {
    return `Yesterday at ${formatDate(d, DATE_FORMATS.time.short, options)}`
  }

  // Tomorrow
  if (isTomorrow(d)) {
    return `Tomorrow at ${formatDate(d, DATE_FORMATS.time.short, options)}`
  }

  // This week: show day name
  if (isThisWeek(d, { weekStartsOn: DATE_CONFIG.weekStartsOn })) {
    return formatDate(d, 'EEEE h:mm a', options)
  }

  // This year: show month and day
  if (isThisYear(d)) {
    return formatDate(d, 'MMM dd, h:mm a', options)
  }

  // Other: show full date
  return formatDate(d, DATE_FORMATS.dateTime.medium, options)
}

/**
 * Parse date from string with multiple format attempts
 */
export function parseDate(
  dateString: string,
  formats?: string[],
  options: { locale?: Locale; timezone?: string } = {}
): Date | null {
  if (!dateString) return null

  const { locale = DATE_CONFIG.defaultLocale, timezone } = options

  // Try ISO format first
  try {
    const isoDate = parseISO(dateString)
    if (isValid(isoDate)) {
      return timezone ? utcToZonedTime(isoDate, timezone) : isoDate
    }
  } catch {}

  // Try provided formats
  const formatsToTry = formats || [
    DATE_FORMATS.dateTime.iso,
    DATE_FORMATS.date.iso,
    DATE_FORMATS.date.numeric,
    DATE_FORMATS.date.medium,
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'yyyy/MM/dd',
  ]

  for (const fmt of formatsToTry) {
    try {
      const parsed = parse(dateString, fmt, new Date(), { locale })
      if (isValid(parsed)) {
        return timezone ? utcToZonedTime(parsed, timezone) : parsed
      }
    } catch {}
  }

  // Try native Date constructor as last resort
  try {
    const nativeDate = new Date(dateString)
    if (isValid(nativeDate)) {
      return timezone ? utcToZonedTime(nativeDate, timezone) : nativeDate
    }
  } catch {}

  return null
}

/**
 * Normalize date input to Date object
 */
export function normalizeDate(date: Date | string | number | null | undefined): Date {
  if (!date) return new Date()
  if (isDate(date)) return date as Date
  if (typeof date === 'string') return parseDate(date) || new Date()
  if (typeof date === 'number') return new Date(date)
  return new Date()
}

// ===================================================================
// Date Range Functions
// ===================================================================

/**
 * Create date range
 */
export function createDateRange(start: Date, end: Date): TimeRange {
  return {
    start: min([start, end]),
    end: max([start, end]),
  }
}

/**
 * Check if date is within range
 */
export function isDateInRange(date: Date, range: TimeRange): boolean {
  return isWithinInterval(date, { start: range.start, end: range.end })
}

/**
 * Get overlapping range
 */
export function getOverlappingRange(
  range1: TimeRange,
  range2: TimeRange
): TimeRange | null {
  const start = max([range1.start, range2.start])
  const end = min([range1.end, range2.end])

  if (isAfter(start, end)) return null

  return { start, end }
}

/**
 * Check if ranges overlap
 */
export function doRangesOverlap(range1: TimeRange, range2: TimeRange): boolean {
  return getOverlappingRange(range1, range2) !== null
}

/**
 * Merge overlapping ranges
 */
export function mergeRanges(ranges: TimeRange[]): TimeRange[] {
  if (ranges.length <= 1) return ranges

  // Sort ranges by start date
  const sorted = [...ranges].sort((a, b) => a.start.getTime() - b.start.getTime())
  const merged: TimeRange[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]

    if (doRangesOverlap(last, current)) {
      // Merge ranges
      last.end = max([last.end, current.end])
    } else {
      merged.push(current)
    }
  }

  return merged
}

/**
 * Split range into intervals
 */
export function splitRange(
  range: TimeRange,
  intervalMinutes: number
): TimeRange[] {
  const intervals: TimeRange[] = []
  let current = range.start

  while (isBefore(current, range.end)) {
    const intervalEnd = addMinutes(current, intervalMinutes)
    const end = min([intervalEnd, range.end])
    
    intervals.push({
      start: current,
      end,
    })

    current = intervalEnd
  }

  return intervals
}

// ===================================================================
// Business Day Functions
// ===================================================================

/**
 * Check if date is a business day
 */
export function isBusinessDay(
  date: Date,
  options: {
    workingDays?: number[]
    holidays?: Holiday[]
  } = {}
): boolean {
  const { workingDays = DATE_CONFIG.workingDays, holidays = [] } = options

  // Check if it's a weekend
  const dayOfWeek = getDay(date)
  if (!workingDays.includes(dayOfWeek)) return false

  // Check if it's a holiday
  const isHoliday = holidays.some(holiday =>
    isSameDay(holiday.date, date) && holiday.type !== 'OBSERVANCE'
  )

  return !isHoliday
}

/**
 * Get next business day
 */
export function getNextBusinessDay(
  date: Date,
  options: {
    workingDays?: number[]
    holidays?: Holiday[]
  } = {}
): Date {
  let nextDay = addDays(date, 1)

  while (!isBusinessDay(nextDay, options)) {
    nextDay = addDays(nextDay, 1)
  }

  return nextDay
}

/**
 * Get previous business day
 */
export function getPreviousBusinessDay(
  date: Date,
  options: {
    workingDays?: number[]
    holidays?: Holiday[]
  } = {}
): Date {
  let prevDay = subDays(date, 1)

  while (!isBusinessDay(prevDay, options)) {
    prevDay = subDays(prevDay, 1)
  }

  return prevDay
}

/**
 * Add business days
 */
export function addBusinessDays(
  date: Date,
  days: number,
  options: {
    workingDays?: number[]
    holidays?: Holiday[]
  } = {}
): Date {
  let current = date
  let remainingDays = Math.abs(days)
  const direction = days > 0 ? 1 : -1

  while (remainingDays > 0) {
    current = addDays(current, direction)
    if (isBusinessDay(current, options)) {
      remainingDays--
    }
  }

  return current
}

/**
 * Get business days between dates
 */
export function getBusinessDaysBetween(
  start: Date,
  end: Date,
  options: {
    workingDays?: number[]
    holidays?: Holiday[]
  } = {}
): number {
  let count = 0
  const dates = eachDayOfInterval({ start, end })

  for (const date of dates) {
    if (isBusinessDay(date, options)) {
      count++
    }
  }

  return count
}

// ===================================================================
// Calendar Functions
// ===================================================================

/**
 * Get calendar month view
 */
export function getCalendarMonth(
  year: number,
  month: number,
  options: {
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    showOutsideDays?: boolean
  } = {}
): MonthCalendar {
  const { weekStartsOn = DATE_CONFIG.weekStartsOn, showOutsideDays = true } = options

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = endOfMonth(firstDayOfMonth)

  const calendarStart = showOutsideDays
    ? startOfWeek(firstDayOfMonth, { weekStartsOn })
    : firstDayOfMonth

  const calendarEnd = showOutsideDays
    ? endOfWeek(lastDayOfMonth, { weekStartsOn })
    : lastDayOfMonth

  const weeks: CalendarWeek[] = []
  const weeksInMonth = eachWeekOfInterval(
    { start: calendarStart, end: calendarEnd },
    { weekStartsOn }
  )

  weeksInMonth.forEach((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    weeks.push({
      weekNumber: index + 1,
      year,
      days,
      startDate: weekStart,
      endDate: weekEnd,
    })
  })

  return {
    month,
    year,
    weeks,
    startDate: calendarStart,
    endDate: calendarEnd,
    totalDays: differenceInDays(calendarEnd, calendarStart) + 1,
  }
}

/**
 * Get week of year
 */
export function getWeekOfYear(date: Date): number {
  const startOfYearDate = startOfYear(date)
  const startOfYearWeek = startOfWeek(startOfYearDate, {
    weekStartsOn: DATE_CONFIG.weekStartsOn,
  })
  const currentWeek = startOfWeek(date, {
    weekStartsOn: DATE_CONFIG.weekStartsOn,
  })

  return Math.floor(differenceInWeeks(currentWeek, startOfYearWeek)) + 1
}

/**
 * Get dates for week view
 */
export function getWeekDates(
  date: Date,
  options: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 } = {}
): Date[] {
  const { weekStartsOn = DATE_CONFIG.weekStartsOn } = options
  const weekStart = startOfWeek(date, { weekStartsOn })
  const weekEnd = endOfWeek(date, { weekStartsOn })

  return eachDayOfInterval({ start: weekStart, end: weekEnd })
}

// ===================================================================
// Time Slot Functions
// ===================================================================

/**
 * Generate time slots for a day
 */
export function generateTimeSlots(
  date: Date,
  options: {
    slotDuration?: number // minutes
    startTime?: string // HH:mm
    endTime?: string // HH:mm
    excludeRanges?: TimeRange[]
    businessHoursOnly?: boolean
  } = {}
): TimeSlot[] {
  const {
    slotDuration = DATE_CONFIG.timeSlotDuration,
    startTime = DATE_CONFIG.workingHours.start,
    endTime = DATE_CONFIG.workingHours.end,
    excludeRanges = [],
    businessHoursOnly = DATE_CONFIG.businessHoursOnly,
  } = options

  const slots: TimeSlot[] = []
  const dayStart = startOfDay(date)
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  let current = setMinutes(setHours(dayStart, startHour), startMinute)
  const dayEnd = setMinutes(setHours(dayStart, endHour), endMinute)

  while (isBefore(current, dayEnd)) {
    const slotEnd = addMinutes(current, slotDuration)

    const slot: TimeSlot = {
      start: current,
      end: slotEnd,
      available: true,
      duration: slotDuration,
    }

    // Check if slot overlaps with excluded ranges
    for (const range of excludeRanges) {
      if (doRangesOverlap({ start: current, end: slotEnd }, range)) {
        slot.available = false
        break
      }
    }

    // Check business hours
    if (businessHoursOnly && !isBusinessDay(date)) {
      slot.available = false
    }

    slots.push(slot)
    current = slotEnd
  }

  return slots
}

/**
 * Find available time slots
 */
export function findAvailableSlots(
  range: TimeRange,
  busyRanges: TimeRange[],
  options: {
    slotDuration?: number
    minDuration?: number
    maxResults?: number
  } = {}
): TimeSlot[] {
  const {
    slotDuration = DATE_CONFIG.timeSlotDuration,
    minDuration = slotDuration,
    maxResults = 100,
  } = options

  const availableSlots: TimeSlot[] = []
  const mergedBusy = mergeRanges(busyRanges)
  
  // Generate all possible slots
  const allSlots = splitRange(range, slotDuration)

  for (const slot of allSlots) {
    let isAvailable = true

    // Check if slot overlaps with any busy range
    for (const busy of mergedBusy) {
      if (doRangesOverlap(slot, busy)) {
        isAvailable = false
        break
      }
    }

    if (isAvailable) {
      availableSlots.push({
        ...slot,
        available: true,
        duration: differenceInMinutes(slot.end, slot.start),
      })

      if (availableSlots.length >= maxResults) break
    }
  }

  // Filter by minimum duration
  return availableSlots.filter(slot => slot.duration >= minDuration)
}

// ===================================================================
// Recurring Event Functions
// ===================================================================

/**
 * Parse RRULE string
 */
export function parseRecurrenceRule(rruleString: string): RRule | null {
  try {
    return rrulestr(rruleString) as RRule
  } catch (error) {
    console.error('Failed to parse RRULE:', error)
    return null
  }
}

/**
 * Create RRULE from options
 */
export function createRecurrenceRule(options: RecurrenceRule): RRule {
  const rruleOptions: any = {
    freq: RRule[options.frequency],
    interval: options.interval || 1,
  }

  if (options.count) rruleOptions.count = options.count
  if (options.until) rruleOptions.until = options.until

  if (options.byDay) {
    rruleOptions.byweekday = options.byDay.map(day => RRule[day])
  }

  if (options.byMonth) rruleOptions.bymonth = options.byMonth
  if (options.byMonthDay) rruleOptions.bymonthday = options.byMonthDay
  if (options.bySetPos) rruleOptions.bysetpos = options.bySetPos

  return new RRule(rruleOptions)
}

/**
 * Get occurrences of recurring event
 */
export function getRecurrenceOccurrences(
  rule: RRule | string,
  range: TimeRange,
  options: {
    maxOccurrences?: number
    excludeDates?: Date[]
  } = {}
): Date[] {
  const { maxOccurrences = 100, excludeDates = [] } = options

  const rrule = typeof rule === 'string' ? parseRecurrenceRule(rule) : rule
  if (!rrule) return []

  const occurrences = rrule.between(
    range.start,
    range.end,
    true,
    (date, i) => i < maxOccurrences
  )

  // Filter out excluded dates
  return occurrences.filter(
    date => !excludeDates.some(excluded => isSameDay(date, excluded))
  )
}

/**
 * Get human-readable recurrence description
 */
export function getRecurrenceDescription(rule: RRule | string): string {
  const rrule = typeof rule === 'string' ? parseRecurrenceRule(rule) : rule
  if (!rrule) return 'Does not repeat'

  return rrule.toText()
}

// ===================================================================
// Duration Functions
// ===================================================================

/**
 * Format duration in human-readable format
 */
export function formatHumanDuration(
  duration: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' = 'minutes'
): string {
  let totalMinutes = duration

  // Convert to minutes based on unit
  switch (unit) {
    case 'seconds':
      totalMinutes = duration / 60
      break
    case 'hours':
      totalMinutes = duration * 60
      break
    case 'days':
      totalMinutes = duration * 24 * 60
      break
  }

  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = Math.floor(totalMinutes % 60)

  const parts: string[] = []

  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
  }

  return parts.join(', ')
}

/**
 * Calculate working hours between dates
 */
export function calculateWorkingHours(
  start: Date,
  end: Date,
  options: {
    workingHours?: { start: string; end: string }
    workingDays?: number[]
    holidays?: Holiday[]
  } = {}
): number {
  const {
    workingHours = DATE_CONFIG.workingHours,
    workingDays = DATE_CONFIG.workingDays,
    holidays = [],
  } = options

  let totalMinutes = 0
  const dates = eachDayOfInterval({ start, end })

  for (const date of dates) {
    if (!isBusinessDay(date, { workingDays, holidays })) continue

    const [startHour, startMinute] = workingHours.start.split(':').map(Number)
    const [endHour, endMinute] = workingHours.end.split(':').map(Number)

    const dayStart = setMinutes(setHours(startOfDay(date), startHour), startMinute)
    const dayEnd = setMinutes(setHours(startOfDay(date), endHour), endMinute)

    // Calculate overlap with working hours
    const overlapStart = max([dayStart, start])
    const overlapEnd = min([dayEnd, end])

    if (isBefore(overlapStart, overlapEnd)) {
      totalMinutes += differenceInMinutes(overlapEnd, overlapStart)
    }
  }

  return totalMinutes / 60 // Return hours
}

// ===================================================================
// Timezone Functions
// ===================================================================

/**
 * Convert date to timezone
 */
export function convertToTimezone(
  date: Date,
  timezone: string,
  fromTimezone?: string
): Date {
  if (fromTimezone) {
    const utcDate = zonedTimeToUtc(date, fromTimezone)
    return utcToZonedTime(utcDate, timezone)
  }
  return utcToZonedTime(date, timezone)
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffsetHours(timezone: string, date: Date = new Date()): number {
  return getTimezoneOffset(timezone, date) / (1000 * 60 * 60)
}

/**
 * Get list of common timezones
 */
export function getCommonTimezones(): Array<{ value: string; label: string; offset: string }> {
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Australia/Sydney',
    'Pacific/Auckland',
  ]

  return timezones.map(tz => {
    const offset = getTimezoneOffsetHours(tz)
    const sign = offset >= 0 ? '+' : '-'
    const absOffset = Math.abs(offset)
    const hours = Math.floor(absOffset)
    const minutes = (absOffset - hours) * 60

    return {
      value: tz,
      label: tz.replace(/_/g, ' ').replace(/\//g, ' / '),
      offset: `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`,
    }
  })
}

// ===================================================================
// Validation Functions
// ===================================================================

/**
 * Validate date string
 */
export function isValidDateString(dateString: string, format?: string): boolean {
  if (!dateString) return false

  if (format) {
    const parsed = parse(dateString, format, new Date())
    return isValid(parsed)
  }

  const parsed = parseDate(dateString)
  return parsed !== null && isValid(parsed)
}

/**
 * Validate time string (HH:mm format)
 */
export function isValidTimeString(timeString: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(timeString)
}

/**
 * Validate date range
 */
export function isValidDateRange(range: TimeRange): boolean {
  return (
    isValid(range.start) &&
    isValid(range.end) &&
    !isAfter(range.start, range.end)
  )
}

// ===================================================================
// Utility Functions
// ===================================================================

/**
 * Get ordinal suffix for day
 */
export function getDayOrdinal(day: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const remainder = day % 100

  return (
    day +
    (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0])
  )
}

/**
 * Get days in month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Get month name
 */
export function getMonthName(
  month: number,
  options: { locale?: Locale; format?: 'long' | 'short' } = {}
): string {
  const { locale = DATE_CONFIG.defaultLocale, format: fmt = 'long' } = options
  const date = new Date(2000, month, 1)
  const formatStr = fmt === 'long' ? 'MMMM' : 'MMM'
  return format(date, formatStr, { locale })
}

/**
 * Get weekday name
 */
export function getWeekdayName(
  dayOfWeek: number,
  options: { locale?: Locale; format?: 'long' | 'short' } = {}
): string {
  const { locale = DATE_CONFIG.defaultLocale, format: fmt = 'long' } = options
  const date = new Date(2024, 0, dayOfWeek) // January 2024 starts on Monday
  const formatStr = fmt === 'long' ? 'EEEE' : 'EEE'
  return format(date, formatStr, { locale })
}

/**
 * Clone date
 */
export function cloneDate(date: Date): Date {
  return new Date(date.getTime())
}

/**
 * Reset time to midnight
 */
export function resetTime(date: Date): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(date, 0), 0), 0), 0)
}

/**
 * Combine date and time
 */
export function combineDateAndTime(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  return setMinutes(setHours(startOfDay(date), hours), minutes)
}

/**
 * Get age from birthdate
 */
export function getAge(birthDate: Date): number {
  const today = new Date()
  let age = differenceInYears(today, birthDate)
  
  const thisYearBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  )
  
  if (isAfter(thisYearBirthday, today)) {
    age--
  }
  
  return age
}

// ===================================================================
// Export Helper Collections
// ===================================================================

export const dateUtils = {
  // Formatting
  formatDate,
  formatRelativeTime,
  formatSmartDate,
  formatHumanDuration,
  
  // Parsing
  parseDate,
  normalizeDate,
  parseRecurrenceRule,
  
  // Ranges
  createDateRange,
  isDateInRange,
  doRangesOverlap,
  mergeRanges,
  splitRange,
  
  // Business days
  isBusinessDay,
  getNextBusinessDay,
  getPreviousBusinessDay,
  addBusinessDays,
  getBusinessDaysBetween,
  calculateWorkingHours,
  
  // Calendar
  getCalendarMonth,
  getWeekOfYear,
  getWeekDates,
  
  // Time slots
  generateTimeSlots,
  findAvailableSlots,
  
  // Recurring events
  createRecurrenceRule,
  getRecurrenceOccurrences,
  getRecurrenceDescription,
  
  // Timezone
  convertToTimezone,
  getTimezoneOffsetHours,
  getCommonTimezones,
  
  // Validation
  isValidDateString,
  isValidTimeString,
  isValidDateRange,
  
  // Utilities
  getDayOrdinal,
  getDaysInMonth,
  getMonthName,
  getWeekdayName,
  cloneDate,
  resetTime,
  combineDateAndTime,
  getAge,
}

export default dateUtils
