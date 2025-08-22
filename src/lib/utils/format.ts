// chronos/src/lib/utils/format.ts
import { formatDistanceToNow, format as dateFnsFormat } from 'date-fns'
import { enUS, es, fr, de, ja, zhCN } from 'date-fns/locale'

// ===================================================================
// Type Declarations
// ===================================================================

export interface FormatOptions {
  locale?: string
  precision?: number
  compact?: boolean
  sign?: boolean
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact'
}

export interface CurrencyFormatOptions extends FormatOptions {
  currency?: string
  display?: 'symbol' | 'code' | 'name'
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export interface PhoneFormatOptions {
  country?: string
  international?: boolean
  format?: 'NATIONAL' | 'INTERNATIONAL' | 'E164' | 'RFC3966'
}

export interface ColorFormat {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  hsv: { h: number; s: number; v: number }
}

// ===================================================================
// Locale Configuration
// ===================================================================

const LOCALE_MAP: Record<string, Locale> = {
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

// ===================================================================
// Number Formatting
// ===================================================================

/**
 * Format number with locale support
 */
export function formatNumber(
  value: number | string | null | undefined,
  options: FormatOptions = {}
): string {
  if (value === null || value === undefined) return '—'
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'

  const {
    locale = 'en-US',
    precision,
    compact = false,
    sign = false,
    notation = compact ? 'compact' : 'standard',
  } = options

  const formatter = new Intl.NumberFormat(locale, {
    notation,
    signDisplay: sign ? 'always' : 'auto',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })

  return formatter.format(num)
}

/**
 * Format percentage
 */
export function formatPercent(
  value: number | null | undefined,
  options: FormatOptions = {}
): string {
  if (value === null || value === undefined) return '—'

  const { locale = 'en-US', precision = 0, sign = false } = options

  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    signDisplay: sign ? 'always' : 'auto',
  })

  // Convert to decimal if value is already a percentage
  const decimal = value > 1 ? value / 100 : value
  return formatter.format(decimal)
}

/**
 * Format currency
 */
export function formatCurrency(
  value: number | null | undefined,
  options: CurrencyFormatOptions = {}
): string {
  if (value === null || value === undefined) return '—'

  const {
    locale = 'en-US',
    currency = 'USD',
    display = 'symbol',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    sign = false,
    compact = false,
  } = options

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: display,
    minimumFractionDigits,
    maximumFractionDigits,
    notation: compact ? 'compact' : 'standard',
    signDisplay: sign ? 'always' : 'auto',
  })

  return formatter.format(value)
}

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.)
 */
export function formatOrdinal(value: number, locale: string = 'en-US'): string {
  if (locale.startsWith('en')) {
    const suffixes = ['th', 'st', 'nd', 'rd']
    const v = value % 100
    return value + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
  }

  // For other locales, use Intl.PluralRules if available
  try {
    const pr = new Intl.PluralRules(locale, { type: 'ordinal' })
    const rule = pr.select(value)
    
    // This is simplified - you'd need locale-specific rules
    const suffixes: Record<string, string> = {
      one: 'st',
      two: 'nd',
      few: 'rd',
      other: 'th',
    }
    
    return `${value}${suffixes[rule] || 'th'}`
  } catch {
    return value.toString()
  }
}

/**
 * Format with SI units (k, M, G, T)
 */
export function formatCompactNumber(
  value: number,
  options: { precision?: number; locale?: string } = {}
): string {
  const { precision = 1, locale = 'en-US' } = options

  const formatter = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: precision,
  })

  return formatter.format(value)
}

/**
 * Format range of numbers
 */
export function formatRange(
  start: number,
  end: number,
  options: FormatOptions = {}
): string {
  const { locale = 'en-US' } = options

  if ('formatRange' in Intl.NumberFormat.prototype) {
    const formatter = new Intl.NumberFormat(locale)
    return (formatter as any).formatRange(start, end)
  }

  // Fallback for browsers without formatRange
  return `${formatNumber(start, options)} – ${formatNumber(end, options)}`
}

// ===================================================================
// String Formatting
// ===================================================================

/**
 * Format name (capitalize properly)
 */
