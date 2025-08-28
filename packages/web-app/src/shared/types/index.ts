// Shared types used across features

// User and Profile types
export interface User {
  id: string;
  email: string;
  // Add other user fields as needed
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: 'teacher' | 'parent' | 'admin' | 'student';
  school_id: string;
  created_at: string;
  updated_at: string;
}

// Lesson types
export interface Lesson {
  id: string;
  subject: string;
  class: string;
  room: string;
  time: string;
  endTime: string;
  isSubstitute: boolean;
  isCancelled: boolean;
  isCurrent: boolean;
  teacherRole: 'main' | 'support';
  otherTeachers?: { name: string; isMainResponsible?: boolean }[];
  enrolled: number;
  students: { id: number; name: string }[];
  attendanceTaken: boolean;
  lessonNote: string;
  attendance?: LessonAttendance | null;
  attendanceBadge?: AttendanceBadgeData | null;
}

// Attendance types
export interface LessonAttendance {
  present: AttendanceRecord[];
  late: AttendanceRecord[];
  absent: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: string;
  name: string;
  status: 'present' | 'late' | 'absent_excused' | 'absent_unexcused';
  notes?: string;
  lateMinutes?: number;
  recordedAt?: string;
}

export interface AttendanceBadgeData {
  total_students: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_status: 'none' | 'incomplete' | 'complete';
}

// Task types
export interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  completed: boolean;
  hotList: boolean;
  assignedTo: string[];
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  completionComment?: string;
  comments: TaskComment[];
}

export interface TaskComment {
  id: number;
  author: string;
  content: string;
  timestamp: string;
}

// Event types
export interface Event {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  type: 'meeting' | 'deadline' | 'event' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  participants: string[];
  location?: string;
  isPast: boolean;
  isToday: boolean;
}

// Common props for dashboard components
export interface DashboardProps {
  user?: User;
  profile?: UserProfile;
}

// Feature access types
export interface FeatureAccess {
  canViewAttendance: boolean;
  canEditAttendance: boolean;
  canViewTasks: boolean;
  canCreateTasks: boolean;
  canViewSchedule: boolean;
  canEditSchedule: boolean;
  canViewMessages: boolean;
  canSendMessages: boolean;
}
