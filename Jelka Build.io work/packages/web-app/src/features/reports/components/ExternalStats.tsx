import { DebugOverlay } from '../../../debug';

interface ExternalStatsProps {
  reportsAvailable: number;
  lastAccess: string;
  accessExpires: string;
}

export function ExternalStats({ reportsAvailable, lastAccess, accessExpires }: ExternalStatsProps) {
  return (
    <DebugOverlay name="ExternalStats">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">Reports Available</div>
              <div className="text-2xl font-bold text-gray-900">{reportsAvailable}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">Last Access</div>
              <div className="text-lg font-bold text-gray-900">{lastAccess}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500">Access Expires</div>
              <div className="text-lg font-bold text-gray-900">{accessExpires}</div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </DebugOverlay>
  );
}
