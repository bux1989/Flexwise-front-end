import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { AttendanceMatrix } from '../../../components/AttendanceMatrix';
import { Infoboard } from '../../../components/Infoboard';
import { MissingStaff } from '../../../components/MissingStaff';
import { Veranstaltungen } from '../../../components/Veranstaltungen';
import { TodosPlaceholder } from '../../../components/TodosPlaceholder';

interface AdminDashboardProps {
  user: any;
  onShowSettings: () => void;
}

export function AdminDashboard({ user, onShowSettings }: AdminDashboardProps) {
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

  const handleClassClick = (className: string) => {
    console.log('Class clicked:', className);
    // Future: Navigate to class detail view
  };

  const handleStatusClick = (status: string) => {
    console.log('Status clicked:', status);
    // Future: Navigate to status detail view
  };

  return (
    <div className="min-h-screen bg-background">
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

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Widget Grid - 5 widgets in asymmetric layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Row 1 - 3 widgets */}
          <div className="lg:col-span-1">
            <AttendanceMatrix
              onClassClick={handleClassClick}
              onStatusClick={handleStatusClick}
            />
          </div>
          <div className="lg:col-span-1">
            <Infoboard />
          </div>
          <div className="lg:col-span-1">
            <MissingStaff />
          </div>

          {/* Row 2 - 2 widgets, centered */}
          <div className="lg:col-span-1 lg:col-start-1">
            <Veranstaltungen />
          </div>
          <div className="lg:col-span-1">
            <TodosPlaceholder />
          </div>
        </div>
      </main>
    </div>
  );
}
