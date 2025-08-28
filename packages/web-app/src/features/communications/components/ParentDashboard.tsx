import { supabase } from '../../../lib/supabase';
import { ParentStats } from './ParentStats';
import { ChildrenOverview } from './ChildrenOverview';
import { useParentData } from '../hooks/useParentData';

interface ParentDashboardProps {
  user: any;
}

export function ParentDashboard({ user }: ParentDashboardProps) {
  const { parentData, children, loading } = useParentData(user);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
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
          <ParentStats
            childrenCount={children.length}
            messagesCount={3}
            eventsCount={2}
            attendanceRate={100}
          />

          {/* Children Overview */}
          <ChildrenOverview children={children} loading={loading} />
        </div>
      </main>
    </div>
  );
}
