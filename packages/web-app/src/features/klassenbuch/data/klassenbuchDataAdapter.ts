// Data adapter that integrates Klassen Buch mock data with the web-app system
// This provides the same API as the original mockData but can be swapped for real data later

// Re-export the types and data from the local mockData copy
export type {
  Student,
  Lesson,
  Course,
  CourseStudent,
  AttendanceRecord,
  ExcuseEditHistory,
  ExcuseInfo,
  CourseAttendanceEntry,
  AbsenceDetail,
  LatenessDetail,
  StudentStatistics
} from './mockData';

// New types for database-driven data
export interface SchedulePeriod {
  id: string;
  school_id: string;
  block_number: number;
  start_time: string; // time format: "08:00:00"
  end_time: string;   // time format: "08:45:00"
  label: string;
  group_label?: string;
  attendance_requirement: 'required' | 'flexible' | 'contracted';
  block_type: 'instructional' | 'break' | 'flex' | 'before_school' | 'after_school' | 'admin' | 'custom';
  created_by?: string;
}

export interface StructureDay {
  id: number;
  name_en: string;
  name_de?: string;
  day_number: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  order_index: number;
}

export interface SchoolDay {
  school_id: string;
  day_id: number;
  day: StructureDay;
}

// Import and re-export all the data and helper functions
export {
  CURRENT_TEACHER,
  SEMESTER_START_DATE,
  getCurrentDate,
  mockStudents,
  mockCourses,
  mockCourseStudents,
  mockTimetables,
  teacherSchedule,
  mockStudentStatistics,
  mockCourseData,
  getStudentsForClass,
  getTeacherLessons,
  getStudentStatisticsForClass,
  getAllStudentStatistics,
  getCourseDataForClass,
  getCourseStudentsForCourse,
  getAllCoursesAndClasses,
  getClassesForStatistics,
  getCoursesForStatistics,
  getAvailableClasses,
  getStudentById,
  updateAbsenceDetails,
  updateLatenessDetails,
  convertToExcused,
  getStudentIdFromCourseName,
  getClassNameById
} from './mockData';

// Override getTimetableForClass to use database data
export async function getTimetableForClass(classId: string, weekStart?: Date): Promise<Lesson[]> {
  return getTimetableForClassFromDB(classId, weekStart);
}

// Additional adapter functions can be added here to bridge any gaps
// between the Klassen Buch data structure and the web-app requirements

// Example: adapter function to format data for the main dashboard
export function getKlassenbuchSummary() {
  // This could provide a summary of Klassenbuch data for dashboard widgets
  return {
    totalClasses: 3,
    pendingAttendance: 5,
    recentChanges: 2
  };
}

// Import Supabase client
import { supabase, getCurrentUserProfile } from '../../../lib/supabase.js';

/**
 * Get the current user's school ID
 * @returns Promise<string | null> - The school ID or null if not found
 */
export async function getCurrentSchoolId(): Promise<string | null> {
  try {
    const userProfile = await getCurrentUserProfile();
    return userProfile?.school_id || null;
  } catch (error) {
    console.error('💥 Error getting current school ID:', error);
    return null;
  }
}

/**
 * Get schedule periods for a school filtered by block_type
 * @param schoolId - The school ID
 * @param blockTypes - Array of block types to filter by (default: ['instructional', 'flex'])
 * @returns Promise<Array of schedule periods>
 */
