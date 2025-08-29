import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentUserProfile, getRouteByRole } from './lib/supabase'

// Components
import Login from './app/auth/login'
import TeacherDashboard from './app/dashboard/teacher'
import ParentDashboard from './app/dashboard/parent'
import ExternalDashboard from './app/dashboard/external'
import AdminDashboard from './app/dashboard/admin'
import LoadingScreen from './components/LoadingScreen'

// Constants
const ROLE_ROUTES = {
  'Admin': '/dashboard/admin',
  'Super Admin': '/dashboard/admin',
  'Teacher': '/dashboard/teacher',
  'Erzieher*innen': '/dashboard/teacher',
  'Parent': '/dashboard/parent',
  'Externe': '/dashboard/external',
  'Student': '/dashboard/parent'
}

const DEFAULT_ROUTE = '/dashboard/parent'
const DEFAULT_ROLE = 'Parent'

// Helper functions moved outside component to prevent recreation
const createFallbackProfile = (user, role) => ({
  id: user.id,
  email: user.email,
  first_name: 'User',
  last_name: '',
  role
})

const extractUserRole = (userRoles, error) => {
  if (!error && userRoles?.length > 0) {
    const roleNames = userRoles.map(ur => ur.roles?.name).filter(Boolean)
    const role = roleNames.join(', ') || DEFAULT_ROLE
    console.log('✅ Roles found:', roleNames)
    return role
  } else {
    console.log('⚠️ No roles found, using fallback')
    return DEFAULT_ROLE
  }
}

function App() {
  // State
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [showStartupScreen, setShowStartupScreen] = useState(true)
  const [showLoginTransition, setShowLoginTransition] = useState(false)

  // Profile loading logic
  const loadUserProfile = useCallback(async (user) => {
    try {
      setProfileLoading(true)
      console.log('👤 Loading profile for:', user.email)

      const profileId = user.user_metadata?.profile_id
      if (!profileId) {
        console.error('❌ No profile_id in user metadata for:', user.email)
        console.log('🔍 User metadata:', user.user_metadata)
        const fallbackProfile = createFallbackProfile(user, DEFAULT_ROLE)
        console.log('🚨 Using fallback profile:', fallbackProfile)
        setUserProfile(fallbackProfile)
        return
      }

      console.log('🔗 Looking up roles using profile_id:', profileId)

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*, roles(name)')
        .eq('user_profile_id', profileId)

      const role = extractUserRole(userRoles, rolesError)

      // Fetch profile details - specify school relationship explicitly
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*, structure_schools!profiles_school_id_fkey(name)')
        .eq('id', profileId)
        .single()

      console.log('📋 Profile query result:', { profile, profileError })
      if (profileError) {
        console.error('🚨 Profile query error details:', profileError)
        console.error('🚨 Error message:', profileError.message)
        console.error('🚨 Error code:', profileError.code)
        console.error('🚨 Full error:', JSON.stringify(profileError, null, 2))
      }
      console.log('🏷️ Profile first_name:', profile?.first_name)

      const finalProfile = {
        ...(profile || {}),
        id: profileId,
        email: user.email,
        first_name: profile?.first_name || 'User',
        last_name: profile?.last_name || '',
        role
      }

      console.log('🎯 Final profile being set:', finalProfile)
      setUserProfile(finalProfile)

    } catch (error) {
      console.error('💥 Profile load error:', error)
      const fallbackProfile = createFallbackProfile(user, DEFAULT_ROLE)
      console.log('🚨 Using fallback profile due to error:', fallbackProfile)
      setUserProfile(fallbackProfile)
    } finally {
      setLoading(false)
      setProfileLoading(false)
    }
  }, []) // Empty dependency array to prevent recreation

  const getDashboardPath = () => {
    if (!userProfile) return DEFAULT_ROUTE
    return ROLE_ROUTES[userProfile.role] || DEFAULT_ROUTE
  }

  const renderDashboard = () => {
    // If profile is loading, show loading state instead of redirecting
    if (!userProfile && profileLoading) {
      return <LoadingScreen onComplete={() => setProfileLoading(false)} minDisplayTime={1500} />
    }

    // If no profile and not loading, redirect to login
    if (!userProfile) return <Navigate to="/login" replace />

    const dashboardProps = { user: session.user, profile: userProfile }

    switch (userProfile.role) {
      case 'Admin':
      case 'Super Admin':
        return <AdminDashboard {...dashboardProps} />
      case 'Teacher':
      case 'Erzieher*innen':
        return <TeacherDashboard {...dashboardProps} />
      case 'Externe':
        return <ExternalDashboard {...dashboardProps} />
      default:
        return <ParentDashboard {...dashboardProps} />
    }
  }

  // PWA Startup screen
  useEffect(() => {
    // Start login transition before startup screen ends for crossfade effect
    const loginTransitionTimer = setTimeout(() => {
      setShowLoginTransition(true)
    }, 1900) // Start login fade-in 600ms before startup ends

    // Hide startup screen
    const startupTimer = setTimeout(() => {
      setShowStartupScreen(false)
    }, 2500) // Show for 2.5 seconds

    return () => {
      clearTimeout(loginTransitionTimer)
      clearTimeout(startupTimer)
    }
  }, [])

  // Authentication setup
  useEffect(() => {
    // Only start auth check when login transition begins
    if (!showLoginTransition) return

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📡 Initial session:', session ? 'Found' : 'None')
      setSession(session)
      if (session) {
        loadUserProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state change:', _event, session ? 'with session' : 'no session')
      setSession(session)
      if (session) {
        loadUserProfile(session.user)
      } else {
        // Clear all user state when session is lost
        console.log('🧹 Clearing user state due to missing session')
        setUserProfile(null)
        setProfileLoading(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUserProfile, showLoginTransition])

  // PWA Startup screen
  if (showStartupScreen && !showLoginTransition) {
    return <LoadingScreen onComplete={() => setShowStartupScreen(false)} minDisplayTime={2500} />
  }

  // Crossfade transition period - show both screens
  if (showStartupScreen && showLoginTransition) {
    return (
      <>
        <LoadingScreen onComplete={() => setShowStartupScreen(false)} minDisplayTime={2500} />
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000 }}>
          <Login />
        </div>
      </>
    )
  }

  // Loading state
  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />
  }

  // Main render
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {!session ? (
          <Login />
        ) : (
          <Routes>
            <Route path="/login" element={<Navigate to={getDashboardPath()} replace />} />
            <Route path="/dashboard/admin" element={renderDashboard()} />
            <Route path="/dashboard/teacher" element={renderDashboard()} />
            <Route path="/dashboard/parent" element={renderDashboard()} />
            <Route path="/dashboard/external" element={renderDashboard()} />
            <Route path="/" element={<Navigate to={getDashboardPath()} replace />} />
            <Route path="*" element={<Navigate to={getDashboardPath()} replace />} />
          </Routes>
        )}
      </div>
    </Router>
  )
}

export default App
