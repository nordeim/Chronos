# **Core Utility Libraries Implementation**

I'll create comprehensive, production-ready utility files that form the foundation of the Chronos application's functionality.

## **1. `src/lib/utils/format.ts`**

```typescript
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
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
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
```

## **2. `src/lib/utils/validators.ts`**

```typescript
// chronos/src/lib/utils/validators.ts
import { z } from 'zod'

// ===================================================================
// Type Declarations
// ===================================================================

export interface ValidationResult<T = any> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export type Validator<T = any> = (value: unknown) => ValidationResult<T>

// ===================================================================
// Common Regex Patterns
// ===================================================================

export const REGEX_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  phoneUS: /^(\+1)?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  username: /^[a-zA-Z0-9_-]{3,30}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hexColor: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
  ipv4: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ipv6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  creditCard: /^[0-9]{13,19}$/,
  ssn: /^\d{3}-?\d{2}-?\d{4}$/,
  postalCodeUS: /^\d{5}(-\d{4})?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphabetic: /^[a-zA-Z]+$/,
  numeric: /^[0-9]+$/,
  decimal: /^-?\d+(\.\d+)?$/,
  base64: /^[A-Za-z0-9+/]*(=|==)?$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
  emoji: /\p{Emoji}/u,
  ascii: /^[\x00-\x7F]+$/,
} as const

// ===================================================================
// Zod Schemas
// ===================================================================

// User schemas
export const userSchemas = {
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(
      REGEX_PATTERNS.password,
      'Password must contain uppercase, lowercase, number and special character'
    ),

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(REGEX_PATTERNS.username, 'Username can only contain letters, numbers, underscores and hyphens')
    .toLowerCase()
    .trim(),

  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .trim(),

  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional(),

  phone: z
    .string()
    .regex(REGEX_PATTERNS.phone, 'Invalid phone number')
    .optional(),

  avatar: z
    .string()
    .url('Invalid avatar URL')
    .optional(),

  signup: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    name: z.string().min(1),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }),

  profile: z.object({
    name: z.string().min(1).max(100),
    username: z.string().min(3).max(30).regex(REGEX_PATTERNS.username).optional(),
    bio: z.string().max(500).optional(),
    avatar: z.string().url().optional(),
    timezone: z.string(),
    locale: z.string(),
    dateFormat: z.string(),
    timeFormat: z.enum(['12h', '24h']),
    weekStartsOn: z.number().min(0).max(6),
  }),
}

// Event schemas
export const eventSchemas = {
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long')
    .trim(),

  description: z
    .string()
    .max(5000, 'Description is too long')
    .optional(),

  location: z
    .string()
    .max(500, 'Location is too long')
    .optional(),

  dateTime: z.object({
    start: z.date(),
    end: z.date(),
  }).refine(data => data.end > data.start, {
    message: 'End date must be after start date',
  }),

  recurringRule: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    interval: z.number().min(1).max(100).optional(),
    count: z.number().min(1).max(999).optional(),
    until: z.date().optional(),
    byDay: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])).optional(),
    byMonth: z.array(z.number().min(1).max(12)).optional(),
    byMonthDay: z.array(z.number().min(1).max(31)).optional(),
  }).optional(),

  create: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    location: z.string().max(500).optional(),
    startDateTime: z.date(),
    endDateTime: z.date(),
    allDay: z.boolean().default(false),
    calendarId: z.string(),
    categoryId: z.string().optional(),
    color: z.string().regex(REGEX_PATTERNS.hexColor).optional(),
    reminders: z.array(z.object({
      minutes: z.number(),
      type: z.enum(['EMAIL', 'PUSH', 'SMS']),
    })).optional(),
  }).refine(data => data.endDateTime > data.startDateTime, {
    message: 'End date must be after start date',
    path: ['endDateTime'],
  }),
}

// Task schemas
export const taskSchemas = {
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long')
    .trim(),

  description: z
    .string()
    .max(5000, 'Description is too long')
    .optional(),

  priority: z
    .enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'])
    .default('MEDIUM'),

  status: z
    .enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED', 'ARCHIVED'])
    .default('TODO'),

  create: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    dueDate: z.date().optional(),
    priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).default('MEDIUM'),
    categoryId: z.string().optional(),
    estimatedTime: z.number().min(0).max(999).optional(),
    labels: z.array(z.string()).optional(),
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    dueDate: z.date().optional(),
    priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED', 'ARCHIVED']).optional(),
    progress: z.number().min(0).max(100).optional(),
  }),
}

// ===================================================================
// Custom Validators
// ===================================================================

/**
 * Validate email address
 */
export function validateEmail(email: unknown): ValidationResult<string> {
  try {
    const result = userSchemas.email.parse(email)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      }
    }
    return { success: false, errors: [{ field: 'email', message: 'Invalid email' }] }
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: unknown): ValidationResult<string> {
  try {
    const result = userSchemas.password.parse(password)
    
    // Additional strength checks
    const strength = calculatePasswordStrength(result)
    
    if (strength.score < 3) {
      return {
        success: false,
        errors: [{
          field: 'password',
          message: `Password is too weak. ${strength.feedback}`,
          code: 'WEAK_PASSWORD',
        }],
      }
    }
    
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      }
    }
    return { success: false, errors: [{ field: 'password', message: 'Invalid password' }] }
  }
}

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): {
  score: number
  strength: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong'
  feedback: string
} {
  let score = 0
  const feedback: string[] = []

  // Length
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (password.length >= 16) score++

  // Character variety
  if (/[a-z]/.test(password)) score++
  else feedback.push('Add lowercase letters')
  
  if (/[A-Z]/.test(password)) score++
  else feedback.push('Add uppercase letters')
  
  if (/\d/.test(password)) score++
  else feedback.push('Add numbers')
  
  if (/[@$!%*?&]/.test(password)) score++
  else feedback.push('Add special characters')

  // Common patterns to avoid
  if (!/(.)\1{2,}/.test(password)) score++ // No repeated characters
  if (!/^(?:abc|123|qwerty|password)/i.test(password)) score++ // No common patterns

  const strengthLevels = ['very-weak', 'weak', 'fair', 'strong', 'very-strong'] as const
  const strength = strengthLevels[Math.min(Math.floor(score / 2), 4)]

  return {
    score,
    strength,
    feedback: feedback.join('. '),
  }
}

/**
 * Validate credit card number (Luhn algorithm)
 */
export function validateCreditCard(cardNumber: string): ValidationResult<string> {
  const cleaned = cardNumber.replace(/\D/g, '')
  
  if (!REGEX_PATTERNS.creditCard.test(cleaned)) {
    return {
      success: false,
      errors: [{ field: 'cardNumber', message: 'Invalid card number format' }],
    }
  }

  // Luhn algorithm
  let sum = 0
  let isEven = false
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i])
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  if (sum % 10 !== 0) {
    return {
      success: false,
      errors: [{ field: 'cardNumber', message: 'Invalid card number' }],
    }
  }
  
  return { success: true, data: cleaned }
}

/**
 * Validate URL
 */
export function validateURL(url: unknown): ValidationResult<string> {
  if (typeof url !== 'string') {
    return {
      success: false,
      errors: [{ field: 'url', message: 'URL must be a string' }],
    }
  }

  try {
    const urlObj = new URL(url)
    
    // Additional validation
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        success: false,
        errors: [{ field: 'url', message: 'URL must use HTTP or HTTPS protocol' }],
      }
    }
    
    return { success: true, data: url }
  } catch {
    return {
      success: false,
      errors: [{ field: 'url', message: 'Invalid URL format' }],
    }
  }
}

/**
 * Validate date range
 */
export function validateDateRange(
  start: unknown,
  end: unknown
): ValidationResult<{ start: Date; end: Date }> {
  const startResult = z.date().safeParse(start)
  const endResult = z.date().safeParse(end)
  
  const errors: ValidationError[] = []
  
  if (!startResult.success) {
    errors.push({ field: 'start', message: 'Invalid start date' })
  }
  
  if (!endResult.success) {
    errors.push({ field: 'end', message: 'Invalid end date' })
  }
  
  if (startResult.success && endResult.success) {
    if (endResult.data <= startResult.data) {
      errors.push({ field: 'end', message: 'End date must be after start date' })
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  return {
    success: true,
    data: { start: startResult.data!, end: endResult.data! },
  }
}

/**
 * Validate file upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number // bytes
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): ValidationResult<File> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options
  
  const errors: ValidationError[] = []
  
  // Check file size
  if (file.size > maxSize) {
    errors.push({
      field: 'file',
      message: `File size must be less than ${maxSize / 1024 / 1024}MB`,
      code: 'FILE_TOO_LARGE',
    })
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `File type must be one of: ${allowedTypes.join(', ')}`,
      code: 'INVALID_FILE_TYPE',
    })
  }
  
  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push({
        field: 'file',
        message: `File extension must be one of: ${allowedExtensions.join(', ')}`,
        code: 'INVALID_FILE_EXTENSION',
      })
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors }
  }
  
  return { success: true, data: file }
}

// ===================================================================
// Form Validators
// ===================================================================

/**
 * Create form validator
 */
export function createFormValidator<T extends z.ZodSchema>(
  schema: T
): (data: unknown) => ValidationResult<z.infer<T>> {
  return (data: unknown) => {
    const result = schema.safeParse(data)
    
    if (result.success) {
      return { success: true, data: result.data }
    }
    
    return {
      success: false,
      errors: result.error.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code,
      })),
    }
  }
}

/**
 * Compose multiple validators
 */
export function composeValidators<T>(
  ...validators: Array<(value: T) => ValidationResult<T>>
): (value: T) => ValidationResult<T> {
  return (value: T) => {
    for (const validator of validators) {
      const result = validator(value)
      if (!result.success) {
        return result
      }
    }
    return { success: true, data: value }
  }
}

// ===================================================================
// Export Collections
// ===================================================================

export const validators = {
  // Basic validators
  email: validateEmail,
  password: validatePassword,
  creditCard: validateCreditCard,
  url: validateURL,
  dateRange: validateDateRange,
  file: validateFile,
  
  // Schema validators
  schemas: {
    user: userSchemas,
    event: eventSchemas,
    task: taskSchemas,
  },
  
  // Utilities
  createFormValidator,
  composeValidators,
  calculatePasswordStrength,
  
  // Patterns
  patterns: REGEX_PATTERNS,
}

export default validators
```

