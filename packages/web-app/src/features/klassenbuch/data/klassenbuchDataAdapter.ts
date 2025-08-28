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
