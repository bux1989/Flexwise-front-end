// Feature-Driven Architecture
// This index exports all features used across different dashboard types

// Task Management (Teacher Dashboard, Admin Dashboard)
export * from './task-management';

// User Management (Admin Dashboard, Teacher Dashboard)
export * from './user-management';

// Attendance Management (Teacher Dashboard, Parent Dashboard, Admin Dashboard)
export * from './attendance';

// Lesson Management (Teacher Dashboard, Admin Dashboard)
export * from './lessons';

// Communications (All Dashboard types)
export * from './communications';

// Reports & Analytics (Admin Dashboard, External Dashboard, Teacher Dashboard)
export * from './reports';

// Dashboard-specific feature mappings
export const DASHBOARD_FEATURES = {
  admin: [
    'user-management',
    'attendance', 
    'lessons',
    'communications',
    'reports',
    'task-management'
  ],
  teacher: [
    'task-management',
    'lessons',
    'attendance',
    'communications',
    'user-management' // limited scope
  ],
  parent: [
    'attendance', // read-only
    'communications'
  ],
  external: [
    'reports', // limited access
    'communications' // limited access
  ]
} as const;

export type DashboardType = keyof typeof DASHBOARD_FEATURES;