## **3. `src/lib/utils/constants.ts`**

```typescript
// chronos/src/lib/utils/constants.ts

// ===================================================================
// Application Constants
// ===================================================================

export const APP_CONFIG = {
  name: 'Chronos',
  tagline: 'Where Time Meets Intelligence',
  description: 'Transform the way you manage time with AI-powered scheduling, beautiful task management, and insights that help you achieve more.',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://chronos.app',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.chronos.app',
  supportEmail: 'support@chronos.app',
  company: 'Chronos Inc.',
  foundedYear: 2024,
} as const

// ===================================================================
// Feature Flags
// ===================================================================

export const FEATURES = {
  AI_SCHEDULING: true,
  VOICE_INPUT: true,
  TEAM_COLLABORATION: true,
  ANALYTICS_DASHBOARD: true,
  FOCUS_MODE: true,
  CALENDAR_SHARING: true,
  TASK_DEPENDENCIES: true,
  RECURRING_EVENTS: true,
  TIME_TRACKING: true,
  NOTIFICATIONS: true,
  INTEGRATIONS: true,
  DARK_MODE: true,
  OFFLINE_MODE: false,
  BETA_FEATURES: process.env.NODE_ENV === 'development',
} as const

// ===================================================================
// UI Constants
// ===================================================================

export const UI = {
  // Breakpoints
  breakpoints: {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
    '3xl': 1920,
  },
  
  // Animation durations (ms)
  animation: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 1000,
  },
  
  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
    toast: 70,
    commandPalette: 80,
    maximum: 9999,
  },
  
  // Toasts
  toast: {
    duration: 5000,
    maxVisible: 3,
    position: 'bottom-right' as const,
  },
  
  // Modals
  modal: {
    sizes: {
      xs: '20rem',
      sm: '24rem',
      md: '32rem',
      lg: '48rem',
      xl: '64rem',
      full: '100%',
    },
  },
} as const

// ===================================================================
// Calendar Constants
// ===================================================================

export const CALENDAR = {
  // View modes
  views: {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
    AGENDA: 'agenda',
    TIMELINE: 'timeline',
  },
  
  // Time constraints
  minTime: '00:00',
  maxTime: '23:59',
  slotDuration: 30, // minutes
  snapDuration: 15, // minutes
  
  // Working hours
  workingHours: {
    start: '09:00',
    end: '17:00',
  },
  
  // Week settings
  weekStartsOn: 0, // 0 = Sunday, 1 = Monday
  weekendDays: [0, 6], // Sunday and Saturday
  
  // Event settings
  defaultEventDuration: 60, // minutes
  minEventDuration: 15, // minutes
  maxEventDuration: 1440, // 24 hours in minutes
  
  // Colors
  colors: [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6B7280', // Gray
    '#0EA5E9', // Sky
  ],
} as const

// ===================================================================
// Task Constants
// ===================================================================

export const TASKS = {
  // Priorities
  priorities: {
    URGENT: { value: 'URGENT', label: 'Urgent', color: '#EF4444', weight: 4 },
    HIGH: { value: 'HIGH', label: 'High', color: '#F59E0B', weight: 3 },
    MEDIUM: { value: 'MEDIUM', label: 'Medium', color: '#3B82F6', weight: 2 },
    LOW: { value: 'LOW', label: 'Low', color: '#10B981', weight: 1 },
    NONE: { value: 'NONE', label: 'None', color: '#6B7280', weight: 0 },
  },
  
  // Statuses
  statuses: {
    TODO: { value: 'TODO', label: 'To Do', color: '#6B7280' },
    IN_PROGRESS: { value: 'IN_PROGRESS', label: 'In Progress', color: '#3B82F6' },
    BLOCKED: { value: 'BLOCKED', label: 'Blocked', color: '#EF4444' },
    IN_REVIEW: { value: 'IN_REVIEW', label: 'In Review', color: '#F59E0B' },
    COMPLETED: { value: 'COMPLETED', label: 'Completed', color: '#10B981' },
    CANCELLED: { value: 'CANCELLED', label: 'Cancelled', color: '#6B7280' },
    ARCHIVED: { value: 'ARCHIVED', label: 'Archived', color: '#9CA3AF' },
  },
  
  // Kanban columns
  kanbanColumns: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'],
  
  // Time estimates (minutes)
  timeEstimates: [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' },
    { value: 480, label: '1 day' },
    { value: 1440, label: '3 days' },
    { value: 2880, label: '1 week' },
  ],
} as const

// ===================================================================
// Focus Mode Constants
// ===================================================================

export const FOCUS = {
  // Timer presets (minutes)
  presets: {
    POMODORO: { duration: 25, break: 5, label: 'Pomodoro' },
    SHORT: { duration: 15, break: 3, label: 'Short Focus' },
    MEDIUM: { duration: 45, break: 10, label: 'Medium Focus' },
    LONG: { duration: 90, break: 15, label: 'Deep Work' },
    CUSTOM: { duration: 30, break: 5, label: 'Custom' },
  },
  
  // Sounds
  sounds: {
    TICK: '/sounds/tick.mp3',
    COMPLETE: '/sounds/complete.mp3',
    BREAK: '/sounds/break.mp3',
    WARNING: '/sounds/warning.mp3',
  },
  
  // Settings
  settings: {
    autoStartBreaks: true,
    autoStartPomodoros: false,
    showNotifications: true,
    playSound: true,
    showTimeInTitle: true,
  },
} as const

// ===================================================================
// Keyboard Shortcuts
// ===================================================================

export const KEYBOARD_SHORTCUTS = {
  // Global
  COMMAND_PALETTE: { key: 'k', modifiers: ['cmd', 'ctrl'] },
  SEARCH: { key: '/', modifiers: [] },
  ESCAPE: { key: 'Escape', modifiers: [] },
  
  // Navigation
  CALENDAR: { key: '1', modifiers: ['cmd', 'ctrl'] },
  TASKS: { key: '2', modifiers: ['cmd', 'ctrl'] },
  FOCUS: { key: '3', modifiers: ['cmd', 'ctrl'] },
  ANALYTICS: { key: '4', modifiers: ['cmd', 'ctrl'] },
  SETTINGS: { key: ',', modifiers: ['cmd', 'ctrl'] },
  
  // Actions
  NEW_EVENT: { key: 'n', modifiers: ['cmd', 'ctrl'] },
  NEW_TASK: { key: 't', modifiers: ['cmd', 'ctrl'] },
  QUICK_ADD: { key: 'a', modifiers: ['cmd', 'ctrl'] },
  
  // Calendar
  TODAY: { key: 't', modifiers: [] },
  PREVIOUS: { key: 'ArrowLeft', modifiers: [] },
  NEXT: { key: 'ArrowRight', modifiers: [] },
  DAY_VIEW: { key: 'd', modifiers: [] },
  WEEK_VIEW: { key: 'w', modifiers: [] },
  MONTH_VIEW: { key: 'm', modifiers: [] },
  
  // Tasks
  COMPLETE_TASK: { key: 'x', modifiers: [] },
  DELETE_TASK: { key: 'Delete', modifiers: [] },
  EDIT_TASK: { key: 'e', modifiers: [] },
} as const

// ===================================================================
// API Constants
// ===================================================================

export const API = {
  // Endpoints
  endpoints: {
    AUTH: '/api/auth',
    EVENTS: '/api/events',
    TASKS: '/api/tasks',
    CALENDARS: '/api/calendars',
    USERS: '/api/users',
    ANALYTICS: '/api/analytics',
    AI: '/api/ai',
    INTEGRATIONS: '/api/integrations',
  },
  
  // Headers
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': APP_CONFIG.version,
  },
  
  // Timeouts (ms)
  timeouts: {
    default: 30000,
    upload: 120000,
    download: 60000,
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
} as const

// ===================================================================
// Storage Keys
// ===================================================================

export const STORAGE_KEYS = {
  // Local storage
  theme: 'chronos-theme',
  locale: 'chronos-locale',
  preferences: 'chronos-preferences',
  recentSearches: 'chronos-recent-searches',
  viewMode: 'chronos-view-mode',
  sidebarCollapsed: 'chronos-sidebar-collapsed',
  onboardingCompleted: 'chronos-onboarding-completed',
  
  // Session storage
  commandPaletteHistory: 'chronos-command-history',
  unsavedChanges: 'chronos-unsaved-changes',
  activeTab: 'chronos-active-tab',
} as const

// ===================================================================
// Notification Types
// ===================================================================

export const NOTIFICATIONS = {
  types: {
    REMINDER: 'reminder',
    INVITATION: 'invitation',
    UPDATE: 'update',
    ACHIEVEMENT: 'achievement',
    SYSTEM: 'system',
    ALERT: 'alert',
    DIGEST: 'digest',
  },
  
  channels: {
    IN_APP: 'in_app',
    EMAIL: 'email',
    PUSH: 'push',
    SMS: 'sms',
    WEBHOOK: 'webhook',
  },
  
  priorities: {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    URGENT: 4,
  },
} as const

// ===================================================================
// Integration Providers
// ===================================================================

export const INTEGRATIONS = {
  GOOGLE_CALENDAR: {
    id: 'google-calendar',
    name: 'Google Calendar',
    icon: '/icons/google-calendar.svg',
    scopes: ['calendar.readonly', 'calendar.events'],
  },
  OUTLOOK: {
    id: 'outlook',
    name: 'Outlook',
    icon: '/icons/outlook.svg',
    scopes: ['Calendars.ReadWrite'],
  },
  SLACK: {
    id: 'slack',
    name: 'Slack',
    icon: '/icons/slack.svg',
    scopes: ['channels:read', 'chat:write'],
  },
  NOTION: {
    id: 'notion',
    name: 'Notion',
    icon: '/icons/notion.svg',
    scopes: ['read', 'write'],
  },
  ZOOM: {
    id: 'zoom',
    name: 'Zoom',
    icon: '/icons/zoom.svg',
    scopes: ['meeting:write'],
  },
} as const

// ===================================================================
// Error Messages
// ===================================================================

export const ERROR_MESSAGES = {
  // General
  UNKNOWN: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_NOT_VERIFIED: 'Please verify your email before signing in.',
  ACCOUNT_LOCKED: 'Your account has been locked. Please contact support.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  
  // Validation
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_DATE: 'Please enter a valid date.',
  DATE_IN_PAST: 'Date cannot be in the past.',
  
  // Permissions
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  
  // Resources
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'A resource with this name already exists.',
  
  // Limits
  RATE_LIMITED: 'Too many requests. Please try again later.',
  QUOTA_EXCEEDED: 'You have exceeded your quota.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed.',
} as const

// ===================================================================
// Success Messages
// ===================================================================

export const SUCCESS_MESSAGES = {
  // General
  SAVED: 'Changes saved successfully.',
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  
  // Auth
  SIGNED_IN: 'Welcome back!',
  SIGNED_OUT: 'You have been signed out.',
  EMAIL_VERIFIED: 'Email verified successfully.',
  PASSWORD_RESET: 'Password reset successfully.',
  
  // Tasks
  TASK_COMPLETED: 'Task marked as complete!',
  TASK_CREATED: 'Task created successfully.',
  
  // Events
  EVENT_CREATED: 'Event added to calendar.',
  EVENT_UPDATED: 'Event updated successfully.',
  
  // Sync
  SYNC_COMPLETE: 'Sync completed successfully.',
  IMPORT_COMPLETE: 'Import completed successfully.',
} as const

// ===================================================================
// Export All Constants
// ===================================================================

export const CONSTANTS = {
  APP: APP_CONFIG,
  FEATURES,
  UI,
  CALENDAR,
  TASKS,
  FOCUS,
  KEYBOARD_SHORTCUTS,
  API,
  STORAGE_KEYS,
  NOTIFICATIONS,
  INTEGRATIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} as const

export default CONSTANTS
```

