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

// Mock data for database-driven features (replace with real API calls)
const mockSchedulePeriods: SchedulePeriod[] = [
  { id: '1', school_id: 'school-1', block_number: 1, start_time: '08:00:00', end_time: '08:45:00', label: '1. Stunde', group_label: 'Vormittag', attendance_requirement: 'required', block_type: 'instructional' },
  { id: '2', school_id: 'school-1', block_number: 2, start_time: '08:50:00', end_time: '09:35:00', label: '2. Stunde', group_label: 'Vormittag', attendance_requirement: 'required', block_type: 'instructional' },
  { id: '3', school_id: 'school-1', block_number: 3, start_time: '09:55:00', end_time: '10:40:00', label: '3. Stunde', group_label: 'Vormittag', attendance_requirement: 'required', block_type: 'instructional' },
  { id: '4', school_id: 'school-1', block_number: 4, start_time: '10:45:00', end_time: '11:30:00', label: '4. Stunde', group_label: 'Vormittag', attendance_requirement: 'required', block_type: 'instructional' },
  { id: '5', school_id: 'school-1', block_number: 5, start_time: '11:50:00', end_time: '12:35:00', label: '5. Stunde', group_label: 'Nachmittag', attendance_requirement: 'required', block_type: 'instructional' },
  { id: '6', school_id: 'school-1', block_number: 6, start_time: '12:40:00', end_time: '13:25:00', label: '6. Stunde', group_label: 'Nachmittag', attendance_requirement: 'required', block_type: 'instructional' },
  { id: '7', school_id: 'school-1', block_number: 7, start_time: '13:45:00', end_time: '14:30:00', label: '7. Stunde', group_label: 'Nachmittag', attendance_requirement: 'flexible', block_type: 'flex' },
  { id: '8', school_id: 'school-1', block_number: 8, start_time: '14:35:00', end_time: '15:20:00', label: '8. Stunde', group_label: 'Nachmittag', attendance_requirement: 'flexible', block_type: 'flex' },
  { id: '9', school_id: 'school-1', block_number: 9, start_time: '15:25:00', end_time: '16:10:00', label: '9. Stunde', group_label: 'Nachmittag', attendance_requirement: 'flexible', block_type: 'flex' },
  { id: '10', school_id: 'school-1', block_number: 10, start_time: '16:15:00', end_time: '17:00:00', label: '10. Stunde', group_label: 'Nachmittag', attendance_requirement: 'flexible', block_type: 'flex' },
];

const mockStructureDays: StructureDay[] = [
  { id: 1, name_en: 'Monday', name_de: 'Montag', day_number: 1, order_index: 1 },
  { id: 2, name_en: 'Tuesday', name_de: 'Dienstag', day_number: 2, order_index: 2 },
  { id: 3, name_en: 'Wednesday', name_de: 'Mittwoch', day_number: 3, order_index: 3 },
  { id: 4, name_en: 'Thursday', name_de: 'Donnerstag', day_number: 4, order_index: 4 },
  { id: 5, name_en: 'Friday', name_de: 'Freitag', day_number: 5, order_index: 5 },
  { id: 6, name_en: 'Saturday', name_de: 'Samstag', day_number: 6, order_index: 6 },
];

// Mock school configuration - some schools operate Monday-Friday, others include Saturday
const mockSchoolDays: SchoolDay[] = [
  // Standard school (Monday-Friday)
  { school_id: 'school-1', day_id: 1, day: mockStructureDays[0] }, // Monday
  { school_id: 'school-1', day_id: 2, day: mockStructureDays[1] }, // Tuesday
  { school_id: 'school-1', day_id: 3, day: mockStructureDays[2] }, // Wednesday
  { school_id: 'school-1', day_id: 4, day: mockStructureDays[3] }, // Thursday
  { school_id: 'school-1', day_id: 5, day: mockStructureDays[4] }, // Friday

  // Example school with Saturday (uncomment to test)
  // { school_id: 'school-2', day_id: 1, day: mockStructureDays[0] }, // Monday
  // { school_id: 'school-2', day_id: 2, day: mockStructureDays[1] }, // Tuesday
  // { school_id: 'school-2', day_id: 3, day: mockStructureDays[2] }, // Wednesday
  // { school_id: 'school-2', day_id: 4, day: mockStructureDays[3] }, // Thursday
  // { school_id: 'school-2', day_id: 5, day: mockStructureDays[4] }, // Friday
  // { school_id: 'school-2', day_id: 6, day: mockStructureDays[5] }, // Saturday
];

/**
 * Get schedule periods for a school filtered by block_type
 * @param schoolId - The school ID
 * @param blockTypes - Array of block types to filter by (default: ['instructional', 'flex'])
 * @returns Array of schedule periods
 */
export function getSchedulePeriods(schoolId: string = 'school-1', blockTypes: string[] = ['instructional', 'flex']): SchedulePeriod[] {
  // TODO: Replace with actual API call to:
  // SELECT * FROM schedule_periods
  // WHERE school_id = $1 AND block_type = ANY($2)
  // ORDER BY block_number ASC

  return mockSchedulePeriods
    .filter(period => period.school_id === schoolId && blockTypes.includes(period.block_type))
    .sort((a, b) => a.block_number - b.block_number);
}

/**
 * Get operating days for a school
 * @param schoolId - The school ID
 * @returns Array of school days with day information
 */
export function getSchoolDays(schoolId: string = 'school-1'): SchoolDay[] {
  // TODO: Replace with actual API call to:
  // SELECT ssd.school_id, ssd.day_id, sd.*
  // FROM structure_school_days ssd
  // JOIN structure_days sd ON ssd.day_id = sd.id
  // WHERE ssd.school_id = $1
  // ORDER BY sd.order_index ASC

  return mockSchoolDays
    .filter(schoolDay => schoolDay.school_id === schoolId)
    .sort((a, b) => a.day.order_index - b.day.order_index);
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
