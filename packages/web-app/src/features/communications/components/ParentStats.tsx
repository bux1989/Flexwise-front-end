interface ParentStatsProps {
  childrenCount: number;
  messagesCount: number;
  eventsCount: number;
  attendanceRate: number;
}

export function ParentStats({ childrenCount, messagesCount, eventsCount, attendanceRate }: ParentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">Children</div>
              <div className="text-2xl font-bold text-gray-900">
                {childrenCount}
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
              <div className="text-2xl font-bold text-gray-900">{messagesCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">Events</div>
              <div className="text-2xl font-bold text-gray-900">{eventsCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">Attendance</div>
              <div className="text-2xl font-bold text-green-600">{attendanceRate}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
