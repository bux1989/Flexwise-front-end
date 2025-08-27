import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import ParentDashboard from './pages/ParentDashboard'
import ExternalDashboard from './pages/ExternalDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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
  }, [])

  const loadUserProfile = async (user) => {
    try {
      console.log('👤 Loading profile for:', user.email)

      // Use the EXACT same pattern as the working RLS dashboard
      const profileId = user.user_metadata?.profile_id

      if (!profileId) {
        console.error('❌ No profile_id in user metadata for:', user.email)
        setUserProfile({
          id: user.id,
          email: user.email,
          first_name: 'User',
          last_name: '',
          role: 'Parent'
        })
        setLoading(false)
        return
      }

      console.log('🔗 Looking up roles using profile_id:', profileId)

      // Use the EXACT same query as the working dashboard
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles(name)
        `)
        .eq('user_profile_id', profileId)

      let role = 'Parent' // fallback

      if (!error && userRoles && userRoles.length > 0) {
        const roleNames = userRoles.map(ur => ur.roles?.name).filter(Boolean)
        role = roleNames.join(', ') || 'Parent'
        console.log('✅ Roles found:', roleNames)
      } else {
        console.log('⚠️ No roles found, using Parent fallback')
      }

      // Also get profile details
      const { data: profile } = await supabase
        .from('user_profiles')
        .select(`
          *,
          structure_schools(name)
        `)
        .eq('id', profileId)
        .single()

      setUserProfile({
        ...(profile || {}),
        id: profileId,
        email: user.email,
        first_name: profile?.first_name || 'User',
        last_name: profile?.last_name || '',
        role: role
      })

    } catch (error) {
      console.error('💥 Profile load error:', error)
      setUserProfile({
        id: user.id,
        email: user.email,
        first_name: 'User',
        last_name: '',
        role: 'Parent'
      })
    } finally {
      setLoading(false)
    }
  }

  const getDashboardPath = () => {
    if (!userProfile) return '/dashboard/parent'
    
    const routes = {
      'Admin': '/dashboard/admin',
      'Super Admin': '/dashboard/admin',
      'Teacher': '/dashboard/teacher',
      'Erzieher*innen': '/dashboard/teacher',
      'Parent': '/dashboard/parent',
      'Externe': '/dashboard/external',
      'Student': '/dashboard/parent'
    }
    
    return routes[userProfile.role] || '/dashboard/parent'
  }

  const renderDashboard = () => {
    if (!userProfile) return <Navigate to="/login" replace />

    switch (userProfile.role) {
      case 'Admin':
      case 'Super Admin':
        return <AdminDashboard user={session.user} profile={userProfile} />
      case 'Teacher':
      case 'Erzieher*innen':
        return <TeacherDashboard user={session.user} profile={userProfile} />
      case 'Externe':
        return <ExternalDashboard user={session.user} profile={userProfile} />
      default:
        return <ParentDashboard user={session.user} profile={userProfile} />
    }
  }

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
