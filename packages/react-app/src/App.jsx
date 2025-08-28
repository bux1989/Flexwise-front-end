import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentUserProfile, getRouteByRole } from './lib/supabase'

// Components
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import ParentDashboard from './pages/ParentDashboard'
import ExternalDashboard from './pages/ExternalDashboard'
import AdminDashboard from './pages/AdminDashboard'

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

  // Profile loading logic
  const loadUserProfile = useCallback(async (user) => {
    try {
      setProfileLoading(true)
      console.log('👤 Loading profile for:', user.email)

      const profileId = user.user_metadata?.profile_id
      if (!profileId) {
        console.error('❌ No profile_id in user metadata for:', user.email)
        setUserProfile(createFallbackProfile(user, DEFAULT_ROLE))
        return
      }

      console.log('🔗 Looking up roles using profile_id:', profileId)

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*, roles(name)')
        .eq('user_profile_id', profileId)

      const role = extractUserRole(userRoles, rolesError)

      // Fetch profile details
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*, structure_schools(name)')
        .eq('id', profileId)
        .single()

      console.log('📋 Profile query result:', { profile, profileError })
      console.log('🏷️ Profile first_name:', profile?.first_name)

      setUserProfile({
        ...(profile || {}),
        id: profileId,
        email: user.email,
        first_name: profile?.first_name || 'User',
        last_name: profile?.last_name || '',
        role
      })

    } catch (error) {
      console.error('💥 Profile load error:', error)
      setUserProfile(createFallbackProfile(user, DEFAULT_ROLE))
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
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-lg text-gray-900">Loading Profile...</div>
            <div className="text-sm text-gray-500 mt-2">Setting up your dashboard</div>
          </div>
        </div>
      )
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

  // Authentication setup
  useEffect(() => {
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
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUserProfile])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-900">Loading...</div>
          <div className="text-sm text-gray-500 mt-2">Initializing FlexWise</div>
        </div>
      </div>
    )
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
