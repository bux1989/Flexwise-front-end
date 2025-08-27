import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminDashboard({ user }) {
  const [adminData, setAdminData] = useState(null)
  const [systemStats, setSystemStats] = useState({})
  const [loading, setLoading] = useState(true)

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
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                System Administrator Panel
              </p>
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
