// Import the comprehensive implementation
import { ComprehensiveParentDashboard } from './ComprehensiveParentDashboard';

interface ParentDashboardProps {
  user: any;
}

export function ParentDashboard({ user }: ParentDashboardProps) {
  return <ComprehensiveParentDashboard user={user} />;
}