export function formatName(name: string | null | undefined): string {
  if (!name) return '—'

  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\bMc(\w)/g, (match, char) => `Mc${char.toUpperCase()}`)
    .replace(/\bMac(\w)/g, (match, char) => `Mac${char.toUpperCase()}`)
    .replace(/\bO'(\w)/g, (match, char) => `O'${char.toUpperCase()}`)
}

/**
 * Format initials from name
 */
export function formatInitials(
  name: string | null | undefined,
  maxLength: number = 2
): string {
  if (!name) return '??'

  const parts = name.trim().split(/\s+/)
  const initials = parts
    .map(part => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, maxLength)
    .join('')

  return initials || '??'
}

/**
 * Format email (mask for privacy)
 */
export function formatEmail(
  email: string | null | undefined,
  options: { mask?: boolean } = {}
): string {
  if (!email) return '—'

  const { mask = false } = options

  if (!mask) return email.toLowerCase()

  const [local, domain] = email.split('@')
  if (!domain) return email

  const maskedLocal =
    local.length <= 3
      ? '*'.repeat(local.length)
      : local[0] + '*'.repeat(Math.max(1, local.length - 2)) + local[local.length - 1]

  return `${maskedLocal}@${domain}`
}

/**
 * Format phone number
 */
export function formatPhone(
  phone: string | null | undefined,
  options: PhoneFormatOptions = {}
): string {
  if (!phone) return '—'

  const { country = 'US', international = false } = options

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')

  if (country === 'US' && cleaned.length === 10) {
    const parts = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (parts) {
      if (international) {
        return `+1 (${parts[1]}) ${parts[2]}-${parts[3]}`
      }
      return `(${parts[1]}) ${parts[2]}-${parts[3]}`
    }
  }

  // Generic international format
  if (cleaned.length > 10 && cleaned.startsWith('1')) {
    const parts = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/)
    if (parts) {
      return `+1 (${parts[1]}) ${parts[2]}-${parts[3]}`
    }
  }

  // Return original if no format matches
  return phone
}

/**
 * Format credit card number (mask)
 */
export function formatCreditCard(
  cardNumber: string | null | undefined,
  options: { mask?: boolean; lastDigits?: number } = {}
): string {
  if (!cardNumber) return '—'

  const { mask = true, lastDigits = 4 } = options
  const cleaned = cardNumber.replace(/\D/g, '')

  if (!mask) {
    // Format with spaces
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  if (cleaned.length < lastDigits) return '*'.repeat(cleaned.length)

  const masked = '*'.repeat(cleaned.length - lastDigits) + cleaned.slice(-lastDigits)
  return masked.replace(/(\*{4})(?=\*)/g, '$1 ').replace(/(\d{4})$/, ' $1')
}

/**
 * Format SSN (mask)
 */
export function formatSSN(
  ssn: string | null | undefined,
  options: { mask?: boolean } = {}
): string {
  if (!ssn) return '—'

  const { mask = true } = options
  const cleaned = ssn.replace(/\D/g, '')

  if (cleaned.length !== 9) return ssn

  if (!mask) {
    return cleaned.replace(/^(\d{3})(\d{2})(\d{4})$/, '$1-$2-$3')
  }

  return cleaned.replace(/^(\d{3})(\d{2})(\d{4})$/, '***-**-$3')
}

/**
 * Truncate string with ellipsis
 */
export function truncate(
  text: string | null | undefined,
  maxLength: number,
  options: { ellipsis?: string; breakWord?: boolean } = {}
): string {
  if (!text) return ''

  const { ellipsis = '...', breakWord = false } = options

  if (text.length <= maxLength) return text

  if (!breakWord) {
    const truncated = text.slice(0, maxLength - ellipsis.length)
    const lastSpace = truncated.lastIndexOf(' ')
    
    if (lastSpace > 0) {
      return truncated.slice(0, lastSpace) + ellipsis
    }
  }

  return text.slice(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Format slug from text
 */
export function formatSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Format hashtag
 */
export function formatHashtag(text: string): string {
  const cleaned = text
    .trim()
    .replace(/^#/, '') // Remove existing hash
    .replace(/[^\w]/g, '') // Keep only alphanumeric

  return cleaned ? `#${cleaned}` : ''
}

/**
 * Format mention
 */
export function formatMention(username: string): string {
  const cleaned = username
    .trim()
    .replace(/^@/, '') // Remove existing @
    .replace(/[^\w_]/g, '') // Keep only alphanumeric and underscore

  return cleaned ? `@${cleaned}` : ''
}

