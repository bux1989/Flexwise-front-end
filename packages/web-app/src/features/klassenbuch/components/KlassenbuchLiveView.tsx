import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { DebugOverlay } from '../../../debug';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { Check, AlertTriangle, AlertCircle, X, RefreshCw, MessageSquare, Loader2 } from 'lucide-react';
import { KlassenbuchAttendanceModal } from './KlassenbuchAttendanceModal';
import { getTimetableForClass, getStudentsForClass, getSchedulePeriods, getSchoolDays, formatTimeSlot, getLessonsForWeek, type Lesson, type SchedulePeriod, type SchoolDay } from '../data/klassenbuchDataAdapter';
import { getCurrentUserProfile, supabase } from '../../../lib/supabase.js';

interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
}

interface KlassenbuchLiveViewProps {
  selectedWeek: Date;
  selectedClass: Class;
  onAttendanceClick?: (lessonId: string, viewMode?: 'overview' | 'edit') => void;
}

export function KlassenbuchLiveView({ selectedWeek, selectedClass, onAttendanceClick }: KlassenbuchLiveViewProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [commentModalLesson, setCommentModalLesson] = useState<Lesson | null>(null);
  const [schedulePeriods, setSchedulePeriods] = useState<SchedulePeriod[]>([]);
  const [schoolDays, setSchoolDays] = useState<SchoolDay[]>([]);
  const [classTimetable, setClassTimetable] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string>('');
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'complete' | 'missing' | 'incomplete' | 'future'>>({});
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  // Function to update attendance status for a specific lesson
  const updateLessonAttendanceStatus = async (lessonId: string) => {
    try {
      console.log('🔄 Updating attendance status for lesson:', lessonId);

      // Query just the attendance data for this specific lesson
      const { data: lesson, error } = await supabase
        .from('vw_react_lesson_details')
        .select('lesson_id, attendance_taken, student_count')
        .eq('lesson_id', lessonId)
        .single();

      if (error || !lesson) {
        console.error('❌ Error fetching lesson attendance:', error);
        return;
      }

      // Check if it's a past/ongoing lesson
      const lessonFromTable = classTimetable.find(l => l.id === lessonId);
      if (!lessonFromTable || (!lessonFromTable.isPast && !lessonFromTable.isOngoing)) {
        return; // Don't update future lessons
      }

      let newStatus: 'complete' | 'missing' | 'incomplete' | 'future' = 'missing';

      if (lesson.attendance_taken) {
        // Get actual attendance count
        const { data: attendanceCount, error: countError } = await supabase
          .from('student_attendance_logs')
          .select('lesson_id', { count: 'exact' })
          .eq('lesson_id', lessonId);

        if (!countError) {
          const studentsWithAttendance = attendanceCount?.length || 0;
          const totalStudents = lesson.student_count || 1;

          if (studentsWithAttendance === 0) {
            newStatus = 'missing';
          } else if (studentsWithAttendance >= totalStudents) {
            newStatus = 'complete';
          } else {
            newStatus = 'incomplete';
          }
        }
      }

      // Update only this lesson's attendance status
      setAttendanceStatuses(prev => ({
        ...prev,
        [lessonId]: newStatus
      }));

      console.log('✅ Updated attendance status for lesson', lessonId, 'to', newStatus);
    } catch (error) {
      console.error('💥 Error updating lesson attendance status:', error);
    }
  };

  // Fetch database-driven periods and school days
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setIsLoading(true);

        // Get current user profile to extract school_id
        const userProfile = await getCurrentUserProfile();
        const currentSchoolId = userProfile?.school_id;

        if (!currentSchoolId) {
          console.error('❌ No school ID found in user profile');
          return;
        }

        setSchoolId(currentSchoolId);

        // Calculate start of the selected week
        const weekStart = new Date(selectedWeek);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);

        // Fetch periods, school days, and lessons in parallel with optimized approach
        const [periodsData, schoolDaysData] = await Promise.all([
          getSchedulePeriods(currentSchoolId, ['instructional', 'flex']),
          getSchoolDays(currentSchoolId)
        ]);

        // Pass pre-fetched schoolDaysData and userProfile to avoid redundant calls
        const lessonsData = await getLessonsForWeek(
          selectedClass.id,
          currentSchoolId,
          weekStart,
          schoolDaysData,
          userProfile
        );

        setSchedulePeriods(periodsData);
        setSchoolDays(schoolDaysData);
        setClassTimetable(lessonsData);

        // Initialize attendance statuses from fetched lessons
        const initialStatuses: Record<string, 'complete' | 'missing' | 'incomplete' | 'future'> = {};
        lessonsData.forEach(lesson => {
          initialStatuses[lesson.id] = lesson.attendanceStatus;
        });
        setAttendanceStatuses(initialStatuses);

        if (lessonsData.length === 0) {
          console.warn('⚠�� No lessons found for:', {
            classId: selectedClass.id,
            className: selectedClass.name,
            schoolId: currentSchoolId,
            weekStart: weekStart.toDateString()
          });

          // For testing - add a dummy lesson to verify the UI is working
          console.log('�� Adding test lesson to verify UI functionality');
          const testLesson = {
            id: 'test-1',
            period: 1,
            day: 'Montag',
            time: '08:00-08:45',
            subject: 'Test',
            teacher: 'Test Teacher',
            room: 'Test Room',
            attendanceStatus: 'future' as const,
            isPast: false,
            isOngoing: false,
            subjectColor: 'bg-blue-100 text-blue-800',
            status: 'normal' as const,
            classId: selectedClass.id
          };
          setClassTimetable([testLesson]);
        }

      } catch (error) {
        console.error('💥 Error fetching schedule data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduleData();
  }, [selectedClass.id, selectedWeek]);

  // Set up targeted real-time subscription for attendance updates
  useEffect(() => {
    if (!schoolId || classTimetable.length === 0) return;

    console.log('🔗 Setting up targeted real-time subscription for attendance updates');

    // Subscribe to student_attendance_logs changes
    const attendanceSubscription = supabase
      .channel('attendance-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_attendance_logs',
          filter: `school_id=eq.${schoolId}`
        },
        (payload) => {
          console.log('📡 Real-time attendance update received:', payload);

          // Get the lesson ID from the payload
          const lessonId = payload.new?.lesson_id || payload.old?.lesson_id;
          if (lessonId) {
            // Only update the specific lesson's attendance status
            updateLessonAttendanceStatus(lessonId);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(attendanceSubscription);
    };
  }, [schoolId, classTimetable.length]);

  // Check if a time slot has any lessons across all days
  const hasLessonsInPeriod = (period: number) => {
    return schoolDays.some(schoolDay => {
      const dayName = schoolDay.day.name_de || schoolDay.day.name_en;
      const lesson = classTimetable.find(lesson => lesson.period === period && lesson.day === dayName);
      return lesson !== undefined;
    });
  };

  const getWeekDates = (selectedWeek: Date) => {
    if (schoolDays.length === 0) return [];

    const startOfWeek = new Date(selectedWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const dates = [];
    // Generate dates based on the actual school days
    schoolDays.forEach((schoolDay, index) => {
      // schoolDay.day.day_number: 1=Monday, 2=Tuesday, ..., 6=Saturday, 0=Sunday
      const dayOffset = schoolDay.day.day_number === 0 ? 6 : schoolDay.day.day_number - 1; // Convert to 0-6 where 0=Monday
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + dayOffset);
      dates.push(date);
    });

    return dates;
  };

  const getStatusIcon = (lesson: Lesson) => {
    // Use the real-time updated status if available, otherwise fall back to lesson data
    const currentStatus = attendanceStatuses[lesson.id] || lesson.attendanceStatus;

    console.log(`🎨 Rendering status icon for lesson ${lesson.id}:`, {
      subject: lesson.subject,
      originalStatus: lesson.attendanceStatus,
      currentStatus: currentStatus,
      isPast: lesson.isPast,
      isOngoing: lesson.isOngoing
    });

    // Don't show any icon for future lessons
    if (currentStatus === 'future') {
      console.log('⏭️ Future lesson - no icon');
      return null;
    }

    switch (currentStatus) {
      case 'complete':
        console.log('✅ Complete status - green check');
        return <Check className="h-4 w-4 text-green-600" />;
      case 'missing':
        console.log('❌ Missing status - red triangle');
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'incomplete':
        console.log('⚠️ Incomplete status - orange circle');
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        console.log('❓ Unknown status - no icon');
        return null;
    }
  };

  const getChangeIcon = (lesson: Lesson) => {
    switch (lesson.status) {
      case 'cancelled':
        return <X className="h-3 w-3 text-red-600" />;
      case 'room_changed':
      case 'teacher_changed':
        return <RefreshCw className="h-3 w-3 text-blue-600" />;
      default:
        return null;
    }
  };

  const getCommentIcon = (lesson: Lesson) => {
    if (!lesson.adminComment) return null;
    
    if (isMobile) {
      // On mobile, return a clickable icon that opens modal
      return (
        <MessageSquare 
          className="h-3 w-3 text-blue-600 cursor-pointer" 
          onClick={(e) => {
            e.stopPropagation();
            setCommentModalLesson(lesson);
          }}
        />
      );
    }

    // On desktop, use tooltip as before
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <MessageSquare className="h-3 w-3 text-blue-600 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64">
          <p className="text-sm">{lesson.adminComment}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const getLessonBackgroundColor = (lesson: Lesson) => {
    switch (lesson.status) {
      case 'cancelled':
        return 'bg-red-50 border-red-200';
      case 'room_changed':
        return 'bg-blue-50 border-blue-200';
      case 'teacher_changed':
        return 'bg-amber-50 border-amber-200';
      default:
        return '';
    }
  };

  const canEditAttendance = (lesson: Lesson) => {
    return lesson.status !== 'cancelled' && (lesson.isPast || lesson.isOngoing);
  };

  const getLessonForSlot = (period: number, day: string) => {
    return classTimetable.find(lesson => lesson.period === period && lesson.day === day);
  };

  // Handle lesson click - mobile vs desktop behavior
  const handleLessonClick = (lesson: Lesson) => {
    console.log('🖱️ Lesson tile clicked:', {
      id: lesson.id,
      subject: lesson.subject,
      time: lesson.time,
      attendanceStatus: lesson.attendanceStatus,
      status: lesson.status,
      isPast: lesson.isPast,
      isOngoing: lesson.isOngoing,
      canEdit: canEditAttendance(lesson),
      fullLesson: lesson
    });

    if (canEditAttendance(lesson)) {
      console.log('✅ Lesson is editable, opening attendance modal');
      // If attendance click handler is provided, use the attendance modal
      if (onAttendanceClick) {
        // Use 'edit' mode for lessons that can be edited, 'overview' for completed ones
        const viewMode = lesson.attendanceStatus === 'complete' ? 'overview' : 'edit';
        console.log('🎯 Opening attendance modal with viewMode:', viewMode);
        onAttendanceClick(lesson.id, viewMode);
      } else {
        console.log('⚠️ No attendance click handler, using fallback modal');
        // Fallback to the old modal if no attendance handler provided
        setSelectedLesson(lesson);
      }
    } else {
      console.log('❌ Lesson is not editable - no action taken');
    }
  };

  // Generate display names for school days
  const weekDays = schoolDays.map(schoolDay => schoolDay.day.name_de || schoolDay.day.name_en);
  const mobileWeekDays = schoolDays.map(schoolDay => {
    const dayName = schoolDay.day.name_de || schoolDay.day.name_en;
    // Create mobile abbreviations
    const mobileMap: Record<string, string> = {
      'Montag': 'Mo', 'Monday': 'Mo',
      'Dienstag': 'Di', 'Tuesday': 'Di',
      'Mittwoch': 'Mi', 'Wednesday': 'Mi',
      'Donnerstag': 'Do', 'Thursday': 'Do',
      'Freitag': 'Fr', 'Friday': 'Fr',
      'Samstag': 'Sa', 'Saturday': 'Sa',
      'Sonntag': 'So', 'Sunday': 'So'
    };
    return mobileMap[dayName] || dayName.substring(0, 2);
  });
  const displayWeekDays = isMobile ? mobileWeekDays : weekDays;
  const weekDates = getWeekDates(selectedWeek);

  // Day names and lessons loaded successfully

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Lade Stundenplan...</span>
        </div>
      </div>
    );
  }

  // Show error state if no data loaded
  if (schedulePeriods.length === 0 || schoolDays.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Keine Stundenplandaten gefunden</h3>
          <p className="text-muted-foreground">
            Es konnten keine Zeiten oder Schultage für diese Schule geladen werden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DebugOverlay name="KlassenbuchLiveView">
      <TooltipProvider>
      <div className="space-y-6">
        <div className={`flex items-center ${isMobile ? 'flex-col space-y-4' : 'justify-between'}`}>
          <div className={isMobile ? 'w-full text-center' : ''}>
            <h2 className="text-2xl font-semibold">Stundenplan - Live Ansicht</h2>
            <p className="text-muted-foreground">{selectedClass.name}</p>
            <p className="text-xs text-muted-foreground">Schule ID: {schoolId}</p>
          </div>
          
          {/* Hide legend on mobile */}
          {!isMobile && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Anwesenheit erfasst</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span>Unvollständig</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Anwesenheit fehlt</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span>Kommentar</span>
              </div>
            </div>
          )}
        </div>

        {/* Timetable Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Wochenstundenplan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className={`p-3 text-left font-medium bg-muted ${isMobile ? 'min-w-8' : 'min-w-20'}`}>
                      {isMobile ? 'St.' : 'Stunde'}
                    </th>
                    {displayWeekDays.map((day, index) => (
                      <th key={day} className={`p-3 text-center font-medium bg-muted ${isMobile ? 'min-w-16' : 'min-w-40'}`}>
                        <div>
                          <div>{day}</div>
                          <div className="text-xs text-muted-foreground font-normal">
                            {weekDates[index].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedulePeriods.map((period) => {
                    const hasLessons = hasLessonsInPeriod(period.block_number);
                    const rowHeight = hasLessons ? (isMobile ? 'min-h-20' : 'min-h-16') : 'h-8';
                    const timeSlot = formatTimeSlot(period);

                    return (
                      <tr key={period.block_number} className="border-b hover:bg-muted/30">
                        <td className={`p-3 border-r bg-muted/50 ${!hasLessons ? 'py-1' : ''}`}>
                          <div className="text-center">
                            <div className="font-semibold">{period.label}</div>
                            {!isMobile && hasLessons && (
                              <div className="text-xs text-muted-foreground">{timeSlot}</div>
                            )}
                            {!isMobile && period.group_label && (
                              <div className="text-xs text-blue-600">{period.group_label}</div>
                            )}
                          </div>
                        </td>
                        {weekDays.map((day, dayIndex) => {
                          const lesson = getLessonForSlot(period.block_number, day);
                          return (
                            <td key={`${period.block_number}-${day}`} className={`border-r ${isMobile ? 'p-1' : 'p-2'} ${!hasLessons ? 'py-1' : ''}`}>
                              {lesson ? (
                                <div
                                  className={`p-2 rounded-md transition-all border ${
                                    canEditAttendance(lesson) 
                                      ? 'cursor-pointer hover:shadow-md hover:border-primary' 
                                      : lesson.status === 'cancelled' 
                                        ? 'opacity-60' 
                                        : 'opacity-75'
                                  } ${lesson.subjectColor} ${getLessonBackgroundColor(lesson)} ${rowHeight}`}
                                  onClick={() => handleLessonClick(lesson)}
                                >
                                  <div className={`space-y-1 ${isMobile ? 'text-xs' : ''}`}>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-1">
                                        <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                          {isMobile ? (lesson.subjectAbbreviation || lesson.subject) : lesson.subject}
                                        </span>
                                        {getChangeIcon(lesson)}
                                        {getCommentIcon(lesson)}
                                      </div>
                                      {getStatusIcon(lesson)}
                                    </div>
                                    {lesson.teacher && (
                                      <div className={`text-blue-600 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                        {lesson.teacher}
                                      </div>
                                    )}
                                    {lesson.room && (
                                      <div className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                        {lesson.room}
                                      </div>
                                    )}
                                    {lesson.status === 'cancelled' && (
                                      <div className={`text-red-600 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                        ENTFÄLLT
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className={`flex items-center justify-center text-muted-foreground ${hasLessons ? (isMobile ? 'h-20' : 'h-16') : 'h-8'}`}>
                                  —
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Hide Legends on mobile */}
        {!isMobile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Subject Legend */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Fächer</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {Array.from(new Set(classTimetable.map(lesson => lesson.subject))).map((subject) => {
                    const lesson = classTimetable.find(l => l.subject === subject);
                    if (!lesson) return null;

                    const subjectLabels: Record<string, string> = {
                      'DAZ': 'DAZ (Deutsch als Zweitsprache)',
                      'En': 'En (Englisch)',
                      'Ma': 'Ma (Mathematik)',
                      'GeWi': 'GeWi (Gesellschaftswissenschaften)',
                      'NaWi': 'NaWi (Naturwissenschaften)',
                      'Sp': 'Sp (Sport)',
                      'De': 'De (Deutsch)',
                      'Ph': 'Ph (Physik)',
                      'Ge': 'Ge (Geschichte)',
                      'Bio': 'Bio (Biologie)',
                      'Ch': 'Ch (Chemie)',
                      'Mu': 'Mu (Musik)',
                      'Fr': 'Fr (Französisch)',
                      'Ku': 'Ku (Kunst)',
                      'Eth': 'Eth (Ethik)',
                      'Kla': 'Kla (Klassenleitung)',
                      'AUB': 'AUB (Arbeitsunterricht)',
                      'Inf': 'Inf (Informatik)',
                      'PoWi': 'PoWi (Politik und Wirtschaft)',
                      'AWT': 'AWT (Arbeitslehre)',
                      'WPU': 'WPU (Wahlpflichtunterricht)',
                      // Course subjects
                      'Bowling': 'Bowling (Wahlpflichtkurs)',
                      'Tischtennis': 'Tischtennis (Wahlpflichtkurs)',
                    };

                    return (
                      <div key={subject} className="flex items-center space-x-2">
                        <div className={`w-4 h-4 border rounded ${lesson.subjectColor.replace('text-', 'border-')}`}></div>
                        <span>{subjectLabels[subject] || subject}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Status Legend */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Symbole</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                    <span>Admin-Kommentar (mit Maus berühren)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                    <X className="h-3 w-3 text-red-600" />
                    <span>Stunde entfällt</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                    <RefreshCw className="h-3 w-3 text-blue-600" />
                    <span>Raumänderung</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
                    <RefreshCw className="h-3 w-3 text-blue-600" />
                    <span>Lehrkraftwechsel</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Modal */}
        {selectedLesson && (
          <KlassenbuchAttendanceModal
            lesson={selectedLesson}
            classData={selectedClass}
            isOpen={!!selectedLesson}
            onClose={() => {
              setSelectedLesson(null);
              // Update attendance status after modal closes
              setTimeout(() => updateLessonAttendanceStatus(selectedLesson.id), 500);
            }}
          />
        )}

        {/* Comment Modal for Mobile */}
        {commentModalLesson && (
          <Dialog open={!!commentModalLesson} onOpenChange={() => setCommentModalLesson(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Stundenkommentar</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{commentModalLesson.subject}</span>
                  <span>•</span>
                  <span>{commentModalLesson.teacher}</span>
                  <span>•</span>
                  <span>{commentModalLesson.room}</span>
                </div>
                <p className="text-sm">{commentModalLesson.adminComment}</p>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setCommentModalLesson(null)}>
                    Schließen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      </TooltipProvider>
    </DebugOverlay>
  );
}
