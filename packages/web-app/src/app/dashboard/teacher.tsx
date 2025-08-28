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
import { getCurrentUserProfile, handleLogout, fetchLessonAttendance, getLessonStudentNameIdPairs, saveLessonAttendanceBulkRPC } from '../../lib/supabase';
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

  // Lessons data from Supabase with real-time updates
  const { teacherId, loading: loadingTeacher } = useTeacherProfile();
  const { lessons, loading: loadingLessons, error: lessonsError, refetch: refetchLessons, schoolId, realtime } = useLessons(teacherId, selectedDate);

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

  const handleAttendanceClick = async (lessonId: string, viewMode: 'overview' | 'edit' = 'edit') => {
    setSelectedLessonForAttendance(lessonId);
    setAttendanceViewMode(viewMode);
    setAttendanceDialogOpen(true);
    console.log(`Attendance clicked for lesson ${lessonId} in ${viewMode} mode`);

    if (viewMode === 'edit') {
      try {
        console.log('📋 Fetching existing attendance data for lesson:', lessonId);

        // Fetch actual attendance data from Supabase
        const attendanceData = await fetchLessonAttendance(lessonId);

        const editAttendance: {[studentId: string]: {status: 'present' | 'late' | 'excused' | 'unexcused', minutesLate?: number, excuseReason?: string, arrivalTime?: string, lateExcused?: boolean}} = {};

        // Build a lookup of display student name -> synthetic student id used in UI
        const lesson = lessons.find(l => l.id === lessonId);
        const nameToStudentId = new Map<string, string>();
        lesson?.students?.forEach((s: any) => {
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

        // Process present students
        attendanceData.present?.forEach((record: any) => {
          const sid = getUiStudentId(record);
          if (!sid) {
            console.warn('⚠️ Could not match present record to UI student:', record);
            return;
          }
          editAttendance[sid] = { status: 'present' };
        });

        // Process late students
        attendanceData.late?.forEach((record: any) => {
          const sid = getUiStudentId(record);
          if (!sid) {
            console.warn('⚠️ Could not match late record to UI student:', record);
            return;
          }

          // Determine minutes late using DB value or fallback to recorded_at vs lesson start
          const startParts = (lesson?.time || '').split(':').map(Number);
          const base = new Date(selectedDate);
          if (!isNaN(startParts[0]) && !isNaN(startParts[1])) {
            base.setHours(startParts[0], startParts[1], 0, 0);
          }
          const recordedAt = record.recorded_at ? new Date(record.recorded_at) : null;
          let minutesLate = typeof record.late_minutes === 'number' && record.late_minutes > 0
            ? record.late_minutes
            : (recordedAt && !isNaN(base.getTime())
                ? Math.max(1, Math.floor((recordedAt.getTime() - base.getTime()) / (1000 * 60)))
                : 5);

          // Compute arrival time = lesson start + minutesLate
          const arrival = new Date(base.getTime() + minutesLate * 60000);
          const arrivalTime = `${arrival.getHours().toString().padStart(2, '0')}:${arrival.getMinutes().toString().padStart(2, '0')}`;

          editAttendance[sid] = {
            status: 'late',
            minutesLate,
            arrivalTime,
            lateExcused: false
          };
        });

        // Process absent students (both excused and unexcused)
        attendanceData.absent?.forEach((record: any) => {
          const sid = getUiStudentId(record);
          if (!sid) {
            console.warn('⚠️ Could not match absent record to UI student:', record);
            return;
          }
          editAttendance[sid] = {
            status: record.status === 'absent_excused' ? 'excused' : 'unexcused',
            excuseReason: record.notes || ''
          };
        });

        setTempAttendance(editAttendance);
        setLessonNote('');

        console.log('✅ Attendance data loaded and prefilled:', editAttendance);

      } catch (error) {
        console.error('❌ Error fetching attendance data:', error);
        console.error('❌ Error details:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          lessonId: lessonId
        });
        setTempAttendance({});
        setLessonNote('');
      }
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
      console.log('🔄 Manual refresh requested for lesson:', lessonId);

      // Real-time should handle this automatically, but provide manual fallback
      await refetchLessons();

      console.log('✅ Manual lesson data refresh completed');
    } catch (error) {
      console.error('❌ Failed to refresh attendance data:', error);
    }
  };

  const saveAttendance = async () => {
    if (!selectedLesson) return;
    try {
      console.log('💾 Saving attendance via RPC...', { lessonId: selectedLesson.id });

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
          console.warn('⚠️ Could not resolve student ID for', stu.name);
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

      console.log('✅ Attendance saved');

      // Refetch attendance data for the lesson to update badges
      await refreshLessonAttendanceData(selectedLesson.id);

      setTempAttendance({});
      setLessonNote('');
      setAttendanceDialogOpen(false);
      setSelectedLessonForAttendance(null);
      setAttendanceViewMode('edit');
    } catch (err) {
      console.error('❌ Failed to save attendance:', err);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentTeacher={isLoadingProfile ? "Wird geladen..." : currentTeacher}
        dateString={loadingLessons ? "Stundenplan wird geladen..." : dateString}
        onButtonClick={handleHeaderButtonClick}
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

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={(open) => {
        setAttendanceDialogOpen(open);
        if (!open) {
          setSelectedLessonForAttendance(null);
          setAttendanceViewMode('edit');
          setTempAttendance({});
          setLessonNote('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] lg:max-h-[80vh] overflow-y-auto mx-2 lg:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                Anwesenheit - {selectedLesson?.subject} {selectedLesson?.class}
                <div className="text-sm font-normal text-gray-600 mt-1">
                  {selectedDate.toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })} um {selectedLesson?.time} Uhr
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedLesson && (
            <div>
              {/* Edit Mode - Attendance taking interface */}
              <div className="space-y-4">
                {/* Lesson Note Section */}
                <div className="space-y-2">
                  <Label htmlFor="lesson-note" className="font-medium">
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

                <div className="flex items-center justify-between">
                  {!isMobile && (
                    <div className="text-sm text-gray-600">
                      Klicken Sie auf die Symbole, um die Anwesenheit zu markieren
                    </div>
                  )}
                  <Button onClick={saveAttendance} className="bg-green-600 hover:bg-green-700 ml-auto">
                    Anwesenheit speichern
                  </Button>
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
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveAttendance} className="bg-green-600 hover:bg-green-700">
                    Anwesenheit speichern
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
