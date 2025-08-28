// Academic domain exports
// This domain contains modules related to academic activities and record-keeping

// Klassenbuch (Digital Class Register) module
export * from './klassenbuch/utils';
export * from './klassenbuch/hooks';

// Re-export types for convenience
export type {
  Class,
  Student,
  Lesson,
  StudentStatistics,
  ExcuseInfo
} from './klassenbuch/utils';

// Future modules would be added here:
// export * from './digitales-klassenbuch/utils';
// export * from './digitales-klassenbuch/hooks';
// export * from './wahlfaecher/utils';
// export * from './wahlfaecher/hooks';
