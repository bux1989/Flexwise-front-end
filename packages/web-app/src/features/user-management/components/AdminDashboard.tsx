import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { SystemStats } from './SystemStats';
import { AdminActions } from './AdminActions';
import { useAdminData } from '../hooks/useAdminData';

interface AdminDashboardProps {
  user: any;
  onShowSettings: () => void;
}

export function AdminDashboard({ user, onShowSettings }: AdminDashboardProps) {
  const { adminData, systemStats, loading } = useAdminData(user);

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('❌ Logout error:', error);
        console.log('🔄 Local session cleared despite error');
      } else {
        console.log('✅ Logout successful');
      }
    } catch (err) {
      console.error('💥 Logout failed:', err);
      console.log('🔄 Forcing local logout...');
    }
  };

  const handleAdminAction = (action: string) => {
    console.log(`Admin action: ${action}`);
    alert(`${action} will be available soon`);
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                System Administrator Panel
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onShowSettings}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* System Stats */}
          <SystemStats stats={systemStats} loading={loading} />

          {/* Admin Actions */}
          <AdminActions
            onManageTeachers={() => handleAdminAction('Manage Teachers')}
            onManageParents={() => handleAdminAction('Manage Parents')}
            onManageStudents={() => handleAdminAction('Manage Students')}
            onScheduleManagement={() => handleAdminAction('Schedule Management')}
            onReportsAnalytics={() => handleAdminAction('Reports & Analytics')}
            onSystemSettings={() => handleAdminAction('System Settings')}
          />
        </div>
      </main>
    </div>
  );
}
