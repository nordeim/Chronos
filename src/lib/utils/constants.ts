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
