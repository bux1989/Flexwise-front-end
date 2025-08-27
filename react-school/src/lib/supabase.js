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

// Get current user profile using the correct connection pattern
export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ No authenticated user found')
      return null
    }
    
    console.log('👤 Getting profile for user:', {
      auth_id: user.id,
      email: user.email,
      profile_id: user.user_metadata?.profile_id
    })
    
    // Check if we have the profile_id in user_metadata
    const profileId = user.user_metadata?.profile_id
    
    if (!profileId) {
      console.error('❌ No profile_id found in user_metadata')
      
      // Fallback for admin emails
      if (user.email.includes('buckle') || user.email.includes('admin')) {
        console.log('🔧 Using admin fallback due to missing profile_id')
        return {
          id: user.id,
          email: user.email,
          first_name: 'Admin',
          last_name: 'User',
          roles: { name: 'Admin' },
          structure_schools: { name: 'SchulFlex Admin' },
          role: 'Admin'
        }
      }
      
      return null
    }
    
    // Use the correct connection pattern: user_metadata.profile_id → user_profiles.id
    console.log('🔗 Looking up profile using profile_id:', profileId)
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        roles(name),
        structure_schools(name)
      `)
      .eq('id', profileId)
      .single()
      
    if (error) {
      console.error('❌ Profile lookup failed:', error)
      
      // Fallback for admin emails
      if (user.email.includes('buckle') || user.email.includes('admin')) {
        console.log('🔧 Using admin fallback due to profile lookup error')
        return {
          id: user.id,
          email: user.email,
          first_name: 'Admin',
          last_name: 'User',
          roles: { name: 'Admin' },
          structure_schools: { name: 'SchulFlex Admin' },
          role: 'Admin'
        }
      }
      
      throw error
    }
    
    if (!profile) {
      console.error('❌ No profile found for profile_id:', profileId)
      return null
    }
    
    const role = profile.roles?.name || 'Parent'
    const school = profile.structure_schools?.name || 'Unknown School'
    
    console.log('✅ Profile loaded successfully:', {
      profile_id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      role: role,
      school: school
    })
    
    return {
      ...profile,
      role: role
    }
    
  } catch (error) {
    console.error('💥 Error in getCurrentUserProfile:', error)
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
