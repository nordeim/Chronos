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
  phoneUS: /^(\+1)?[-.\s]?KATEX_INLINE_OPEN?[2-9]\d{2}KATEX_INLINE_CLOSE?[-.\s]?\d{3}[-.\s]?\d{4}$/,
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
