import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for actual database views
export interface Student {
  id: string // student_id
  name: string // full_name
  class: string // class_name
  first_choice?: string
  second_choice?: string
  third_choice?: string
  day_of_week: number
  school_id: string
  registration_period_id: string
  semester_id: string
  current_enrollment?: string | null
}

export interface Course {
  id: string // course_id
  window_id: string
  name: string // course_name
  teacher: string
  room: string
  max_capacity: number // max_students from view
  available_grades: string
  day: string // day_name
  day_of_week: number
  is_locked: boolean
  enrolled_count: number
  school_id: string
  registration_period_id: string
  semester_id: string
  notes_count?: number
}

export interface CourseNote {
  id: string // UUID
  course_id: string
  school_id: string
  registration_period_id: string
  semester_id: string
  day_of_week: number
  text: string
  author: string
  is_problem: boolean
  is_resolved: boolean
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
  resolved_at?: string // ISO timestamp
  resolved_by?: string
}

export interface DayOfWeek {
  school_id: string
  day_id: number
  day_number: number
  name_en: string
  name_de: string
}

// Context for filtering the views
export interface EnrollmentContext {
  school_id: string
  registration_period_id: string
  semester_id: string
}
