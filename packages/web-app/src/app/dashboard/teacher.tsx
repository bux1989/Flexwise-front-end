import { useState } from 'react';
import { Header } from '../../components/Header';
import { TaskManagement } from '../../features/task-management/components/TaskManagement';

// Import mock data from the shared package
import { CURRENT_TEACHER } from '../../../shared/data/mockData';

interface TeacherDashboardProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function TeacherDashboard({ user }: TeacherDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Format date string for header
  const formatDateTime = () => {
    return new Date().toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleHeaderButtonClick = (action: string) => {
    console.log(`Header button clicked: ${action}`);
  };

  const currentTeacher = user?.name || CURRENT_TEACHER || 'Lehrer';
  const dateString = formatDateTime();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentTeacher={currentTeacher}
        dateString={dateString}
        onButtonClick={handleHeaderButtonClick}
      />

      <div className="p-6">
        {/* Top Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Schedule/Lesson Management - Left Column */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📅 Stundenplan (Schedule)
              </h2>
              <p className="text-gray-600">
                Schedule component will be extracted and placed here.
                This will include lesson planning, attendance tracking, and class management.
              </p>
            </div>
          </div>

          {/* Info Board - Right Column */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📋 Info Board
              </h2>
              <p className="text-gray-600">
                Info Board component will be extracted and placed here.
                This will include school announcements and substitute lessons.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events/Communications - Left Column */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                🎉 Events/Communications
              </h2>
              <p className="text-gray-600">
                Events component will be extracted and placed here.
                This will include school events, RSVP functionality, and communications.
              </p>
            </div>
          </div>

          {/* Task Management - Right Column */}
          <TaskManagement 
            currentTeacher={currentTeacher}
            canAssignTasks={true}
          />
        </div>
      </div>
    </div>
  );
}
