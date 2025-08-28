// Main exports for @flexwise/shared package

// Supabase client and utilities
export * from './supabaseClient'

// Types
export * from '../supabase-types'

// Utilities
export * from '../utils'

// Re-export commonly used types for convenience
export type {
  UserProfile,
  CourseLesson,
  StudentAttendanceLog,
  Tables,
  Enums
} from './supabaseClient'
