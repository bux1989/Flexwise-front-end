// Import the comprehensive implementation
import { ComprehensiveParentDashboard } from './ComprehensiveParentDashboard';
import { DebugOverlay } from '../../../debug';

interface ParentDashboardProps {
  user: any;
}

export function ParentDashboard({ user }: ParentDashboardProps) {
  return (
    <DebugOverlay name="ParentDashboard">
      <ComprehensiveParentDashboard user={user} />
    </DebugOverlay>
  );
}