// ===================================================================
// File & Data Size Formatting
// ===================================================================

/**
 * Format file size
 */
export function formatFileSize(
  bytes: number | null | undefined,
  options: { precision?: number; binary?: boolean } = {}
): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 B'

  const { precision = 2, binary = false } = options
  const k = binary ? 1024 : 1000
  const sizes = binary
    ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
    : ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / Math.pow(k, i)

  return `${size.toFixed(precision)} ${sizes[i]}`
}

/**
 * Format download speed
 */
export function formatSpeed(
  bytesPerSecond: number,
  options: { precision?: number } = {}
): string {
  const { precision = 1 } = options
  const size = formatFileSize(bytesPerSecond, { precision })
  return `${size}/s`
}

/**
 * Format data transfer
 */
export function formatDataTransfer(
  bytes: number,
  seconds: number,
  options: { precision?: number } = {}
): string {
  if (seconds === 0) return '—'
  const bytesPerSecond = bytes / seconds
  return formatSpeed(bytesPerSecond, options)
}

// ===================================================================
// Time & Duration Formatting
// ===================================================================

/**
 * Format duration (milliseconds to human readable)
 */
export function formatDuration(
  milliseconds: number | null | undefined,
  options: { compact?: boolean; units?: number } = {}
): string {
  if (!milliseconds || milliseconds < 0) return '0s'

  const { compact = false, units = 2 } = options

  const parts = []
  const time = {
    d: Math.floor(milliseconds / 86400000),
    h: Math.floor(milliseconds / 3600000) % 24,
    m: Math.floor(milliseconds / 60000) % 60,
    s: Math.floor(milliseconds / 1000) % 60,
    ms: milliseconds % 1000,
  }

  if (time.d > 0) parts.push(`${time.d}${compact ? 'd' : ` day${time.d !== 1 ? 's' : ''}`}`)
  if (time.h > 0) parts.push(`${time.h}${compact ? 'h' : ` hour${time.h !== 1 ? 's' : ''}`}`)
  if (time.m > 0) parts.push(`${time.m}${compact ? 'm' : ` minute${time.m !== 1 ? 's' : ''}`}`)
  if (time.s > 0) parts.push(`${time.s}${compact ? 's' : ` second${time.s !== 1 ? 's' : ''}`}`)
  if (time.ms > 0 && parts.length === 0) parts.push(`${time.ms}ms`)

  return parts.slice(0, units).join(compact ? ' ' : ', ')
}

/**
 * Format countdown
 */
export function formatCountdown(
  targetDate: Date,
  options: { compact?: boolean } = {}
): string {
  const now = Date.now()
  const target = targetDate.getTime()
  const diff = target - now

  if (diff <= 0) return 'Expired'

  return formatDuration(diff, options)
}

/**
 * Format time ago
 */
export function formatTimeAgo(
  date: Date | string | number,
  options: { locale?: string; addSuffix?: boolean } = {}
): string {
  const { locale = 'en-US', addSuffix = true } = options
  const dateObj = new Date(date)
  
  const localeObj = LOCALE_MAP[locale] || enUS

  return formatDistanceToNow(dateObj, {
    locale: localeObj,
    addSuffix,
  })
}

/**
 * Format time until
 */
export function formatTimeUntil(
  date: Date | string | number,
  options: { locale?: string } = {}
): string {
  const { locale = 'en-US' } = options
  const dateObj = new Date(date)
  const now = new Date()

  if (dateObj <= now) return 'Past'

  const localeObj = LOCALE_MAP[locale] || enUS

  return formatDistanceToNow(dateObj, {
    locale: localeObj,
    addSuffix: false,
  })
}

// ===================================================================
// Address Formatting
// ===================================================================

/**
 * Format address
 */
export function formatAddress(address: {
  street1?: string
  street2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}): string {
  const parts = []

  if (address.street1) parts.push(address.street1)
  if (address.street2) parts.push(address.street2)
  
  const cityStateZip = []
  if (address.city) cityStateZip.push(address.city)
  if (address.state) cityStateZip.push(address.state)
  if (cityStateZip.length > 0 && address.postalCode) {
    cityStateZip[cityStateZip.length - 1] += ` ${address.postalCode}`
  } else if (address.postalCode) {
    cityStateZip.push(address.postalCode)
  }
  
  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '))
  }
  
  if (address.country) parts.push(address.country)

  return parts.join('\n')
}

