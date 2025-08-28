import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ParentDashboard({ user }) {
  const [parentData, setParentData] = useState(null)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParentData()
  }, [])

  const fetchParentData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demo - replace with actual Supabase queries
      setParentData({
        first_name: 'Maria',
        last_name: 'Schmidt',
        email: user.email,
        children_count: 2
      })

      setChildren([
        { id: 1, name: 'Emma Schmidt', class: '3A', teacher: 'Frau Müller', attendance: 'present' },
        { id: 2, name: 'Max Schmidt', class: '5B', teacher: 'Herr Wagner', attendance: 'present' }
      ])
      
    } catch (error) {
      console.error('Error fetching parent data:', error)
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
                Parent Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {parentData?.first_name} {parentData?.last_name}
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
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Children</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {parentData?.children_count}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Messages</div>
                    <div className="text-2xl font-bold text-gray-900">3</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Events</div>
                    <div className="text-2xl font-bold text-gray-900">2</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Attendance</div>
                    <div className="text-2xl font-bold text-green-600">100%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Children Overview */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">My Children</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {children.map((child) => (
                  <div key={child.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{child.name}</div>
                        <div className="text-sm text-gray-600">Class {child.class}</div>
                        <div className="text-sm text-gray-500">Teacher: {child.teacher}</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          child.attendance === 'present' ? 'bg-green-100 text-green-800' :
                          child.attendance === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {child.attendance}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
