import { DebugOverlay } from '../../../debug';

interface ReportItem {
  id: number;
  title: string;
  description: string;
  onView: () => void;
}

interface AvailableReportsProps {
  reports: ReportItem[];
}

export function AvailableReports({ reports }: AvailableReportsProps) {
  return (
    <DebugOverlay name="AvailableReports">
      <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Available Reports</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-gray-900">{report.title}</h4>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
                <button 
                  onClick={report.onView}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </DebugOverlay>
  );
}
