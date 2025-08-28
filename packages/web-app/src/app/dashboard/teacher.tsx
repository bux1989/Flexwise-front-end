import { useState, useEffect } from 'react';
import { Header } from '../../components/Header';
import { TaskManagement } from '../../features/task-management/components/TaskManagement';
import { LessonSchedule } from '../../features/lessons/components/LessonSchedule';
import { InfoBoard } from '../../features/communications/components/InfoBoard';
import { Events } from '../../features/communications/components/Events';

// Import UI components for attendance dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Check, Clock, X, Edit } from 'lucide-react';

// Import mock data and utilities
import { CURRENT_TEACHER, INITIAL_EVENTS } from '../../../../shared/data/mockData';
import { formatDateTime } from '../../../../shared/domains/academic/klassenbuch/utils';
import { getCurrentUserProfile, handleLogout } from '../../lib/supabase';
import { useLessons, useTeacherProfile } from '../../features/lessons/hooks/useLessons';

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
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);

  // User profile state
  const [currentTeacher, setCurrentTeacher] = useState(user?.name || CURRENT_TEACHER || 'Lehrer');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Lessons data from Supabase
  const { teacherId, loading: loadingTeacher } = useTeacherProfile();
  const { lessons, loading: loadingLessons, error: lessonsError } = useLessons(teacherId, selectedDate);

  // Attendance dialog state (for lesson schedule)
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceViewMode, setAttendanceViewMode] = useState<'overview' | 'edit'>('edit');
  const [selectedLessonForAttendance, setSelectedLessonForAttendance] = useState<string | null>(null);

  // Mobile detection (simple check)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        console.log('🔄 Starting profile load for teacher dashboard');
        console.log('📝 Current fallback teacher name:', currentTeacher);

        const profile = await getCurrentUserProfile();
        console.log('📊 Raw profile data received:', profile);

        if (profile && profile.first_name && profile.last_name) {
          // Format the teacher name without salutation
          const firstName = profile.first_name;
          const lastName = profile.last_name;

          console.log('🏷️ Profile names found:', { firstName, lastName });

          const fullName = `${firstName} ${lastName}`;
          console.log('🎯 Setting teacher name to:', fullName);
          setCurrentTeacher(fullName);

          console.log('✅ Teacher profile loaded successfully:', fullName);
        } else {
          console.log('⚠️ Profile missing first_name or last_name, using fallback');
          console.log('📋 Profile structure:', profile);
        }
      } catch (error) {
        console.warn('❌ Could not load user profile, using fallback:', error);
        // Keep the fallback value
      } finally {
        setIsLoadingProfile(false);
        console.log('🏁 Profile loading completed, current teacher:', currentTeacher);
      }
    };

    loadUserProfile();
  }, []);

  const dateString = formatDateTime();

  const handleHeaderButtonClick = async (action: string) => {
    console.log(`Header button clicked: ${action}`);

    if (action === 'Ausloggen') {
      console.log('🚪 Logout button clicked, signing out...');
      await handleLogout();
    } else {
      // Handle other actions in the future
      console.log(`Action "${action}" not implemented yet`);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAttendanceClick = (lessonId: string, viewMode: 'overview' | 'edit' = 'edit') => {
    setSelectedLessonForAttendance(lessonId);
    setAttendanceViewMode(viewMode);
    setAttendanceDialogOpen(true);
    console.log(`Attendance clicked for lesson ${lessonId} in ${viewMode} mode`);
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
        currentTeacher={isLoadingProfile ? "Wird geladen..." : currentTeacher}
        dateString={loadingLessons ? "Stundenplan wird geladen..." : dateString}
        onButtonClick={handleHeaderButtonClick}
      />

      <div className="p-6">
        {/* Top Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Schedule/Lesson Management - Left Column */}
          {lessonsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium mb-2">Fehler beim Laden des Stundenplans</h3>
              <p className="text-red-600 text-sm">{lessonsError}</p>
            </div>
          ) : (
            <LessonSchedule
              lessons={lessons}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              onAttendanceClick={handleAttendanceClick}
              isMobile={isMobile}
            />
          )}

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

      {/* Attendance Modal */}
      <AttendanceModal
        lessonId={selectedLessonForAttendance}
        isOpen={attendanceDialogOpen}
        onClose={() => {
          setAttendanceDialogOpen(false);
          setSelectedLessonForAttendance(null);
        }}
        viewMode={attendanceViewMode}
      />
    </div>
  );
}
