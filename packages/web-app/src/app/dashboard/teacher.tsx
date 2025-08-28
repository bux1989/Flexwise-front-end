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
import { getCurrentUserProfile, handleLogout, fetchLessonAttendance, fetchLessonDiaryEntry, getLessonStudentNameIdPairs, saveLessonAttendanceBulkRPC } from '../../lib/supabase';
import { useLessons, useTeacherProfile } from '../../features/lessons/hooks/useLessons';
import { KlassenbuchApp } from '../../features/klassenbuch';

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

  // Lessons data from Supabase with real-time updates
  const { teacherId, loading: loadingTeacher } = useTeacherProfile();
  const { lessons, loading: loadingLessons, error: lessonsError, refetch: refetchLessons, schoolId, realtime } = useLessons(teacherId, selectedDate);

  // Attendance dialog state - simplified
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceViewMode, setAttendanceViewMode] = useState<'overview' | 'edit'>('edit');
  const [selectedLessonForAttendance, setSelectedLessonForAttendance] = useState<string | null>(null);
  const [tempAttendance, setTempAttendance] = useState<{[studentId: string]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}}>({});
  const [lessonNote, setLessonNote] = useState('');
  const [overviewData, setOverviewData] = useState<any>(null);

  // Mobile detection (simple check)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Klassenbuch view state
  const [showKlassenbuch, setShowKlassenbuch] = useState(false);
  const [klassenbuchView, setKlassenbuchView] = useState<'live' | 'statistics'>('live');

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getCurrentUserProfile();

        if (profile && profile.first_name && profile.last_name) {
          // Format the teacher name without salutation
          const firstName = profile.first_name;
          const lastName = profile.last_name;
          const fullName = `${firstName} ${lastName}`;
          setCurrentTeacher(fullName);
        }
      } catch (error) {
        console.warn('Could not load user profile, using fallback:', error);
        // Keep the fallback value
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  const dateString = formatDateTime();

  const handleHeaderButtonClick = async (action: string) => {
    if (action === 'Ausloggen') {
      await handleLogout();
    } else if (action === 'Klassenbuch') {
      setShowKlassenbuch(true);
    } else if (action === 'Klassenbuch-Close') {
      setShowKlassenbuch(false);
    }
    // Handle other actions in the future
  };

  const handleKlassenbuchClose = () => {
    setShowKlassenbuch(false);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Simple function: Open overview mode (for green badges - complete attendance)
  const openOverviewMode = async (lessonId: string) => {
    // Set lesson but DON'T open dialog yet - load data first
    setSelectedLessonForAttendance(lessonId);
    setAttendanceViewMode('overview');
    setOverviewData(null); // Clear previous data

    try {
      // Fetch data for overview mode
      const [attendanceData, diaryEntry] = await Promise.all([
        fetchLessonAttendance(lessonId),
        fetchLessonDiaryEntry(lessonId)
      ]);

      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) {
        console.error('Lesson not found in lessons array:', lessonId);
        return;
      }

      const getUiStudentName = (record: any): string => {
        const profile = Array.isArray(record?.user_profiles) ? record.user_profiles[0] : record?.user_profiles;
        const first = profile?.first_name || '';
        const last = profile?.last_name || '';
        return `${first} ${last}`.trim();
      };

      // Structure data for overview mode
      const structuredData = {
        lessonNote: diaryEntry,
        present: attendanceData.present?.map((record: any) => ({
          id: record.student_id,
          name: getUiStudentName(record)
        })) || [],
        late: attendanceData.late?.map((record: any) => ({
          id: record.student_id,
          name: getUiStudentName(record),
          minutesLate: record.late_minutes || 5,
          arrivalTime: '08:05', // simplified for now
          lateExcused: false
        })) || [],
        absent: attendanceData.absent?.map((record: any) => ({
          id: record.student_id,
          name: getUiStudentName(record),
          excused: record.status === 'absent_excused',
          reason: record.notes || ''
        })) || []
      };

      // Store data in state instead of mutating lessons array
      setOverviewData(structuredData);

      // THEN open dialog with data ready
      setAttendanceDialogOpen(true);
    } catch (error) {
      console.error('Error loading overview:', error);
      // Still open dialog even on error
      setAttendanceDialogOpen(true);
    }
  };

  // Simple function: Open edit mode (for orange/red badges - incomplete/no attendance)
  const openEditMode = async (lessonId: string) => {
    // Set lesson but DON'T open dialog yet - load data first to prevent lag
    setSelectedLessonForAttendance(lessonId);
    setAttendanceViewMode('edit');

    // Clear previous data
    setTempAttendance({});
    setLessonNote('');

    try {
      // Fetch and prefill data BEFORE opening dialog
      const [attendanceData, diaryEntry] = await Promise.all([
        fetchLessonAttendance(lessonId),
        fetchLessonDiaryEntry(lessonId)
      ]);

      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) {
        console.error('Lesson not found:', lessonId);
        return;
      }

      const editAttendance: {[studentId: string]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}} = {};

      // Build student lookup
      const nameToStudentId = new Map<string, string>();
      lesson.students?.forEach((s: any) => {
        const baseName = (s.name?.split(' (')[0] || '').trim().toLowerCase();
        if (baseName) nameToStudentId.set(baseName, s.id);
      });

      const getUiStudentId = (record: any): string | undefined => {
        const profile = Array.isArray(record?.user_profiles) ? record.user_profiles[0] : record?.user_profiles;
        const first = profile?.first_name || '';
        const last = profile?.last_name || '';
        const key = `${first} ${last}`.trim().toLowerCase();
        return nameToStudentId.get(key);
      };

      // Process attendance data
      attendanceData.present?.forEach((record: any) => {
        const sid = getUiStudentId(record);
        if (sid) editAttendance[sid] = { status: 'present' };
      });

      attendanceData.late?.forEach((record: any) => {
        const sid = getUiStudentId(record);
        if (sid) {
          editAttendance[sid] = {
            status: 'late',
            minutesLate: record.late_minutes || 5,
            arrivalTime: '08:05', // simplified
            lateExcused: false
          };
        }
      });

      attendanceData.absent?.forEach((record: any) => {
        const sid = getUiStudentId(record);
        if (sid) {
          editAttendance[sid] = {
            status: record.status === 'absent_excused' ? 'excused' : 'unexcused',
            excuseReason: record.notes || ''
          };
        }
      });

      // Set all data first
      setTempAttendance(editAttendance);
      setLessonNote(diaryEntry);

      // THEN open dialog - should now appear instantly with data
      setAttendanceDialogOpen(true);
    } catch (error) {
      console.error('Error loading edit mode:', error);
      // Still open dialog even on error
      setAttendanceDialogOpen(true);
    }
  };

  // Simple function: Switch from overview to edit (for edit button) - reuse existing data
  const switchToEdit = () => {
    if (!selectedLessonForAttendance || !overviewData) {
      console.error('Cannot switch to edit - no lesson or data available');
      return;
    }

    const lesson = lessons.find(l => l.id === selectedLessonForAttendance);
    if (!lesson) {
      console.error('Lesson not found:', selectedLessonForAttendance);
      return;
    }

    // Convert overview data to edit format instantly
    const editAttendance: {[studentId: string]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}} = {};

    // Build student name to ID mapping for quick lookup
    const nameToStudentId = new Map<string, string>();
    lesson.students?.forEach((s: any) => {
      const baseName = (s.name?.split(' (')[0] || '').trim().toLowerCase();
      if (baseName) nameToStudentId.set(baseName, s.id);
    });

    // Convert present students
    overviewData.present?.forEach((student: any) => {
      const studentId = nameToStudentId.get(student.name.toLowerCase());
      if (studentId) {
        editAttendance[studentId] = { status: 'present' };
      }
    });

    // Convert late students
    overviewData.late?.forEach((student: any) => {
      const studentId = nameToStudentId.get(student.name.toLowerCase());
      if (studentId) {
        editAttendance[studentId] = {
          status: 'late',
          minutesLate: student.minutesLate || 5,
          arrivalTime: student.arrivalTime || '08:05',
          lateExcused: student.lateExcused || false
        };
      }
    });

    // Convert absent students
    overviewData.absent?.forEach((student: any) => {
      const studentId = nameToStudentId.get(student.name.toLowerCase());
      if (studentId) {
        editAttendance[studentId] = {
          status: student.excused ? 'excused' : 'unexcused',
          excuseReason: student.reason || ''
        };
      }
    });

    // Set all data instantly
    setTempAttendance(editAttendance);
    setLessonNote(overviewData.lessonNote || '');
    setAttendanceViewMode('edit');
  };

  // Main handler that routes to the right function
  const handleAttendanceClick = (lessonId: string, viewMode: 'overview' | 'edit' = 'edit') => {
    if (viewMode === 'overview') {
      openOverviewMode(lessonId);
    } else {
      openEditMode(lessonId);
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

  // Function to refresh attendance data (real-time will handle automatically, but keep for manual refresh)
  const refreshLessonAttendanceData = async (lessonId: string) => {
    try {
      // Real-time should handle this automatically, but provide manual fallback
      await refetchLessons();
    } catch (error) {
      console.error('Failed to refresh attendance data:', error);
    }
  };

  const saveAttendance = async () => {
    if (!selectedLesson) return;
    try {
      // Map UI student names to real profile IDs
      const { students, schoolId } = await getLessonStudentNameIdPairs(selectedLesson.id);
      const nameToId = new Map(students.map(s => [s.displayName.trim().toLowerCase(), s.id]));

      // Build attendance payload
      const mapStatus = (s) => {
        if (s === 'present') return 'present';
        if (s === 'late') return 'late';
        if (s === 'excused') return 'absent_excused';
        if (s === 'unexcused') return 'absent_unexcused';
        return 'present';
      };

      const attendanceArray = [];
      selectedLesson.students?.forEach((stu) => {
        const a = tempAttendance[stu.id];
        if (!a) return;
        const studentId = nameToId.get((stu.name || '').trim().toLowerCase());
        if (!studentId) {
          console.warn('Could not resolve student ID for', stu.name);
          return;
        }
        let note = null;
        if (a.status === 'excused' && a.excuseReason) note = a.excuseReason;
        if (a.status === 'late') {
          const parts = [];
          if (a.arrivalTime) parts.push(`Ankunft: ${a.arrivalTime}`);
          if (a.minutesLate) parts.push(`${a.minutesLate} Min. verspätet`);
          if (a.lateExcused) parts.push('Entschuldigt');
          note = parts.join(' | ') || null;
        }
        attendanceArray.push({ student_id: studentId, status: mapStatus(a.status), note });
      });

      // Call RPC
      await saveLessonAttendanceBulkRPC({
        lessonId: selectedLesson.id,
        schoolId,
        attendance: attendanceArray,
        diaryText: lessonNote || null,
        diaryType: 'attendance',
        diaryPrivate: false,
      });

      // Refetch attendance data for the lesson to update badges
      await refreshLessonAttendanceData(selectedLesson.id);

      setTempAttendance({});
      setLessonNote('');
      setAttendanceDialogOpen(false);
      setSelectedLessonForAttendance(null);
      setAttendanceViewMode('edit');
    } catch (err) {
      console.error('Failed to save attendance:', err);
      alert(`Speichern fehlgeschlagen: ${err?.message || err}`);
    }
  };

  const handleEventRSVP = (eventId: number, response: 'attending' | 'maybe' | 'not_attending') => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, rsvp: event.rsvp === response ? null : response }
        : event
    ));
  };

  // No early return for Klassenbuch - show it under the header instead

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentTeacher={isLoadingProfile ? "Wird geladen..." : currentTeacher}
        dateString={loadingLessons ? "Stundenplan wird geladen..." : dateString}
        onButtonClick={handleHeaderButtonClick}
        showKlassenbuch={showKlassenbuch}
        klassenbuchView={klassenbuchView}
        onKlassenbuchViewChange={setKlassenbuchView}
      />

      {/* Real-time Status Indicator */}
      {realtime.isConnected && (
        <div className="bg-green-50 border-l-4 border-green-400 p-2 mx-6 mt-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <p className="text-xs text-green-700">
              Live-Updates aktiv ({realtime.channelCount} Kanäle)
              <button
                onClick={realtime.refresh}
                className="ml-2 text-green-600 hover:text-green-800 underline"
              >
                Aktualisieren
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Klassenbuch content - show when active */}
      {showKlassenbuch ? (
        <div className="mx-6 mt-4">
          <KlassenbuchApp
            onClose={handleKlassenbuchClose}
            currentTeacher={currentTeacher}
            hideHeader={true}
            currentView={klassenbuchView}
            onViewChange={setKlassenbuchView}
          />
        </div>
      ) : (
        <div className="p-1 lg:p-6">
        {/* Top Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6 mb-3 lg:mb-6">
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
          <InfoBoard
            schoolId={schoolId}
            isMobile={isMobile}
          />
        </div>

        {/* Bottom Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
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
            isMobile={isMobile}
          />
        </div>
        </div>
      )}

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={(open) => {
        setAttendanceDialogOpen(open);
        if (!open) {
          setSelectedLessonForAttendance(null);
          setAttendanceViewMode('edit'); // Reset to edit as default
          setTempAttendance({});
          setLessonNote('');
          setOverviewData(null); // Clear overview data
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] lg:max-h-[80vh] overflow-y-auto mx-2 lg:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
              <div className="text-center lg:text-left">
                <div className="text-lg lg:text-xl font-semibold">
                  Anwesenheit - {selectedLesson?.subject} {selectedLesson?.class}
                </div>
                <div className="text-sm font-normal text-gray-600 mt-1">
                  {selectedDate.toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })} um {selectedLesson?.time} Uhr
                </div>
              </div>
              {attendanceViewMode === 'overview' && overviewData && (
                <div className="flex justify-center lg:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchToEdit}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Anwesenheit bearbeiten</span>
                    <span className="sm:hidden">Bearbeiten</span>
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedLesson && (
        <div>
          {attendanceViewMode === 'overview' && overviewData ? (
                // Overview Mode - Clean summary view
                <div className="space-y-6">
                  {/* Lesson Note Section */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-900">Klassenbuch-Eintrag</h4>
                  <p className="text-sm text-blue-800">
                    {overviewData.lessonNote || (
                          <span className="text-gray-500 italic">
                            Kein Eintrag vorhanden -
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={switchToEdit}
                              className="h-auto p-0 ml-1 underline text-blue-600"
                            >
                              hinzufügen
                            </Button>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Present Students */}
                  <div>
                    <h4 className="flex items-center gap-2 mb-3">
                  <Check className="h-5 w-5 text-green-600" />
                  Anwesend ({overviewData.present?.length || 0})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {overviewData.present?.map((student: any) => (
                        <div key={student.id} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">{student.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Late Students */}
              {overviewData.late && overviewData.late.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    Verspätet ({overviewData.late.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {overviewData.late.map((student: any) => (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-sm">{student.name}</span>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                {student.minutesLate || 1} Min. verspätet
                              </Badge>
                              {student.arrivalTime && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Ankunft: {student.arrivalTime}
                                </div>
                              )}
                              {student.lateExcused && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Entschuldigt
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Absent Students */}
              {overviewData.absent && overviewData.absent.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 mb-3">
                    <X className="h-5 w-5 text-red-500" />
                    Abwesend ({overviewData.absent.length})
                  </h4>
                  <div className="space-y-2">
                    {overviewData.absent.map((student: any) => (
                          <div key={student.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm">{student.name}</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {student.excused ? (
                                <Badge variant="secondary" className="text-xs">
                                  Entschuldigt{student.reason && ` - ${student.reason}`}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  Unentschuldigt
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode - Attendance taking interface
                <div className="space-y-4">
                  {/* Lesson Note Section */}
                  <div className="space-y-2">
                    <Label htmlFor="lesson-note" className="font-medium text-center lg:text-left block text-lg">
                      Klassenbuch-Eintrag
                    </Label>
                    <Textarea
                      id="lesson-note"
                      placeholder="Notizen zur Stunde, behandelte Themen, besondere Vorkommnisse..."
                      value={lessonNote}
                      onChange={(e) => setLessonNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                    {!isMobile && (
                      <div className="text-sm text-gray-600 text-center lg:text-left">
                        Klicken Sie auf die Symbole, um die Anwesenheit zu markieren
                      </div>
                    )}
                    <div className="flex justify-center lg:justify-end">
                      <Button onClick={saveAttendance} className="bg-green-600 hover:bg-green-700">
                        Anwesenheit speichern
                      </Button>
                    </div>
                  </div>

                  {/* Grid Header */}
                  <div className="grid grid-cols-5 gap-1 lg:gap-2 border-b pb-3">
                    <div className="font-medium text-xs lg:text-sm">{isMobile ? 'SuS' : 'Schüler'}</div>
                    <div className="font-medium text-xs lg:text-sm text-center">{isMobile ? 'Anw' : 'Anwesend'}</div>
                    <div className="font-medium text-xs lg:text-sm text-center">{isMobile ? 'Spät' : 'Verspätet'}</div>
                    <div className="font-medium text-xs lg:text-sm text-center">{isMobile ? 'Abw. E' : 'Abwesend (E)'}</div>
                    <div className="font-medium text-xs lg:text-sm text-center">{isMobile ? 'Abw. U' : 'Abwesend (U)'}</div>
                  </div>

                  {/* Alle Buttons */}
                  <div className="grid grid-cols-5 gap-1 lg:gap-2 pb-2 border-b">
                    <div></div>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-1 lg:px-2 py-1 h-6 lg:h-7"
                        onClick={() => setAllStudentsStatus('present')}
                      >
                        Alle
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-7"
                        onClick={() => setAllStudentsStatus('late')}
                      >
                        Alle
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-7"
                        onClick={() => setAllStudentsStatus('excused')}
                      >
                        Alle
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-7"
                        onClick={() => setAllStudentsStatus('unexcused')}
                      >
                        Alle
                      </Button>
                    </div>
                  </div>

                  {/* Student Rows */}
                  <div className="space-y-1">
                    {selectedLesson.students?.map((student: any) => {
                      const attendance = tempAttendance[student.id];

                      return (
                        <div key={student.id} className="space-y-2">
                          <div className="grid grid-cols-5 gap-2 items-center py-2 px-2 hover:bg-gray-50 rounded">
                            {/* Student Name */}
                            <div className="text-sm flex items-center gap-2">
                              {student.name}
                            </div>

                            {/* Present */}
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  attendance?.status === 'present'
                                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                                    : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                                }`}
                                onClick={() => setStudentStatus(student.id, 'present')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Late */}
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  attendance?.status === 'late'
                                    ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                                    : 'text-gray-300 hover:text-yellow-600 hover:bg-yellow-50'
                                }`}
                                onClick={() => setStudentStatus(student.id, 'late')}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Excused Absent */}
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  attendance?.status === 'excused'
                                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                    : 'text-gray-300 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                onClick={() => setStudentStatus(student.id, 'excused')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Unexcused Absent */}
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${
                                  attendance?.status === 'unexcused'
                                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                    : 'text-gray-300 hover:text-red-600 hover:bg-red-50'
                                }`}
                                onClick={() => setStudentStatus(student.id, 'unexcused')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Excuse reason field for excused students */}
                          {attendance?.status === 'excused' && (
                            <div className="ml-4 mr-2">
                              <Input
                                placeholder="Grund der Entschuldigung (z.B. Krankheit, Arzttermin...)"
                                value={attendance.excuseReason || ''}
                                onChange={(e) => setStudentExcuseReason(student.id, e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          )}

                          {/* Late student details */}
                          {attendance?.status === 'late' && (
                            <div className="ml-4 mr-2 space-y-2">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor={`arrival-${student.id}`} className="text-xs">Ankunftszeit</Label>
                                  <Input
                                    id={`arrival-${student.id}`}
                                    type="time"
                                    value={attendance.arrivalTime || ''}
                                    onChange={(e) => setStudentArrivalTime(student.id, e.target.value)}
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`late-excused-${student.id}`}
                                      checked={attendance.lateExcused || false}
                                      onCheckedChange={(checked) => setStudentLateExcused(student.id, !!checked)}
                                    />
                                    <Label htmlFor={`late-excused-${student.id}`} className="text-xs">
                                      Entschuldigt
                                    </Label>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {attendance.minutesLate} Minuten verspätet
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Save Button - Duplicate of the top save button for better UX */}
                  <div className="flex justify-center lg:justify-end pt-4 border-t">
                    <Button onClick={saveAttendance} className="bg-green-600 hover:bg-green-700">
                      Anwesenheit speichern
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