/**
 * Format coordinates
 */
export function formatCoordinates(
  lat: number,
  lng: number,
  options: { precision?: number; format?: 'DD' | 'DMS' } = {}
): string {
  const { precision = 6, format = 'DD' } = options

  if (format === 'DD') {
    // Decimal degrees
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
  }

  // Degrees, minutes, seconds
  const latAbs = Math.abs(lat)
  const lngAbs = Math.abs(lng)

  const latDeg = Math.floor(latAbs)
  const latMin = Math.floor((latAbs - latDeg) * 60)
  const latSec = ((latAbs - latDeg - latMin / 60) * 3600).toFixed(1)

  const lngDeg = Math.floor(lngAbs)
  const lngMin = Math.floor((lngAbs - lngDeg) * 60)
  const lngSec = ((lngAbs - lngDeg - lngMin / 60) * 3600).toFixed(1)

  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'

  return `${latDeg}°${latMin}'${latSec}"${latDir}, ${lngDeg}°${lngMin}'${lngSec}"${lngDir}`
}

// ===================================================================
// Color Formatting
// ===================================================================

/**
 * Format color to different formats
 */
export function formatColor(color: string): ColorFormat | null {
  // Parse hex color
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (hexMatch) {
    const r = parseInt(hexMatch[1], 16)
    const g = parseInt(hexMatch[2], 16)
    const b = parseInt(hexMatch[3], 16)

    return {
      hex: `#${hexMatch[1]}${hexMatch[2]}${hexMatch[3]}`.toUpperCase(),
      rgb: { r, g, b },
      hsl: rgbToHsl(r, g, b),
      hsv: rgbToHsv(r, g, b),
    }
  }

  // Parse rgb color
  const rgbMatch = color.match(/rgbKATEX_INLINE_OPEN(\d+),\s*(\d+),\s*(\d+)KATEX_INLINE_CLOSE/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1])
    const g = parseInt(rgbMatch[2])
    const b = parseInt(rgbMatch[3])

    return {
      hex: rgbToHex(r, g, b),
      rgb: { r, g, b },
      hsl: rgbToHsl(r, g, b),
      hsv: rgbToHsv(r, g, b),
    }
  }

  return null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  }
}

// ===================================================================
// List Formatting
// ===================================================================

/**
 * Format list with proper grammar
 */
export function formatList(
  items: string[],
  options: { locale?: string; type?: 'conjunction' | 'disjunction' | 'unit' } = {}
): string {
  const { locale = 'en-US', type = 'conjunction' } = options

  if (items.length === 0) return ''
  if (items.length === 1) return items[0]

  // Use Intl.ListFormat if available
  if ('ListFormat' in Intl) {
    const formatter = new (Intl as any).ListFormat(locale, { type })
    return formatter.format(items)
  }

  // Fallback for older browsers
  if (items.length === 2) {
    return type === 'conjunction' 
      ? `${items[0]} and ${items[1]}`
      : `${items[0]} or ${items[1]}`
  }

  const lastItem = items[items.length - 1]
  const otherItems = items.slice(0, -1)
  const connector = type === 'conjunction' ? 'and' : 'or'
  
  return `${otherItems.join(', ')}, ${connector} ${lastItem}`
}

// ===================================================================
// Export Collections
// ===================================================================

export const formatters = {
  // Numbers
  number: formatNumber,
  percent: formatPercent,
  currency: formatCurrency,
  ordinal: formatOrdinal,
  compact: formatCompactNumber,
  range: formatRange,

  // Strings
  name: formatName,
  initials: formatInitials,
  email: formatEmail,
  phone: formatPhone,
  creditCard: formatCreditCard,
  ssn: formatSSN,
  truncate,
  slug: formatSlug,
  hashtag: formatHashtag,
  mention: formatMention,

  // Files & Data
  fileSize: formatFileSize,
  speed: formatSpeed,
  dataTransfer: formatDataTransfer,

  // Time
  duration: formatDuration,
  countdown: formatCountdown,
  timeAgo: formatTimeAgo,
  timeUntil: formatTimeUntil,

  // Address
  address: formatAddress,
  coordinates: formatCoordinates,

  // Color
  color: formatColor,

  // Lists
  list: formatList,
}

export default formatters
