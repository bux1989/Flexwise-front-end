import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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

      // For admin emails, use immediate assignment
      if (user.email.includes('buckle') || user.email.includes('admin')) {
        console.log('🔧 Admin user detected')
        setUserProfile({
          id: user.id,
          email: user.email,
          first_name: 'Admin',
          last_name: 'User',
          role: 'Admin'
        })
        setLoading(false)
        return
      }

      // Direct lookup using auth.uid() as profile ID
      console.log('🔗 Looking up profile with user.id:', user.id)
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          roles(name),
          structure_schools(name)
        `)
        .eq('id', user.id)  // Direct mapping: user.id = user_profiles.id
        .single()

      if (profile && !error) {
        console.log('✅ Profile loaded:', profile.roles?.name)
        setUserProfile({
          ...profile,
          role: profile.roles?.name || 'Parent'
        })
      } else {
        console.log('⚠️ Profile not found, using default')
        setUserProfile({
          id: user.id,
          email: user.email,
          first_name: 'User',
          last_name: '',
          role: 'Parent'
        })
      }
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