export async function getSchedulePeriods(schoolId: string, blockTypes: string[] = ['instructional', 'flex']): Promise<SchedulePeriod[]> {
  try {
    console.log('📅 Fetching schedule periods for school:', schoolId, 'with block types:', blockTypes);

    const { data: periods, error } = await supabase
      .from('schedule_periods')
      .select('*')
      .eq('school_id', schoolId)
      .in('block_type', blockTypes)
      .order('block_number', { ascending: true });

    if (error) {
      console.error('❌ Error fetching schedule periods:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ Schedule periods fetched:', periods?.length || 0, 'periods');
    console.log('📋 Raw periods data:', periods);
    return periods || [];

  } catch (error) {
    console.error('💥 Error in getSchedulePeriods:', error);
    // Return fallback periods to prevent UI from breaking
    return [
      { id: '1', school_id: schoolId, block_number: 1, start_time: '08:00:00', end_time: '08:45:00', label: '1. Stunde', group_label: 'Vormittag', attendance_requirement: 'required', block_type: 'instructional' },
      { id: '2', school_id: schoolId, block_number: 2, start_time: '08:50:00', end_time: '09:35:00', label: '2. Stunde', group_label: 'Vormittag', attendance_requirement: 'required', block_type: 'instructional' },
      { id: '3', school_id: schoolId, block_number: 3, start_time: '09:55:00', end_time: '10:40:00', label: '3. Stunde', group_label: 'Vormittag', attendance_requirement: 'required', block_type: 'instructional' },
      { id: '4', school_id: schoolId, block_number: 4, start_time: '10:45:00', end_time: '11:30:00', label: '4. Stunde', group_label: 'Vormittag', attendance_requirement: 'required', block_type: 'instructional' },
      { id: '5', school_id: schoolId, block_number: 5, start_time: '11:50:00', end_time: '12:35:00', label: '5. Stunde', group_label: 'Nachmittag', attendance_requirement: 'required', block_type: 'instructional' },
      { id: '6', school_id: schoolId, block_number: 6, start_time: '12:40:00', end_time: '13:25:00', label: '6. Stunde', group_label: 'Nachmittag', attendance_requirement: 'required', block_type: 'instructional' },
    ];
  }
}

/**
 * Get operating days for a school
 * @param schoolId - The school ID
 * @returns Promise<Array of school days with day information>
 */
export async function getSchoolDays(schoolId: string): Promise<SchoolDay[]> {
  try {
    console.log('📅 Fetching school days for school:', schoolId);

    const { data: schoolDays, error } = await supabase
      .from('structure_school_days')
      .select(`
        school_id,
        day_id,
        structure_days (
          id,
          name_en,
          name_de,
          day_number,
          order_index
        )
      `)
      .eq('school_id', schoolId)
      .order('structure_days(order_index)', { ascending: true });

    if (error) {
      console.error('❌ Error fetching school days:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ School days fetched:', schoolDays?.length || 0, 'days');
    console.log('📋 Raw school days data:', schoolDays);

    // Transform the data to match our SchoolDay interface
    const transformedDays: SchoolDay[] = (schoolDays || []).map(schoolDay => ({
      school_id: schoolDay.school_id,
      day_id: schoolDay.day_id,
      day: {
        id: schoolDay.structure_days.id,
        name_en: schoolDay.structure_days.name_en,
        name_de: schoolDay.structure_days.name_de,
        day_number: schoolDay.structure_days.day_number,
        order_index: schoolDay.structure_days.order_index
      }
    }));

    return transformedDays;

  } catch (error) {
    console.error('💥 Error in getSchoolDays:', error);
    // Return fallback school days (Monday-Friday) to prevent UI from breaking
    return [
      { school_id: schoolId, day_id: 1, day: { id: 1, name_en: 'Monday', name_de: 'Montag', day_number: 1, order_index: 1 } },
      { school_id: schoolId, day_id: 2, day: { id: 2, name_en: 'Tuesday', name_de: 'Dienstag', day_number: 2, order_index: 2 } },
      { school_id: schoolId, day_id: 3, day: { id: 3, name_en: 'Wednesday', name_de: 'Mittwoch', day_number: 3, order_index: 3 } },
      { school_id: schoolId, day_id: 4, day: { id: 4, name_en: 'Thursday', name_de: 'Donnerstag', day_number: 4, order_index: 4 } },
      { school_id: schoolId, day_id: 5, day: { id: 5, name_en: 'Friday', name_de: 'Freitag', day_number: 5, order_index: 5 } },
    ];
  }
}

/**
 * Format time from database format (HH:MM:SS) to display format (HH:MM)
 * @param timeString - Time in format "08:00:00"
 * @returns Time in format "08:00"
 */
export function formatTime(timeString: string): string {
  return timeString.substring(0, 5); // Remove seconds
}

/**
 * Format time slot for display
 * @param period - Schedule period
 * @returns Formatted time slot like "08:00-08:45"
 */
export function formatTimeSlot(period: SchedulePeriod): string {
  return `${formatTime(period.start_time)}-${formatTime(period.end_time)}`;
}

// Interface for database lesson data
interface DatabaseLesson {
  lesson_id: string;
  subject_name: string;
  class_name: string;
  room_name: string;
  start_datetime: string;
  end_datetime: string;
  lesson_type: 'regular' | 'cancelled' | 'substitute';
  is_cancelled: boolean;
  teacher_names: string[];
  period_number: number;
  period_label: string;
  attendance_taken: boolean;
  student_count: number; // Total students in the lesson
  school_id: string;
  lesson_date: string;
  subject_abbreviation?: string;
  subject_color?: string;
  class_id?: string;
  course_id?: string;
}

/**
 * Check attendance completion for a lesson
 * @param lessonId - The lesson ID
 * @returns Promise<AttendanceCompletion>
 */
interface AttendanceCompletion {
  status: 'complete' | 'incomplete' | 'missing';
  studentsWithAttendance: number;
  totalStudents: number;
  completionPercentage: number;
}

// Optimized: Batch attendance checking for all lessons at once
async function batchCheckAttendanceCompletion(lessonIds: string[]): Promise<Map<string, number>> {
  try {
    console.log('🚀 Batch checking attendance for', lessonIds.length, 'lessons');

    if (lessonIds.length === 0) {
      return new Map();
    }

    // Single query to get attendance counts for all lessons
    const { data: attendanceCounts, error: attendanceError } = await supabase
      .from('student_attendance_logs')
      .select('lesson_id')
      .in('lesson_id', lessonIds);

    if (attendanceError) {
      console.error('❌ Error fetching batch attendance records:', {
        message: attendanceError.message,
        code: attendanceError.code,
        details: attendanceError.details,
        hint: attendanceError.hint
      });
      return new Map();
    }

    // Count attendance records per lesson
    const attendanceMap = new Map<string, number>();

    // Initialize all lessons with 0
    lessonIds.forEach(id => attendanceMap.set(id, 0));

    // Count actual attendance records
    (attendanceCounts || []).forEach(record => {
      const current = attendanceMap.get(record.lesson_id) || 0;
      attendanceMap.set(record.lesson_id, current + 1);
    });

    console.log('✅ Batch attendance check completed:', attendanceMap.size, 'lessons processed');
    return attendanceMap;

  } catch (error) {
    console.error('💥 Error in batch attendance check:', error);
    return new Map();
  }
}

// Optimized lesson transformation with batched attendance checking
async function transformDatabaseLessonsOptimized(dbLessons: DatabaseLesson[], schoolDays: SchoolDay[]): Promise<Lesson[]> {
  if (dbLessons.length === 0) {
    return [];
  }

  console.log('🚀 Starting optimized lesson transformation for', dbLessons.length, 'lessons');

  // Batch attendance checking for lessons that have attendance_taken = true
  const lessonsWithAttendance = dbLessons.filter(lesson => lesson.attendance_taken);
  const attendanceCounts = await batchCheckAttendanceCompletion(
    lessonsWithAttendance.map(lesson => lesson.lesson_id)
  );

  // Transform all lessons using the batched attendance data
  return dbLessons.map(dbLesson => {
    const now = new Date();
    const lessonStart = new Date(dbLesson.start_datetime);
    const lessonEnd = new Date(dbLesson.end_datetime);

    // Determine if lesson is past, ongoing, or future
    const isPast = lessonEnd < now;
    const isOngoing = lessonStart <= now && lessonEnd >= now;

    // Get day name using the school's day mapping
    const lessonDayNumber = lessonStart.getDay();
    const schoolDay = schoolDays.find(sd => sd.day.day_number === lessonDayNumber);
    const dayName = schoolDay?.day.name_de || schoolDay?.day.name_en || 'Unbekannt';

    // Format time
    const timeString = `${lessonStart.toTimeString().substring(0, 5)}-${lessonEnd.toTimeString().substring(0, 5)}`;

    // Determine attendance status with optimized checking
    let attendanceStatus: 'complete' | 'missing' | 'incomplete' | 'future' = 'future';

    if (isPast || isOngoing) {
      if (dbLesson.attendance_taken) {
        const studentsWithAttendance = attendanceCounts.get(dbLesson.lesson_id) || 0;
        const totalStudents = dbLesson.student_count || 1;

        if (studentsWithAttendance === 0) {
          attendanceStatus = 'missing';
        } else if (studentsWithAttendance >= totalStudents) {
          attendanceStatus = 'complete';
        } else {
          attendanceStatus = 'incomplete';
        }

        console.log(`📊 ${dbLesson.lesson_id} (${dbLesson.subject_name}): ${studentsWithAttendance}/${totalStudents} = ${attendanceStatus}`);
      } else {
        attendanceStatus = 'missing';
      }
    }

    // Get subject color
    const subjectColors: Record<string, string> = {
      'Deutsch': 'bg-emerald-100 text-emerald-800',
      'Mathematik': 'bg-green-100 text-green-800',
      'Englisch': 'bg-blue-100 text-blue-800',
      'DAZ': 'bg-red-100 text-red-800',
      'Sport': 'bg-yellow-100 text-yellow-800',
      'Physik': 'bg-cyan-100 text-cyan-800',
      'Chemie': 'bg-violet-100 text-violet-800',
      'Biologie': 'bg-lime-100 text-lime-800',
      'Geschichte': 'bg-amber-100 text-amber-800',
      'Musik': 'bg-pink-100 text-pink-800',
      'Kunst': 'bg-orange-100 text-orange-800',
      'Ethik': 'bg-teal-100 text-teal-800',
      'Französisch': 'bg-rose-100 text-rose-800',
      'Politik': 'bg-red-100 text-red-800'
    };

    const subjectColor = subjectColors[dbLesson.subject_name] || 'bg-gray-100 text-gray-800';

    return {
      id: dbLesson.lesson_id,
      period: dbLesson.period_number || 1,
      day: dayName,
      time: timeString,
      subject: dbLesson.subject_abbreviation || dbLesson.subject_name.substring(0, 2).toUpperCase(),
      teacher: dbLesson.teacher_names[0] || 'N/A',
      room: dbLesson.room_name || '',
      attendanceStatus,
      isPast,
      isOngoing: isOngoing,
      subjectColor,
      status: dbLesson.is_cancelled ? 'cancelled' : (dbLesson.lesson_type === 'substitute' ? 'teacher_changed' : 'normal'),
      adminComment: dbLesson.notes || undefined,
      classId: dbLesson.class_id || dbLesson.course_id || '',
      startTime: lessonStart.toISOString(),
      endTime: lessonEnd.toISOString()
    };
  });
}

// Legacy individual lesson checking - kept for single lesson fetches
async function checkAttendanceCompletion(lessonId: string, totalStudents: number): Promise<AttendanceCompletion> {
  const attendanceMap = await batchCheckAttendanceCompletion([lessonId]);
  const studentsWithAttendance = attendanceMap.get(lessonId) || 0;
  const completionPercentage = totalStudents > 0 ? (studentsWithAttendance / totalStudents) * 100 : 0;

  let status: 'complete' | 'incomplete' | 'missing';
  if (studentsWithAttendance === 0) {
    status = 'missing';
  } else if (studentsWithAttendance >= totalStudents) {
    status = 'complete';
  } else {
    status = 'incomplete';
  }

  return { status, studentsWithAttendance, totalStudents, completionPercentage };
}

/**
 * Get lessons for a specific class/course for the current week
 * @param classId - The class ID (can be 'teacher' for teacher view)
 * @param schoolId - The school ID
 * @param weekStart - Start date of the week
 * @returns Promise<Array of lessons>
 */
export async function getLessonsForWeek(classId: string, schoolId: string, weekStart: Date): Promise<Lesson[]> {
  // First get the school days to map day numbers to names correctly
  const schoolDaysData = await getSchoolDays(schoolId);
  try {
    console.log('📚 Fetching lessons for class:', classId, 'school:', schoolId, 'week:', weekStart);

    // Calculate week range
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    console.log('📅 Date range:', { weekStartStr, weekEndStr });

    let query = supabase
      .from('vw_react_lesson_details')
      .select('*')
      .eq('school_id', schoolId)
      .gte('lesson_date', weekStartStr)
      .lte('lesson_date', weekEndStr)
      .order('start_datetime', { ascending: true });

    console.log('🔍 Base query setup for school:', schoolId);

    // First, let's check if there are ANY lessons in the database for this school
    console.log('🧪 Testing if lessons exist in database...');
    const { data: testLessons, error: testError } = await supabase
      .from('vw_react_lesson_details')
      .select('lesson_id, subject_name, class_name, lesson_date')
      .eq('school_id', schoolId)
      .limit(5);

    if (testError) {
      console.error('❌ Test query failed:', testError);
    } else {
      console.log('✅ Test query result - total lessons found:', testLessons?.length || 0);
      console.log('📋 Sample lessons:', testLessons);
    }

    // Filter by class or teacher depending on the view
    if (classId === 'teacher') {
      // For teacher view, get current user's profile to filter by teacher
      const userProfile = await getCurrentUserProfile();
      if (userProfile?.id) {
        query = query.eq('assigned_teacher_id', userProfile.id);
      }
    } else if (classId && !classId.startsWith('course-')) {
      // For class view, filter by class_id
      // Map our mock class IDs to actual class names or IDs
      const classNameMap: Record<string, string> = {
        '1': '9A',
        '2': '9B',
        '3': '10A'
      };
      const className = classNameMap[classId] || classId;
      query = query.eq('class_name', className);
    } else if (classId.startsWith('course-')) {
      // For course view, filter by course_id
      query = query.eq('course_id', classId);
    }

    const { data: lessons, error } = await query;

    if (error) {
      console.error('❌ Error fetching lessons:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ Lessons fetched:', lessons?.length || 0, 'lessons');
  console.log('📋 Raw lessons data:', lessons);
  console.log('🔢 Raw lesson periods from DB:', lessons?.map(l => ({
    lesson_id: l.lesson_id,
    period_number: l.period_number,
    block_number: l.block_number,
    period_label: l.period_label,
    period_start_time: l.period_start_time,
    period_end_time: l.period_end_time,
    day_number: l.lesson_start ? new Date(l.lesson_start).getDay() : 'unknown',
    lesson_start: l.lesson_start,
    subject_name: l.subject_name,
    allAvailableFields: Object.keys(l)
  })).slice(0, 3)); // Show first 3 lessons to avoid console spam

    // Transform database lessons to our Lesson interface with optimized attendance checking
    const transformedLessons: Lesson[] = await transformDatabaseLessonsOptimized(lessons || [], schoolDaysData);

    console.log('🔄 Transformed lessons:', transformedLessons);
  console.log('🔢 Transformed lesson periods:', transformedLessons.map(l => ({
    id: l.id,
    period: l.period,
    periodType: typeof l.period,
    day: l.day,
    subject: l.subject,
    startTime: l.startTime,
    endTime: l.endTime
  })));
  return transformedLessons;

  } catch (error) {
    console.error('💥 Error in getLessonsForWeek:', error);
    return []; // Return empty array on error to prevent UI from breaking
  }
}

/**
 * Transform database lesson to our Lesson interface
 * @param dbLesson - Database lesson from vw_react_lesson_details
 * @param schoolDays - School days data for proper day name mapping
 * @returns Transformed lesson
 */
async function transformDatabaseLesson(dbLesson: DatabaseLesson, schoolDays: SchoolDay[]): Promise<Lesson> {
  const now = new Date();
  const lessonStart = new Date(dbLesson.start_datetime);
  const lessonEnd = new Date(dbLesson.end_datetime);

  // Determine if lesson is past, ongoing, or future
  const isPast = lessonEnd < now;
  const isOngoing = lessonStart <= now && lessonEnd >= now;

  // Get day name using the school's day mapping
  const lessonDayNumber = lessonStart.getDay(); // 0=Sunday, 1=Monday, etc.
  const schoolDay = schoolDays.find(sd => sd.day.day_number === lessonDayNumber);
  const dayName = schoolDay?.day.name_de || schoolDay?.day.name_en || 'Unbekannt';

  console.log('🗓️ Lesson day mapping:', {
    lessonDayNumber,
    dayName,
    lessonDate: lessonStart.toDateString(),
    schoolDayFound: !!schoolDay
  });

  // Format time
  const timeString = `${lessonStart.toTimeString().substring(0, 5)}-${lessonEnd.toTimeString().substring(0, 5)}`;

  // Determine attendance status with proper completion checking
  let attendanceStatus: 'complete' | 'missing' | 'incomplete' | 'future' = 'future';

  console.log(`📅 Determining attendance status for lesson ${dbLesson.lesson_id}:`, {
    subject: dbLesson.subject_name,
    startTime: dbLesson.start_datetime,
    isPast,
    isOngoing,
    attendance_taken: dbLesson.attendance_taken,
    student_count: dbLesson.student_count
  });

  if (isPast || isOngoing) {
    console.log('🕒 Lesson is past or ongoing, checking attendance...');
    if (dbLesson.attendance_taken) {
      console.log('📝 Attendance has been taken, checking completion level...');
      // Check if attendance is complete or partial
      const completion = await checkAttendanceCompletion(dbLesson.lesson_id, dbLesson.student_count);
      attendanceStatus = completion.status;
      console.log(`🎯 Final attendance status: ${attendanceStatus}`, completion);
    } else {
      console.log('❌ No attendance taken - marking as missing');
      attendanceStatus = 'missing';
    }
  } else {
    console.log('⏭️ Future lesson - marking as future');
  }

  // Determine status
  let status: 'normal' | 'cancelled' | 'room_changed' | 'teacher_changed' = 'normal';
  if (dbLesson.is_cancelled) {
    status = 'cancelled';
  } else if (dbLesson.lesson_type === 'substitute') {
    status = 'teacher_changed';
  }

  // Get subject color (fallback to default colors)
  const subjectColors: Record<string, string> = {
    'Deutsch': 'bg-emerald-100 text-emerald-800',
    'Mathematik': 'bg-green-100 text-green-800',
    'Englisch': 'bg-blue-100 text-blue-800',
    'DAZ': 'bg-red-100 text-red-800',
    'Sport': 'bg-yellow-100 text-yellow-800',
    'Physik': 'bg-cyan-100 text-cyan-800',
    'Chemie': 'bg-violet-100 text-violet-800',
    'Biologie': 'bg-lime-100 text-lime-800',
    'Geschichte': 'bg-amber-100 text-amber-800',
    'Musik': 'bg-pink-100 text-pink-800',
    'Kunst': 'bg-orange-100 text-orange-800',
    'Ethik': 'bg-teal-100 text-teal-800',
    'Französisch': 'bg-rose-100 text-rose-800',
    'Politik': 'bg-red-100 text-red-800'
  };

  const subjectColor = subjectColors[dbLesson.subject_name] || 'bg-gray-100 text-gray-800';

  // Use the period_number directly from the database view
  // The view should now properly match periods via time when period_id is missing
  const mappedPeriod = dbLesson.period_number;

  // Period mapping successful

  return {
    id: dbLesson.lesson_id,
    period: mappedPeriod,
    day: dayName,
    time: timeString,
    subject: dbLesson.subject_abbreviation || dbLesson.subject_name,
    teacher: dbLesson.teacher_names.join(', ') || '',
    room: dbLesson.room_name || '',
    attendanceStatus,
    isPast,
    isOngoing,
    subjectColor,
    status,
    adminComment: undefined, // Could be added from lesson notes if needed
    classId: dbLesson.class_id || dbLesson.course_id || ''
  };
}

/**
 * Replace the mock getTimetableForClass function with database-driven version
 * @param classId - The class ID
 * @param weekStart - Optional week start date (defaults to current week)
 * @returns Promise<Array of lessons>
 */
export async function getTimetableForClassFromDB(classId: string, weekStart?: Date): Promise<Lesson[]> {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) {
    console.error('❌ No school ID found');
    return [];
  }

  const week = weekStart || getStartOfWeek(new Date());
  return getLessonsForWeek(classId, schoolId, week);
}

/**
 * Get start of week (Monday) for a given date
 * @param date - The date to get the week start for
 * @returns Date representing the start of the week (Monday)
 */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
