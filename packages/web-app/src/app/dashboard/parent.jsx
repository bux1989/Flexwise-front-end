import { ParentDashboard as ParentDashboardFeature } from '../../features/communications/components/ParentDashboard'
import { DebugOverlay } from '../../debug'

export default function ParentDashboard({ user }) {
  return (
    <DebugOverlay name="ParentDashboardWrapper">
      <ParentDashboardFeature user={user} />
    </DebugOverlay>
  )
}
