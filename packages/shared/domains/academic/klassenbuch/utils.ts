// Klassenbuch utility functions for Academic domain

export interface Class {
  id: string;
  name: string;
  subject: string;
  grade: string;
  type?: 'class' | 'course' | 'teacher';
}

export interface Student {
  id: string;
  name: string;
  classId: string;
}

export interface Lesson {
  id: string;
  period: number;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  attendanceStatus: 'complete' | 'missing' | 'incomplete' | 'future';
  isPast: boolean;
  isOngoing: boolean;
  subjectColor: string;
  status?: 'normal' | 'cancelled' | 'room_changed' | 'teacher_changed';
  originalTeacher?: string;
  originalRoom?: string;
  adminComment?: string;
  classId: string;
}

export interface ExcuseInfo {
  text: string;
  createdBy: string;
  createdAt: string;
  editHistory: ExcuseEditHistory[];
}

export interface ExcuseEditHistory {
  editorId: string;
  editorName: string;
  timestamp: string;
  previousText?: string;
}

export interface AbsenceDetail {
  id: string;
  date: string;
  subject: string;
  type: 'excused' | 'unexcused';
  absenceType: 'fehltag' | 'fehlstunde'; // distinguish between whole day and individual lesson
  reason?: string;
  minutes: number;
  excuseInfo?: ExcuseInfo;
}

export interface LatenessDetail {
  id: string;
  date: string;
  subject: string;
  type: 'excused' | 'unexcused';
  minutes: number;
  reason?: string;
  excuseInfo?: ExcuseInfo;
}

export interface CourseAttendanceEntry {
  code: 'A' | 'S' | 'E' | 'U';
  excuseInfo?: ExcuseInfo; // For 'E' (always) and 'S' (when excused)
}

export interface StudentStatistics {
  id: string;
  name: string;
  totalFehltage: number;
  excusedFehltage: number;
  unexcusedFehltage: number;
  totalFehlstunden: number;
  excusedFehlstunden: number;
  unexcusedFehlstunden: number;
  totalMinutes: number;
  excusedLatenessMinutes: number;
  unexcusedLatenessMinutes: number;
  attendanceRate: number;
  classId: string;
  absenceDetails: AbsenceDetail[];
  latenessDetails: LatenessDetail[];
}

// Utility functions for week navigation
export function formatWeekRange(date: Date, isMobile: boolean = false): string {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 4);
  
  const formatDate = (d: Date) => d.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: '2-digit',
    year: isMobile ? undefined : 'numeric'
  });
  
  return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
}

export function getNextWeek(currentWeek: Date): Date {
  const newWeek = new Date(currentWeek);
  newWeek.setDate(newWeek.getDate() + 7);
  return newWeek;
}

export function getPreviousWeek(currentWeek: Date): Date {
  const newWeek = new Date(currentWeek);
  newWeek.setDate(newWeek.getDate() - 7);
  return newWeek;
}

export function getCurrentWeek(): Date {
  return new Date();
}

// Utility functions for class and course filtering
export function getFilteredClassesForView(
  allClasses: Class[], 
  currentView: 'live' | 'statistics',
  statisticsViewType: 'class' | 'student' | 'course' = 'class'
): Class[] {
  if (currentView === 'live') {
    return allClasses;
  } else {
    if (statisticsViewType === 'class') {
      return allClasses.filter(c => c.type === 'class');
    } else if (statisticsViewType === 'course') {
      return allClasses.filter(c => c.type === 'course');
    } else {
      // For student view, don't show class selection
      return [];
    }
  }
}

// Lesson status utilities
export function getLessonStatusIcon(lesson: Lesson): 'complete' | 'missing' | 'incomplete' | 'future' | null {
  if (lesson.attendanceStatus === 'future') {
    return null;
  }
  return lesson.attendanceStatus;
}

export function getLessonChangeIcon(lesson: Lesson): 'cancelled' | 'changed' | null {
  switch (lesson.status) {
    case 'cancelled':
      return 'cancelled';
    case 'room_changed':
    case 'teacher_changed':
      return 'changed';
    default:
      return null;
  }
}

export function hasLessonComment(lesson: Lesson): boolean {
  return !!lesson.adminComment;
}

// Timetable utilities
export function hasLessonsInPeriod(lessons: Lesson[], period: number): boolean {
  const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
  return weekDays.some(day => {
    const lesson = lessons.find(l => l.period === period && l.day === day);
    return lesson !== undefined;
  });
}

export function getLessonForPeriodAndDay(lessons: Lesson[], period: number, day: string): Lesson | undefined {
  return lessons.find(l => l.period === period && l.day === day);
}

// Student name formatting for mobile
export function formatStudentNameForMobile(fullName: string): string {
  // Remove class info in parentheses if present
  const nameWithoutClass = fullName.replace(/\s*\([^)]*\)$/, '').trim();
  
  const nameParts = nameWithoutClass.split(' ');
  if (nameParts.length < 2) return fullName;

  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  const lastNameShort = lastName.length >= 2 ? lastName.substring(0, 2) : lastName;

  return `${firstName} ${lastNameShort}`;
}

// Statistics utilities
export function calculateAttendanceRate(
  totalLessons: number,
  fehltage: number,
  fehlstunden: number,
  avgLessonsPerDay: number = 8
): number {
  const totalMissedLessons = (fehltage * avgLessonsPerDay) + fehlstunden;
  if (totalLessons === 0) return 100;
  
  const attendanceRate = Math.max(70, Math.floor(((totalLessons - totalMissedLessons) / totalLessons) * 100));
  return attendanceRate;
}

export function getSubjectBreakdown(absenceDetails: any[]): Record<string, number> {
  const subjectCounts: Record<string, number> = {};

  // Only count individual lessons (fehlstunde), not whole days (fehltag)
  absenceDetails
    .filter(detail => detail.absenceType === 'fehlstunde')
    .forEach(detail => {
      subjectCounts[detail.subject] = (subjectCounts[detail.subject] || 0) + 1;
    });

  // Remove subjects with 0 absences and sort by count
  const filteredCounts = Object.entries(subjectCounts)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return Object.fromEntries(filteredCounts);
}

// Time slot definitions
export const TIME_SLOTS = [
  { period: 1, time: '08:00-08:45' },
  { period: 2, time: '08:50-09:35' },
  { period: 3, time: '09:55-10:40' },
  { period: 4, time: '10:45-11:30' },
  { period: 5, time: '11:50-12:35' },
  { period: 6, time: '12:40-13:25' },
  { period: 7, time: '13:45-14:30' },
  { period: 8, time: '14:35-15:20' },
];

// Date constants
export const getCurrentDateString = () => new Date().toLocaleDateString('de-DE');
