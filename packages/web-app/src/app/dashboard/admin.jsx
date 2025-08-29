import { useState } from 'react'
import Settings from '../../components/Settings'
import { AdminDashboard as AdminDashboardFeature } from '../../features/user-management/components/AdminDashboard'
import { DebugOverlay } from '../../debug'

export default function AdminDashboard({ user }) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <DebugOverlay name="AdminDashboardWrapper">
      <AdminDashboardFeature
        user={user}
        onShowSettings={() => setShowSettings(true)}
        showSettings={showSettings}
        onBackToDashboard={() => setShowSettings(false)}
      />
    </DebugOverlay>
  )
}
