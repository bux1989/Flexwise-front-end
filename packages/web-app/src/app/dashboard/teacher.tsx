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
  const [excuseDialogOpen, setExcuseDialogOpen] = useState(false);
  const [selectedStudentForExcuse, setSelectedStudentForExcuse] = useState<{lessonId: string, studentId: string, isEdit?: boolean} | null>(null);
  const [excuseReason, setExcuseReason] = useState('');
  const [tempAttendance, setTempAttendance] = useState<{[studentId: string]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}}>({});
  const [lessonNote, setLessonNote] = useState('');

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

    // Initialize temp attendance state
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson && viewMode === 'edit') {
      const editAttendance: {[studentId: string]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}} = {};

      // Initialize with existing attendance if available
      if (lesson.attendance) {
        lesson.attendance.present.forEach((student: any) => {
          editAttendance[student.id] = { status: 'present' };
        });

        lesson.attendance.late.forEach((student: any) => {
          editAttendance[student.id] = {
            status: 'late',
            minutesLate: student.minutesLate || 1,
            arrivalTime: student.arrivalTime,
            lateExcused: student.lateExcused || false
          };
        });

        lesson.attendance.absent.forEach((student: any) => {
          editAttendance[student.id] = {
            status: student.excused ? 'excused' : 'unexcused',
            excuseReason: student.reason || ''
          };
        });
      }

      setTempAttendance(editAttendance);
      setLessonNote(''); // TODO: Initialize with existing lesson note if available
    }
  };

  // Helper function to get selected lesson
  const selectedLesson = lessons.find(l => l.id === selectedLessonForAttendance);

  // Helper function to get default late time
  const getDefaultLateTime = (lesson: any): string => {
    if (!lesson) return '';

    const now = new Date();
    const [startHours, startMinutes] = lesson.time.split(':').map(Number);

    const lessonStart = new Date();
    lessonStart.setHours(startHours, startMinutes, 0, 0);

    // Default to 5 minutes after lesson start
    const defaultTime = new Date(lessonStart.getTime() + (5 * 60000));
    return defaultTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Attendance management functions
  const setStudentStatus = (studentId: string, status: 'present' | 'late' | 'excused' | 'unexcused') => {
    setTempAttendance(prev => {
      const current = prev[studentId];
      let minutesLate: number | undefined;
      let arrivalTime: string | undefined;
      let lateExcused: boolean | undefined;

      if (status === 'late') {
        arrivalTime = current?.arrivalTime || getDefaultLateTime(selectedLesson);
        minutesLate = current?.minutesLate || 5;
        lateExcused = current?.lateExcused || false;
      }

      return {
        ...prev,
        [studentId]: {
          status,
          minutesLate,
          arrivalTime,
          lateExcused,
          excuseReason: status === 'excused' ? (current?.excuseReason || '') : undefined
        }
      };
    });
  };

  const setStudentExcuseReason = (studentId: string, reason: string) => {
    setTempAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        excuseReason: reason
      }
    }));
  };

  const setStudentArrivalTime = (studentId: string, time: string) => {
    setTempAttendance(prev => {
      const current = prev[studentId];
      if (!current || current.status !== 'late') return prev;

      // Calculate minutes late
      let minutesLate = 1;
      if (selectedLesson && time) {
        try {
          const [lessonHours, lessonMinutes] = selectedLesson.time.split(':').map(Number);
          const [arrivalHours, arrivalMinutesStr] = time.split(':').map(Number);

          const lessonStart = new Date();
          lessonStart.setHours(lessonHours, lessonMinutes, 0, 0);

          const arrival = new Date();
          arrival.setHours(arrivalHours, arrivalMinutesStr, 0, 0);

          minutesLate = Math.max(1, Math.floor((arrival.getTime() - lessonStart.getTime()) / (1000 * 60)));
        } catch (error) {
          console.warn('Error calculating minutes late:', error);
        }
      }

      return {
        ...prev,
        [studentId]: {
          ...current,
          arrivalTime: time,
          minutesLate
        }
      };
    });
  };

  const setStudentLateExcused = (studentId: string, excused: boolean) => {
    setTempAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        lateExcused: excused
      }
    }));
  };

  const setAllStudentsStatus = (status: 'present' | 'late' | 'excused' | 'unexcused') => {
    if (!selectedLesson) return;

    const newAttendance: {[studentId: string]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}} = {};

    selectedLesson.students?.forEach((student: any) => {
      let minutesLate: number | undefined;
      let arrivalTime: string | undefined;
      let lateExcused: boolean | undefined;

      if (status === 'late') {
        arrivalTime = getDefaultLateTime(selectedLesson);
        minutesLate = 5;
        lateExcused = false;
      }

      newAttendance[student.id] = {
        status,
        minutesLate,
        arrivalTime,
        lateExcused,
        excuseReason: status === 'excused' ? '' : undefined
      };
    });

    setTempAttendance(newAttendance);
  };

  const saveAttendance = () => {
    if (!selectedLesson) return;

    console.log('💾 Saving attendance to Supabase...', { lessonId: selectedLesson.id, tempAttendance, lessonNote });

    // TODO: Implement actual Supabase save using bulkSaveAttendance
    // For now, just close the dialog
    setTempAttendance({});
    setLessonNote('');
    setAttendanceDialogOpen(false);
    setSelectedLessonForAttendance(null);
    setAttendanceViewMode('edit');
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
