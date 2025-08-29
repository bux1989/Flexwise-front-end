import { Student } from '../../user-management/types/user';
import { DebugOverlay } from '../../../debug';

interface ChildrenOverviewProps {
  children: Student[];
  loading?: boolean;
}

export function ChildrenOverview({ children, loading }: ChildrenOverviewProps) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                <div className="h-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DebugOverlay name="ChildrenOverview">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">My Children</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {children.map((child) => (
              <div key={child.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-gray-900">{child.name}</div>
                    <div className="text-sm text-gray-600">Class {child.class}</div>
                    <div className="text-sm text-gray-500">Teacher: Frau Müller</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      present
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DebugOverlay>
  );
}
