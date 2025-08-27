import { createClient } from '@supabase/supabase-js'

// Use your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://api.schulflex.app'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ2MzA5NjAwLCJleHAiOjE5MDQwNzYwMDB9.mhTQEJi2po9vvM_sjtKzKUrYYQEbFyvykOwkE_gya-Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authentication with role-based routing
export async function handleLogin(email, password) {
  try {
    // 1. Authenticate user
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (error) throw error
    
    // 2. Get user profile with role information
    console.log('Looking up profile for user:', authData.user.id, authData.user.user_metadata)

    let { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        roles(name),
        structure_schools(name)
      `)
      .eq('id', authData.user.user_metadata?.profile_id || authData.user.id)
      .single()

    console.log('Profile query result:', { profile, profileError })

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Try alternative lookup by email if profile_id lookup fails
      const { data: profileByEmail, error: emailError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          roles(name),
          structure_schools(name)
        `)
        .eq('email', authData.user.email)
        .single()

      console.log('Profile by email result:', { profileByEmail, emailError })

      if (emailError) {
        throw new Error('Could not fetch user profile')
      } else {
        profile = profileByEmail
      }
    }
    
    // 3. Store user context for RLS
    const detectedRole = profile.roles?.name || 'Parent'
    console.log('Role detection:', {
      profileRoles: profile.roles,
      detectedRole,
      profileData: profile
    })

    const userContext = {
      userId: profile.id,
      schoolId: profile.school_id,
      role: detectedRole
    }

    sessionStorage.setItem('userContext', JSON.stringify(userContext))

    return {
      user: authData.user,
      profile: profile,
      role: detectedRole
    }
    
  } catch (error) {
    console.error('Login error:', error)
    throw error
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
  
  return routes[role] || '/dashboard/parent'
}

// RLS Context Setup
export async function setupRLSContext() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return null
  }
  
  // RLS policies automatically use auth.uid() and auth.get_current_user_school_id()
  return session
}

// Route Protection
export async function checkAccess() {
  const session = await supabase.auth.getSession()
  return session.data.session
}

// Get current user profile
export async function getCurrentUserProfile() {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return null

    console.log('getCurrentUserProfile for session user:', session.user.id, session.user.email)

    let { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        roles(name),
        structure_schools(name)
      `)
      .eq('id', session.user.user_metadata?.profile_id || session.user.id)
      .single()

    console.log('getCurrentUserProfile result:', { profile, error })

    if (error) {
      // Try by email as fallback
      const { data: profileByEmail, error: emailError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          roles(name),
          structure_schools(name)
        `)
        .eq('email', session.user.email)
        .single()

      console.log('getCurrentUserProfile by email:', { profileByEmail, emailError })

      if (emailError) throw emailError
      profile = profileByEmail
    }

    const finalRole = profile.roles?.name || 'Parent'
    console.log('Final role determined:', finalRole)

    return {
      ...profile,
      role: finalRole
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

export const isDemo = false // Always use real authentication now
