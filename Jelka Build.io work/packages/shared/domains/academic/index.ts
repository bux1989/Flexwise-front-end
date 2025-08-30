// Academic domain exports
// This domain contains modules related to academic activities and record-keeping

// Klassenbuch (Digital Class Register) module
export * from './klassenbuch/utils';
// Hooks moved to web-app features
export * from './klassenbuch/data';

// Re-export types for convenience
export type {
  Class,
  Student,
  Lesson,
  StudentStatistics,
  ExcuseInfo
} from './klassenbuch/utils';

export type {
  AbsenceDetail,
  LatenessDetail,
  CourseAttendanceEntry,
  ExcuseEditHistory
} from './klassenbuch/utils';

export type {
  Course,
  CourseStudent,
  AttendanceRecord
} from './klassenbuch/data';

// Future modules would be added here:
// export * from './digitales-klassenbuch/utils';
// export * from './digitales-klassenbuch/hooks';
// export * from './wahlfaecher/utils';
// export * from './wahlfaecher/hooks';
