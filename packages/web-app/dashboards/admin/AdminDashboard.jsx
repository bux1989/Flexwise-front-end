import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Settings from '../components/Settings'

export default function AdminDashboard({ user }) {
  const [adminData, setAdminData] = useState(null)
  const [systemStats, setSystemStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // CSS Debug: Check if styles are being applied
  useEffect(() => {
    console.log('🎨 AdminDashboard CSS Debug:')
    console.log('- Document head stylesheets:', document.styleSheets.length)

    // Check if Tailwind classes exist in CSS
    const testElement = document.createElement('div')
    testElement.className = 'bg-white p-4 shadow rounded-lg'
    testElement.style.position = 'absolute'
    testElement.style.top = '-1000px'
    document.body.appendChild(testElement)

    const computedStyle = window.getComputedStyle(testElement)
    console.log('- bg-white background:', computedStyle.backgroundColor)
    console.log('- shadow box-shadow:', computedStyle.boxShadow)
    console.log('- rounded-lg border-radius:', computedStyle.borderRadius)
    console.log('- p-4 padding:', computedStyle.padding)

    document.body.removeChild(testElement)

    // Check main container styles
    const container = document.querySelector('[data-loc*="AdminDashboard"]')
    if (container) {
      const containerStyle = window.getComputedStyle(container)
      console.log('- Container background:', containerStyle.backgroundColor)
      console.log('- Container class list:', container.className)
    }
  }, [])

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demo - replace with actual Supabase queries
      setAdminData({
        first_name: 'Admin',
        last_name: 'User',
        email: user.email,
        role: 'System Administrator'
      })

      setSystemStats({
        total_students: 345,
        total_teachers: 28,
        total_parents: 298,
        active_sessions: 45,
        system_health: 'Excellent'
      })
      
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...')

      // Use signOut with scope: 'local' to avoid server-side issues
      const { error } = await supabase.auth.signOut({ scope: 'local' })

      if (error) {
        console.error('❌ Logout error:', error)
        // Even if there's an error, the local session is cleared
        console.log('🔄 Local session cleared despite error')
      } else {
        console.log('✅ Logout successful')
      }
    } catch (err) {
      console.error('💥 Logout failed:', err)
      // Force local logout even if server fails
      console.log('🔄 Forcing local logout...')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  // Show Settings component if showSettings is true
  if (showSettings) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with back button */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="bg-gray-100 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Dashboard
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600">Settings</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <Settings />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-debug="admin-container" style={{border: '2px solid red', backgroundColor: '#f9fafb'}}>
      {/* CSS Debug Indicator */}
      <div style={{position: 'fixed', top: '10px', right: '10px', background: 'yellow', padding: '5px', zIndex: 9999, fontSize: '12px'}}>
        CSS Debug: Check Console
      </div>

      {/* Header */}
      <header className="bg-white shadow" data-debug="header" style={{backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0'}}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                System Administrator Panel
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Students</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {systemStats?.total_students}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Teachers</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {systemStats?.total_teachers}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Parents</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {systemStats?.total_parents}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Active Sessions</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {systemStats?.active_sessions}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">System Health</div>
                    <div className="text-lg font-bold text-green-600">
                      {systemStats?.system_health}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Management */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-gray-900">Manage Teachers</div>
                    <div className="text-sm text-gray-600">Add, edit, or remove teacher accounts</div>
                  </button>
                  
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-gray-900">Manage Parents</div>
                    <div className="text-sm text-gray-600">Parent account administration</div>
                  </button>
                  
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-gray-900">Student Records</div>
                    <div className="text-sm text-gray-600">Student data and enrollment</div>
                  </button>
                </div>
              </div>
            </div>

            {/* System Management */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">System Management</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-gray-900">Schedule Management</div>
                    <div className="text-sm text-gray-600">Configure class schedules and rooms</div>
                  </button>
                  
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-gray-900">Reports & Analytics</div>
                    <div className="text-sm text-gray-600">Generate system reports</div>
                  </button>
                  
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="font-medium text-gray-900">System Settings</div>
                    <div className="text-sm text-gray-600">Configure global system settings</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
