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
