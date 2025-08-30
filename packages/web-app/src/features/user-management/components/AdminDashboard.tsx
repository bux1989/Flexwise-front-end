import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { DebugOverlay } from '../../../debug';
import { Navigation } from '../../../components/Navigation';
import { AttendanceMatrix } from '../../../components/AttendanceMatrix';
import { AttendanceDetailView } from '../../../components/AttendanceDetailView';
import { Infoboard } from '../../../components/Infoboard';
import { MissingStaff } from '../../../components/MissingStaff';
import { Veranstaltungen } from '../../../components/Veranstaltungen';
import { TodosPlaceholder } from '../../../components/TodosPlaceholder';
import Settings from '../../../components/Settings';

interface AdminDashboardProps {
  user: any;
  onShowSettings: () => void;
  showSettings?: boolean;
  onBackToDashboard?: () => void;
}

export function AdminDashboard({ user, onShowSettings, showSettings = false, onBackToDashboard }: AdminDashboardProps) {
  const [currentView, setCurrentView] = useState(showSettings ? 'einstellungen' : 'home');
  const [attendanceDetailStatus, setAttendanceDetailStatus] = useState<string | null>(null);

  // Update currentView when showSettings changes
  React.useEffect(() => {
    setCurrentView(showSettings ? 'einstellungen' : 'home');
  }, [showSettings]);

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

  const handleNavigation = (view: string) => {
    setCurrentView(view);
    if (view === 'home') {
      // Navigate back to dashboard
      if (onBackToDashboard) {
        onBackToDashboard();
      }
    } else if (view !== 'home') {
      console.log('Navigate to:', view);
      // Future: Handle navigation to different views
    }
  };

  const handleShowSettings = () => {
    setCurrentView('einstellungen');
    onShowSettings();
  };

  const handleClassClick = (className: string) => {
    console.log('Class clicked:', className);
    // Future: Navigate to class detail view
  };

  const handleStatusClick = (status: string) => {
    console.log('Status clicked:', status);
    setCurrentView('attendance-detail');
    setAttendanceDetailStatus(status);
  };

  const handleBackFromAttendanceDetail = () => {
    setCurrentView('home');
    setAttendanceDetailStatus(null);
  };

  const renderMainContent = () => {
    if (showSettings) {
      return (
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <Settings />
        </main>
      );
    }

    if (currentView === 'attendance-detail' && attendanceDetailStatus) {
      return (
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <AttendanceDetailView
            status={attendanceDetailStatus}
            onBack={handleBackFromAttendanceDetail}
          />
        </main>
      );
    }

    return (
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
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentView={currentView}
        onNavigate={handleNavigation}
        onShowSettings={handleShowSettings}
        onLogout={handleLogout}
      />

      {renderMainContent()}
    </div>
  );
}
