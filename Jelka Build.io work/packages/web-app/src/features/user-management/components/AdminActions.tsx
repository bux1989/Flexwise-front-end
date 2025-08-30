import { DebugOverlay } from '../../../debug';

interface AdminActionsProps {
  onManageTeachers: () => void;
  onManageParents: () => void;
  onManageStudents: () => void;
  onScheduleManagement: () => void;
  onReportsAnalytics: () => void;
  onSystemSettings: () => void;
}

export function AdminActions({
  onManageTeachers,
  onManageParents,
  onManageStudents,
  onScheduleManagement,
  onReportsAnalytics,
  onSystemSettings
}: AdminActionsProps) {
  return (
    <DebugOverlay name="AdminActions">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* User Management */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">User Management</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <button 
              onClick={onManageTeachers}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">Manage Teachers</div>
              <div className="text-sm text-gray-600">Add, edit, or remove teacher accounts</div>
            </button>
            
            <button 
              onClick={onManageParents}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">Manage Parents</div>
              <div className="text-sm text-gray-600">Parent account administration</div>
            </button>
            
            <button 
              onClick={onManageStudents}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">Student Records</div>
              <div className="text-sm text-gray-600">Student data and enrollment</div>
            </button>
          </div>
        </div>
      </div>

      {/* System Management */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Management</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <button 
              onClick={onScheduleManagement}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">Schedule Management</div>
              <div className="text-sm text-gray-600">Configure class schedules and rooms</div>
            </button>
            
            <button 
              onClick={onReportsAnalytics}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">Reports & Analytics</div>
              <div className="text-sm text-gray-600">Generate system reports</div>
            </button>
            
            <button 
              onClick={onSystemSettings}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="font-medium text-gray-900">System Settings</div>
              <div className="text-sm text-gray-600">Configure global system settings</div>
            </button>
          </div>
        </div>
      </div>
      </div>
    </DebugOverlay>
  );
}