## **4. `src/lib/utils/helpers.ts`**

```typescript
// chronos/src/lib/utils/helpers.ts
import { type ClassValue } from 'clsx'

// ===================================================================
// Type Guards
// ===================================================================

/**
 * Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Check if value is an object
 */
export function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if value is an array
 */
export function isArray<T = any>(value: unknown): value is T[] {
  return Array.isArray(value)
}

/**
 * Check if value is a function
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

/**
 * Check if value is a promise
 */
export function isPromise<T = any>(value: unknown): value is Promise<T> {
  return value instanceof Promise
}

/**
 * Check if value is a date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (isString(value) || isArray(value)) return value.length === 0
  if (isObject(value)) return Object.keys(value).length === 0
  return false
}

// ===================================================================
// Array Utilities
// ===================================================================

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

/**
 * Remove duplicates by key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const value = String(item[key])
    groups[value] = groups[value] || []
    groups[value].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Shuffle array
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get random item from array
 */
export function randomItem<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Move item in array
 */
export function moveItem<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array]
  const [item] = newArray.splice(from, 1)
  newArray.splice(to, 0, item)
  return newArray
}

/**
 * Sort array by multiple keys
 */
export function sortBy<T>(
  array: T[],
  keys: Array<{ key: keyof T; order?: 'asc' | 'desc' }>
): T[] {
  return [...array].sort((a, b) => {
    for (const { key, order = 'asc' } of keys) {
      const aVal = a[key]
      const bVal = b[key]
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
    }
    return 0
  })
}

// ===================================================================
// Object Utilities
// ===================================================================

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  
  const cloned = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target
  
  const source = sources.shift()
  if (!source) return target

  for (const key in source) {
    const sourceValue = source[key]
    const targetValue = target[key]

    if (isObject(sourceValue) && isObject(targetValue)) {
      target[key] = deepMerge(targetValue, sourceValue)
    } else {
      target[key] = sourceValue as T[Extract<keyof T, string>]
    }
  }

  return deepMerge(target, ...sources)
}

/**
 * Pick properties from object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Omit properties from object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result
}

/**
 * Get nested property from object
 */
export function get<T = any>(
  obj: any,
  path: string,
  defaultValue?: T
): T {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result == null) return defaultValue as T
    result = result[key]
  }

  return result ?? defaultValue
}

/**
 * Set nested property in object
 */
export function set<T extends object>(
  obj: T,
  path: string,
  value: any
): T {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  
  let current: any = obj
  for (const key of keys) {
    if (!isObject(current[key])) {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[lastKey] = value
  return obj
}

// ===================================================================
// String Utilities
// ===================================================================

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Capitalize each word
 */
export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase())
}

/**
 * Convert to camelCase
 */
export function camelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '')
}

/**
 * Convert to snake_case
 */
export function snakeCase(str: string): string {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_')
}

/**
 * Convert to kebab-case
 */
export function kebabCase(str: string): string {
  return str
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('-')
}

/**
 * Generate random string
 */
export function randomString(length: number, charset?: string): string {
  const chars = charset || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate UUID v4
 */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ===================================================================
// Number Utilities
// ===================================================================

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Round to decimal places
 */
export function round(value: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals)
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/**
 * Generate range of numbers
 */
export function range(start: number, end?: number, step: number = 1): number[] {
  if (end === undefined) {
    end = start
    start = 0
  }
  
  const result: number[] = []
  for (let i = start; i < end; i += step) {
    result.push(i)
  }
  return result
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number, decimals: number = 0): number {
  if (total === 0) return 0
  return round((value / total) * 100, decimals)
}

// ===================================================================
// Function Utilities
// ===================================================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Memoize function
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map()
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Retry function
 */
export async function retry<T>(
  func: () => Promise<T>,
  options: {
    retries?: number
    delay?: number
    backoff?: number
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 2 } = options
  
  for (let i = 0; i < retries; i++) {
    try {
      return await func()
    } catch (error) {
      if (i === retries - 1) throw error
      
      const waitTime = delay * Math.pow(backoff, i)
      await sleep(waitTime)
    }
  }
  
  throw new Error('Retry failed')
}

/**
 * Sleep for milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ===================================================================
// URL Utilities
// ===================================================================

/**
 * Parse query string
 */
export function parseQuery(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  
  for (const [key, value] of params) {
    result[key] = value
  }
  
  return result
}

/**
 * Build query string
 */
export function buildQuery(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  }
  
  return searchParams.toString()
}

/**
 * Join URL paths
 */
export function joinPaths(...paths: string[]): string {
  return paths
    .map((path, index) => {
      if (index === 0) {
        return path.replace(/\/$/, '')
      }
      return path.replace(/^\/|\/$/g, '')
    })
    .filter(Boolean)
    .join('/')
}

// ===================================================================
// Browser Utilities
// ===================================================================

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    
    try {
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch {
      document.body.removeChild(textarea)
      return false
    }
  }
  
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Download file
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  type: string = 'text/plain'
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Get cookie value
 */
export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  
  return null
}

/**
 * Set cookie
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    days?: number
    path?: string
    domain?: string
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
  } = {}
): void {
  const {
    days = 7,
    path = '/',
    domain,
    secure = true,
    sameSite = 'lax',
  } = options
  
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  
  let cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=${path}`
  
  if (domain) cookie += `; domain=${domain}`
  if (secure) cookie += '; secure'
  cookie += `; samesite=${sameSite}`
  
  document.cookie = cookie
}

