import { useState } from 'react'
import Settings from '../../../components/Settings'
import { AdminDashboard as AdminDashboardFeature } from '../../features/user-management/components/AdminDashboard'

export default function AdminDashboard({ user }) {
  const [showSettings, setShowSettings] = useState(false)

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
            </div>
          </div>
        </header>
        <Settings />
      </div>
    )
  }

  return (
    <AdminDashboardFeature
      user={user}
      onShowSettings={() => setShowSettings(true)}
    />
  )
}
