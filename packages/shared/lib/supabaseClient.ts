import { createClient } from '@supabase/supabase-js'
import type { Database } from '../supabase-types'
// For comprehensive types with better documentation, see: ../../types/database.ts

// Environment variable validation
const supabaseUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env var: VITE_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env var: VITE_SUPABASE_ANON_KEY')
}

// Create typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Common table types
export type UserProfile = Tables<'user_profiles'>
export type CourseLesson = Tables<'course_lessons'>
export type StudentAttendanceLog = Tables<'student_attendance_logs'>

// Authentication helpers
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// Profile helpers
export async function getCurrentUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return profile
}

// Authentication functions
export async function handleLogin(email: string, password: string) {
  try {
    console.log('🔐 Attempting login for:', email)

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      console.error('❌ Auth error:', error)
      throw error
    }

    console.log('✅ Authentication successful for:', authData.user.email)

    return {
      user: authData.user
      // Note: profile and role are handled by App component
    }

  } catch (error) {
    console.error('💥 Login error:', error)
    throw error
  }
}

export async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    console.log('✅ Logout successful')
  } catch (error) {
    console.error('💥 Logout error:', error)
    throw error
  }
}

// Role-based routing helper
export function getRouteByRole(role: string): string {
  const routes: Record<string, string> = {
    'Parent': '/dashboard/parent',
    'Teacher': '/dashboard/teacher',
    'Admin': '/dashboard/admin',
    'Student': '/dashboard/student',
    'Erzieher*innen': '/dashboard/teacher',
    'Externe': '/dashboard/external',
    'Super Admin': '/dashboard/admin'
  }

  return routes[role] || '/dashboard/parent'
}