/**
 * Delete cookie
 */
export function deleteCookie(name: string, path: string = '/'): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`
}

// ===================================================================
// Export Collections
// ===================================================================

export const helpers = {
  // Type guards
  isDefined,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isPromise,
  isDate,
  isEmpty,
  
  // Arrays
  unique,
  uniqueBy,
  groupBy,
  chunk,
  shuffle,
  randomItem,
  moveItem,
  sortBy,
  
  // Objects
  deepClone,
  deepMerge,
  pick,
  omit,
  get,
  set,
  
  // Strings
  capitalize,
  capitalizeWords,
  camelCase,
  snakeCase,
  kebabCase,
  randomString,
  uuid,
  
  // Numbers
  clamp,
  round,
  range,
  percentage,
  
  // Functions
  debounce,
  throttle,
  memoize,
  retry,
  sleep,
  
  // URLs
  parseQuery,
  buildQuery,
  joinPaths,
  
  // Browser
  copyToClipboard,
  downloadFile,
  getCookie,
  setCookie,
  deleteCookie,
}

export default helpers
```

## **5. `src/lib/utils/cn.ts`**

```typescript
// chronos/src/lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combine class names with tailwind-merge
 * This function combines multiple class names and merges Tailwind CSS classes intelligently
 * to avoid conflicts and ensure the last class takes precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Conditional class names
 * Apply classes based on conditions
 */
export function cx(
  ...args: Array<ClassValue | [boolean, ClassValue] | [boolean, ClassValue, ClassValue]>
): string {
  const classes: ClassValue[] = []

  for (const arg of args) {
    if (Array.isArray(arg)) {
      const [condition, trueClass, falseClass] = arg
      if (condition) {
        classes.push(trueClass)
      } else if (falseClass) {
        classes.push(falseClass)
      }
    } else {
      classes.push(arg)
    }
  }

  return cn(...classes)
}

/**
 * Variant class helper
 * Create variant-based class names
 */
export function variants<T extends Record<string, Record<string, ClassValue>>>(
  config: T
) {
  return function getVariantClasses<
    V extends keyof T,
    K extends keyof T[V]
  >(
    variant: V,
    key: K,
    className?: ClassValue
  ): string {
    return cn(config[variant]?.[key], className)
  }
}

/**
 * Create className getter with base classes
 */
export function createStyles<T extends Record<string, ClassValue>>(
  styles: T
) {
  return function getClassName<K extends keyof T>(
    key: K,
    ...additional: ClassValue[]
  ): string {
    return cn(styles[key], ...additional)
  }
}

/**
 * Compose multiple className functions
 */
export function composeStyles(
  ...functions: Array<(...args: any[]) => string>
) {
  return function composedStyles(...args: ClassValue[]): string {
    const classes = functions.map(fn => fn())
    return cn(...classes, ...args)
  }
}

export default cn
```

