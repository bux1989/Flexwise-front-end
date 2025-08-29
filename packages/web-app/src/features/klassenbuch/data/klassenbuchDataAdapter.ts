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
  getTimetableForClass,
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
      throw error;
    }

    console.log('✅ School days fetched:', schoolDays?.length || 0, 'days');

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
