import { ExternalDashboard as ExternalDashboardFeature } from '../../features/reports/components/ExternalDashboard'
import { DebugOverlay } from '../../debug'

export default function ExternalDashboard({ user }) {
  return (
    <DebugOverlay name="ExternalDashboardWrapper">
      <ExternalDashboardFeature user={user} />
    </DebugOverlay>
  )
}
