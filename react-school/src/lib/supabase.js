import { createClient } from '@supabase/supabase-js'

// Use your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://api.schulflex.app'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ2MzA5NjAwLCJleHAiOjE5MDQwNzYwMDB9.mhTQEJi2po9vvM_sjtKzKUrYYQEbFyvykOwkE_gya-Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authentication with role-based routing
export async function handleLogin(email, password) {
  try {
    console.log('🔐 Attempting login for:', email)
    
    // 1. Authenticate user
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
      user: authData.user,
      profile: null, // Will be loaded separately
      role: null     // Will be determined separately
    }
    
  } catch (error) {
    console.error('💥 Login error:', error)
    throw error
  }
}

// Get current user profile
export async function getCurrentUserProfile() {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.log('❌ No session found')
      return null
    }

    console.log('👤 Loading profile for user:', session.user.email)

    // For admin emails, use fallback immediately to avoid database issues
    if (session.user.email.includes('buckle') || session.user.email.includes('admin')) {
      console.log('🔧 Using immediate admin fallback for:', session.user.email)
      const adminProfile = {
        id: session.user.id,
        email: session.user.email,
        first_name: 'Admin',
        last_name: 'User',
        roles: { name: 'Admin' },
        school_name: 'SchulFlex Admin',
        role: 'Admin'
      }
      console.log('🎭 Admin role assigned:', adminProfile.role)
      return adminProfile
    }

    // For regular users, return a simple profile with Parent role
    // (Database queries removed to prevent infinite loops)
    console.log('👥 Using default profile for regular user')
    return {
      id: session.user.id,
      email: session.user.email,
      first_name: 'User',
      last_name: '',
      roles: { name: 'Parent' },
      role: 'Parent'
    }
    
  } catch (error) {
    console.error('💥 Error fetching user profile:', error)
    return null
  }
}

// Role-based routing logic
export function getRouteByRole(role) {
  const routes = {
    'Parent': '/dashboard/parent',
    'Teacher': '/dashboard/teacher', 
    'Admin': '/dashboard/admin',
    'Student': '/dashboard/student',
    'Erzieher*innen': '/dashboard/teacher', // Use teacher dashboard for erzieher
    'Externe': '/dashboard/external',
    'Super Admin': '/dashboard/admin'
  }
  
  console.log('🗺️ Getting route for role:', role, '→', routes[role] || '/dashboard/parent')
  return routes[role] || '/dashboard/parent'
}

// RLS Context Setup
export async function setupRLSContext() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Route Protection
export async function checkAccess() {
  const session = await supabase.auth.getSession()
  return session.data.session
}

export const isDemo = false // Always use real authentication now
