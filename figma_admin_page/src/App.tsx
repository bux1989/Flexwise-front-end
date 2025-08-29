import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { AttendanceMatrix } from './components/AttendanceMatrix';
import { Infoboard } from './components/Infoboard';
import { MissingStaff } from './components/MissingStaff';
import { Veranstaltungen } from './components/Veranstaltungen';
import { TodosPlaceholder } from './components/TodosPlaceholder';
import { ClassAttendanceDetail } from './components/ClassAttendanceDetail';
import { OverdueStudentsDetail } from './components/OverdueStudentsDetail';
import { AttendanceStatusDetail } from './components/AttendanceStatusDetail';

type View = 'dashboard' | 'class-detail' | 'overdue-detail' | 'status-detail';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [mainView, setMainView] = useState<View>('dashboard');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const handleNavigation = (view: string) => {
    setCurrentView(view);
    if (view === 'home') {
      setMainView('dashboard');
    }
  };

  const handleClassClick = (className: string) => {
    setSelectedClass(className);
    setMainView('class-detail');
  };

  const handleStatusClick = (status: string) => {
    if (status === 'ueberfaellig') {
      setMainView('overdue-detail');
    } else {
      setSelectedStatus(status);
      setMainView('status-detail');
    }
  };

  const handleBackToDashboard = () => {
    setMainView('dashboard');
    setSelectedClass('');
    setSelectedStatus('');
  };

  const handleNavigateToCheckInOut = (studentName?: string) => {
    console.log('Navigate to Check In/Out', studentName ? `for ${studentName}` : '');
    setCurrentView('checkinout');
  };

  const handleCheckOutStudent = (studentId: string) => {
    console.log('Check out student:', studentId);
    // This would handle the check-out process
  };

  const handleUpdateStudentStatus = (studentId: string, action: string, details?: { status?: string; reason?: string }) => {
    console.log('Student action:', { studentId, action, details });
    
    if (action === 'einchecken') {
      console.log(`Checking in student ${studentId}`);
      // Handle check-in logic - mark as present
    } else if (action === 'status_change' && details?.status) {
      console.log(`Changing status of student ${studentId} to ${details.status}`, details.reason ? `with reason: ${details.reason}` : '');
      // Handle status change logic
    }
    
    // This would update the student's attendance status in the backend
    // and refresh the UI accordingly
  };

  const renderMainContent = () => {
    switch (mainView) {
      case 'class-detail':
        return (
          <ClassAttendanceDetail
            className={selectedClass}
            onBack={handleBackToDashboard}
            onNavigateToCheckInOut={() => handleNavigateToCheckInOut()}
          />
        );
      case 'overdue-detail':
        return (
          <OverdueStudentsDetail
            onBack={handleBackToDashboard}
            onCheckOut={handleCheckOutStudent}
          />
        );
      case 'status-detail':
        return (
          <AttendanceStatusDetail
            status={selectedStatus}
            onBack={handleBackToDashboard}
            onUpdateStatus={handleUpdateStudentStatus}
          />
        );
      default:
        return (
          <>
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
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView={currentView} onNavigate={handleNavigation} />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {renderMainContent()}
      </main>
    </div>
  );
}