---

These five comprehensive utility files provide a robust foundation for the Chronos application:

## **Key Features Summary:**

### **`format.ts` - Complete Formatting Library:**
- **30+ formatting functions** for all data types
- Number, currency, percentage formatting with localization
- Phone, email, credit card masking
- File size and data transfer formatting
- Duration and time formatting
- Address and coordinate formatting
- Color format conversions
- List formatting with proper grammar

### **`validators.ts` - Comprehensive Validation:**
- **Zod schema** integration
- **20+ regex patterns** for common validations
- Password strength calculator
- Credit card validation (Luhn algorithm)
- File upload validation
- Form validation factory
- Composable validators
- Type-safe validation results

### **`constants.ts` - Application Constants:**
- App configuration and metadata
- Feature flags for easy toggle
- UI constants (breakpoints, animations, z-index)
- Calendar and task configurations
- Keyboard shortcuts mapping
- API endpoints and settings
- Storage keys for consistency
- Error and success messages

### **`helpers.ts` - Utility Functions:**
- **60+ helper functions**
- Type guards for runtime checks
- Array manipulation utilities
- Object deep operations
- String case conversions
- Number utilities
- Function decorators (debounce, throttle, memoize)
- URL and query string helpers
- Browser utilities (clipboard, cookies)

### **`cn.ts` - Class Name Utilities:**
- Tailwind class merging with conflict resolution
- Conditional class application
- Variant-based styling
- Style composition
- Type-safe class name generation

These utilities provide everything needed for a production-ready application with excellent developer experience and maintainability.
