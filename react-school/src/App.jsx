import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import ParentDashboard from './pages/ParentDashboard'
import ExternalDashboard from './pages/ExternalDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { supabase, getCurrentUserProfile, getRouteByRole, setupRLSContext } from './lib/supabase'

function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        await loadUserProfile(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserProfile(null)
        setUserRole(null)
        sessionStorage.removeItem('userContext')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const initializeAuth = async () => {
    try {
      // Check if user is already authenticated
      const session = await setupRLSContext()
      
      if (session) {
        await loadUserProfile(session.user)
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async (user) => {
    try {
      setUser(user)
      
      // Get user profile with role
      const profile = await getCurrentUserProfile()
      
      if (profile) {
        setUserProfile(profile)
        setUserRole(profile.role)

        console.log('User loaded in App:', {
          email: user.email,
          role: profile.role,
          school: profile.structure_schools?.name,
          fullProfile: profile
        })

        console.log('Dashboard path for role:', getRouteByRole(profile.role))
      } else {
        console.error('No profile found for user')
        // Could redirect to profile setup page
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Handle error - maybe redirect to login
    }
  }

  const getDashboardPath = () => {
    if (!userRole) return '/dashboard/parent' // default
    return getRouteByRole(userRole)
  }

  const renderDashboard = (role) => {
    switch (role) {
      case 'Admin':
      case 'Super Admin':
        return <AdminDashboard user={user} profile={userProfile} />
      case 'Teacher':
      case 'Erzieher*innen':
        return <TeacherDashboard user={user} profile={userProfile} />
      case 'Parent':
        return <ParentDashboard user={user} profile={userProfile} />
      case 'Externe':
        return <ExternalDashboard user={user} profile={userProfile} />
      default:
        return <ParentDashboard user={user} profile={userProfile} />
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
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to={getDashboardPath()} replace /> : <Login />} 
          />
          
          {/* Teacher Dashboard - for teachers and erzieher */}
          <Route 
            path="/dashboard/teacher" 
            element={user ? renderDashboard('Teacher') : <Navigate to="/login" replace />} 
          />
          
          {/* Parent Dashboard */}
          <Route 
            path="/dashboard/parent" 
            element={user ? renderDashboard('Parent') : <Navigate to="/login" replace />} 
          />
          
          {/* External Dashboard */}
          <Route 
            path="/dashboard/external" 
            element={user ? renderDashboard('Externe') : <Navigate to="/login" replace />} 
          />
          
          {/* Admin Dashboard */}
          <Route 
            path="/dashboard/admin" 
            element={user ? renderDashboard('Admin') : <Navigate to="/login" replace />} 
          />
          
          {/* Student Dashboard (if needed) */}
          <Route 
            path="/dashboard/student" 
            element={user ? renderDashboard('Student') : <Navigate to="/login" replace />} 
          />
          
          {/* Root redirect */}
          <Route 
            path="/" 
            element={<Navigate to={user ? getDashboardPath() : "/login"} replace />} 
          />
          
          {/* Catch all - redirect to appropriate dashboard or login */}
          <Route 
            path="*" 
            element={<Navigate to={user ? getDashboardPath() : "/login"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
