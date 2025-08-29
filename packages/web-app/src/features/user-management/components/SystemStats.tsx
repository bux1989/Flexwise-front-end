import { SystemStats as SystemStatsType } from '../types/user';

interface SystemStatsProps {
  stats: SystemStatsType;
  loading?: boolean;
}

export function SystemStats({ stats, loading }: SystemStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DebugOverlay name="SystemStats">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">Students</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total_students}
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
                {stats.total_teachers}
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
                {stats.total_parents}
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
                {stats.active_sessions}
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
                {stats.system_health}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </DebugOverlay>
  );
}
