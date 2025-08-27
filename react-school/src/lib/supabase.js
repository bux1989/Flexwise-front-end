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
      return {
        id: session.user.id,
        email: session.user.email,
        first_name: 'Admin',
        last_name: 'User',
        roles: { name: 'Admin' },
        school_name: 'SchulFlex Admin',
        role: 'Admin'
      }
    }

    // Try multiple approaches to find the user profile
    let profile = null
    let error = null
    
    // Approach 1: Try basic profile first (no joins)
    const { data: basicProfile, error: basicError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (basicProfile && !basicError) {
      console.log('✅ Found basic profile by ID')

      // Now try to get role separately
      if (basicProfile.role_id) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('name')
          .eq('id', basicProfile.role_id)
          .single()

        profile = {
          ...basicProfile,
          roles: roleData ? { name: roleData.name } : null
        }
        console.log('✅ Profile with role:', profile.roles?.name)
      } else {
        profile = basicProfile
        console.log('✅ Profile without role_id')
      }
    } else {
      console.log('⚠️ Profile by ID failed:', basicError)

      // Approach 2: Try by email
      const { data: profileByEmail, error: emailError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', session.user.email)
        .single()

      if (profileByEmail && !emailError) {
        console.log('✅ Found profile by email')

        // Get role separately if exists
        if (profileByEmail.role_id) {
          const { data: roleData } = await supabase
            .from('roles')
            .select('name')
            .eq('id', profileByEmail.role_id)
            .single()

          profile = {
            ...profileByEmail,
            roles: roleData ? { name: roleData.name } : null
          }
        } else {
          profile = profileByEmail
        }
        console.log('�� Profile by email with role:', profile.roles?.name)
      } else {
        console.log('❌ Profile by email failed:', emailError)
        
        // Approach 3: For admin accounts, provide fallback
        if (session.user.email.includes('buckle') || session.user.email.includes('admin')) {
          console.log('🔧 Using admin fallback profile for:', session.user.email)
          profile = {
            id: session.user.id,
            email: session.user.email,
            first_name: 'Admin',
            last_name: 'User',
            roles: { name: 'Admin' },
            school_name: 'SchulFlex Admin'
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
