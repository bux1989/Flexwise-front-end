import { useState } from 'react';
import { Header } from '../../components/Header';
import { TaskManagement } from '../../features/task-management/components/TaskManagement';
import { LessonSchedule } from '../../features/lessons/components/LessonSchedule';
import { InfoBoard } from '../../features/communications/components/InfoBoard';
import { Events } from '../../features/communications/components/Events';

// Import mock data and utilities
import { CURRENT_TEACHER, INITIAL_LESSONS, INITIAL_EVENTS } from '../../../../shared/data/mockData';
import { formatDateTime } from '../../../../shared/domains/academic/klassenbuch/utils';

interface TeacherDashboardProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: { day: number; month: string; year: number };
  time: string;
  location: string;
  rsvp: 'attending' | 'maybe' | 'not_attending' | null;
}

export default function TeacherDashboard({ user }: TeacherDashboardProps) {
  // State management for the dashboard
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  
  // Attendance dialog state (for lesson schedule)
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceViewMode, setAttendanceViewMode] = useState<'overview' | 'edit'>('edit');
  const [selectedLessonForAttendance, setSelectedLessonForAttendance] = useState<number | null>(null);
  
  // Mobile detection (simple check)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const currentTeacher = user?.name || CURRENT_TEACHER || 'Lehrer';
  const dateString = formatDateTime();

  const handleHeaderButtonClick = (action: string) => {
    console.log(`Header button clicked: ${action}`);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAttendanceClick = (lessonId: number, viewMode: 'overview' | 'edit' = 'edit') => {
    setSelectedLessonForAttendance(lessonId);
    setAttendanceViewMode(viewMode);
    setAttendanceDialogOpen(true);
    console.log(`Attendance clicked for lesson ${lessonId} in ${viewMode} mode`);
    // TODO: Implement attendance dialog
  };

  const handleEventRSVP = (eventId: number, response: 'attending' | 'maybe' | 'not_attending') => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, rsvp: event.rsvp === response ? null : response }
        : event
    ));
  };

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
          <LessonSchedule
            lessons={lessons}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onAttendanceClick={handleAttendanceClick}
            isMobile={isMobile}
          />

          {/* Info Board - Right Column */}
          <InfoBoard isMobile={isMobile} />
        </div>

        {/* Bottom Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events/Communications - Left Column */}
          <Events
            events={events}
            onEventRSVP={handleEventRSVP}
            isMobile={isMobile}
          />

          {/* Task Management - Right Column */}
          <TaskManagement 
            currentTeacher={currentTeacher}
            canAssignTasks={true}
          />
        </div>
      </div>

      {/* TODO: Add Attendance Dialog Component */}
      {/* This would be the complex attendance tracking dialog from the original */}
      {/* For now, we're focusing on the component extraction and layout */}
    </div>
  );
}
