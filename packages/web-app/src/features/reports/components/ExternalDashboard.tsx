import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ExternalAccessNotice } from './ExternalAccessNotice';
import { ExternalStats } from './ExternalStats';
import { AvailableReports } from './AvailableReports';

interface ExternalDashboardProps {
  user: any;
}

export function ExternalDashboard({ user }: ExternalDashboardProps) {
  const [externalData, setExternalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExternalData();
  }, []);

  const fetchExternalData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demo - replace with actual Supabase queries
      setExternalData({
        first_name: 'Dr. Klaus',
        last_name: 'Meier',
        email: user?.email || 'klaus.meier@consultant.de',
        organization: 'Educational Consultant',
        access_level: 'read-only'
      });
      
    } catch (error) {
      console.error('Error fetching external data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleViewReport = (reportTitle: string) => {
    console.log(`Viewing report: ${reportTitle}`);
    alert(`${reportTitle} report will be available soon`);
  };

  const reports = [
    {
      id: 1,
      title: 'School Statistics Overview',
      description: 'General enrollment and performance metrics',
      onView: () => handleViewReport('School Statistics Overview')
    },
    {
      id: 2,
      title: 'Attendance Trends',
      description: 'Monthly attendance patterns and analysis',
      onView: () => handleViewReport('Attendance Trends')
    },
    {
      id: 3,
      title: 'Program Effectiveness',
      description: 'Educational program outcomes and assessments',
      onView: () => handleViewReport('Program Effectiveness')
    }
  ];

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
                External Access Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome, {externalData?.first_name} {externalData?.last_name}
              </p>
              <p className="text-sm text-gray-500">{externalData?.organization}</p>
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
          {/* Access Level Notice */}
          <ExternalAccessNotice />

          {/* Statistics Overview */}
          <ExternalStats
            reportsAvailable={5}
            lastAccess="Today"
            accessExpires="30 days"
          />

          {/* Available Reports */}
          <AvailableReports reports={reports} />
        </div>
      </main>
    </div>
  );
}
