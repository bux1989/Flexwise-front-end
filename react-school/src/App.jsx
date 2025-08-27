import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import ParentDashboard from './pages/ParentDashboard'
import ExternalDashboard from './pages/ExternalDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { supabase, isDemo } from './lib/supabase'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserRole(session.user)
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (user) => {
    try {
      if (isDemo) {
        // Demo mode - determine role based on email domain or keywords
        const email = user.email.toLowerCase()
        if (email.includes('admin')) {
          setUserRole('admin')
        } else if (email.includes('teacher') || email.includes('erzieher')) {
          setUserRole('teacher')
        } else if (email.includes('parent') || email.includes('eltern')) {
          setUserRole('parent')
        } else if (email.includes('external') || email.includes('consultant')) {
          setUserRole('external')
        } else {
          // Default to parent for demo
          setUserRole('parent')
        }
      } else {
        // Real Supabase - query user role from your database
        // This is where you'd query your actual user roles table
        // Example:
        // const { data, error } = await supabase
        //   .from('user_profiles')
        //   .select('role')
        //   .eq('user_id', user.id)
        //   .single()
        
        // if (data) {
        //   setUserRole(data.role)
        // } else {
        //   setUserRole('parent') // default
        // }
        
        // For now, use demo logic
        const email = user.email.toLowerCase()
        if (email.includes('admin')) {
          setUserRole('admin')
        } else if (email.includes('teacher') || email.includes('erzieher')) {
          setUserRole('teacher')
        } else if (email.includes('parent') || email.includes('eltern')) {
          setUserRole('parent')
        } else if (email.includes('external') || email.includes('consultant')) {
          setUserRole('external')
        } else {
          setUserRole('parent') // default
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole('parent') // default fallback
    }
  }

  const getDashboardPath = () => {
    switch (userRole) {
      case 'admin':
        return '/dashboard/admin'
      case 'teacher':
        return '/dashboard/teacher'
      case 'parent':
        return '/dashboard/parent'
      case 'external':
        return '/dashboard/external'
      default:
        return '/dashboard/parent'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isDemo && (
          <div className="bg-yellow-100 text-yellow-800 p-2 text-center text-sm">
            🔄 Demo Mode - Add your Supabase credentials to .env for full functionality
          </div>
        )}
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to={getDashboardPath()} /> : <Login />} 
          />
          
          {/* Teacher Dashboard - for teachers and erzieher */}
          <Route 
            path="/dashboard/teacher" 
            element={user ? <TeacherDashboard user={user} /> : <Navigate to="/login" />} 
          />
          
          {/* Parent Dashboard */}
          <Route 
            path="/dashboard/parent" 
            element={user ? <ParentDashboard user={user} /> : <Navigate to="/login" />} 
          />
          
          {/* External Dashboard */}
          <Route 
            path="/dashboard/external" 
            element={user ? <ExternalDashboard user={user} /> : <Navigate to="/login" />} 
          />
          
          {/* Admin Dashboard */}
          <Route 
            path="/dashboard/admin" 
            element={user ? <AdminDashboard user={user} /> : <Navigate to="/login" />} 
          />
          
          {/* Root redirect */}
          <Route 
            path="/" 
            element={<Navigate to={user ? getDashboardPath() : "/login"} />} 
          />
          
          {/* Catch all - redirect to appropriate dashboard or login */}
          <Route 
            path="*" 
            element={<Navigate to={user ? getDashboardPath() : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
