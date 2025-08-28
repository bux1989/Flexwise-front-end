import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ExternalDashboard({ user }) {
  const [externalData, setExternalData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExternalData()
  }, [])

  const fetchExternalData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demo - replace with actual Supabase queries
      setExternalData({
        first_name: 'Dr. Klaus',
        last_name: 'Meier',
        email: user.email,
        organization: 'Educational Consultant',
        access_level: 'read-only'
      })
      
    } catch (error) {
      console.error('Error fetching external data:', error)
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
                External Access Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome, {externalData?.first_name} {externalData?.last_name}
              </p>
              <p className="text-sm text-gray-500">{externalData?.organization}</p>
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
          {/* Access Level Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  External Access - Read Only
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>You have limited access to view school information for consultation purposes.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Reports Available</div>
                    <div className="text-2xl font-bold text-gray-900">5</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Last Access</div>
                    <div className="text-lg font-bold text-gray-900">Today</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Access Expires</div>
                    <div className="text-lg font-bold text-gray-900">30 days</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available Reports */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Available Reports</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">School Statistics Overview</h4>
                      <p className="text-sm text-gray-600">General enrollment and performance metrics</p>
                    </div>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      View
                    </button>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">Attendance Trends</h4>
                      <p className="text-sm text-gray-600">Monthly attendance patterns and analysis</p>
                    </div>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      View
                    </button>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">Program Effectiveness</h4>
                      <p className="text-sm text-gray-600">Educational program outcomes and assessments</p>
                    </div>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
