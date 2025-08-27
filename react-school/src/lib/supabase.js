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
    
    // Try multiple approaches to find the user profile
    let profile = null
    let error = null
    
    // Approach 1: Try by auth user ID
    const { data: profileById, error: errorById } = await supabase
      .from('user_profiles')
      .select(`
        *,
        roles(name),
        structure_schools(name)
      `)
      .eq('id', session.user.id)
      .single()
      
    if (profileById && !errorById) {
      profile = profileById
      console.log('✅ Found profile by ID:', profile.roles?.name)
    } else {
      console.log('⚠️ Profile by ID failed:', errorById)
      
      // Approach 2: Try by email
      const { data: profileByEmail, error: errorByEmail } = await supabase
        .from('user_profiles')
        .select(`
          *,
          roles(name),
          structure_schools(name)
        `)
        .eq('email', session.user.email)
        .single()
        
      if (profileByEmail && !errorByEmail) {
        profile = profileByEmail
        console.log('✅ Found profile by email:', profile.roles?.name)
      } else {
        console.log('❌ Profile by email failed:', errorByEmail)
        
        // Approach 3: For admin account, provide fallback
        if (session.user.email === 'buckle+2@opendoors.team') {
          console.log('🔧 Using admin fallback profile')
          profile = {
            id: session.user.id,
            email: session.user.email,
            first_name: 'Admin',
            last_name: 'User',
            roles: { name: 'Admin' },
            structure_schools: { name: 'SchulFlex Admin' }
          }
        }
      }
    }
    
    if (!profile) {
      console.error('❌ Could not load user profile')
      return null
    }
    
    const role = profile.roles?.name || 'Parent'
    console.log('🎭 Final role:', role)
    
    return {
      ...profile,
      role: role
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
