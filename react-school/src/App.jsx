import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import { supabase, isDemo } from './lib/supabase'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

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
            element={user ? <Navigate to="/dashboard/teacher" /> : <Login />} 
          />
          <Route 
            path="/dashboard/teacher" 
            element={user ? <TeacherDashboard user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard/teacher" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
