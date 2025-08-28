// Attendance utility functions for Fehlzeiten module

export interface AttendanceRecord {
  id: string;
  name: string;
  status: 'present' | 'late' | 'absent_excused' | 'absent_unexcused';
  notes?: string;
  lateMinutes?: number;
  recordedAt?: string;
}

export interface LessonAttendance {
  present: AttendanceRecord[];
  late: AttendanceRecord[];
  absent: AttendanceRecord[];
}

export interface AttendanceBadgeData {
  total_students: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_status: 'none' | 'incomplete' | 'complete';
}

export interface Lesson {
  id: string;
  subject: string;
  class: string;
  room: string;
  time: string;
  endTime: string;
  enrolled: number;
  attendanceTaken: boolean;
  attendance?: LessonAttendance | null;
  attendanceBadge?: AttendanceBadgeData | null;
  preExistingAbsences?: AttendanceRecord[];
}

// Utility functions for attendance functionality
export function getAttendanceStatus(lesson: Lesson): 'none' | 'incomplete' | 'complete' {
  // Use real attendance badge data if available
  if (lesson.attendanceBadge) {
    return lesson.attendanceBadge.attendance_status;
  }
  
  // Fallback to old logic
  if (lesson.attendanceTaken && !lesson.attendance) return 'none';
  if (!lesson.attendance) return 'none';
  
  const { present, late, absent } = lesson.attendance;
  const recordedAttendance = present.length + late.length + absent.length;
  
  if (recordedAttendance === 0) return 'none';
  if (recordedAttendance === lesson.enrolled) return 'complete';
  return 'incomplete';
}

export function getAttendanceNumbers(lesson: Lesson) {
  // Use real attendance badge data if available
  if (lesson.attendanceBadge) {
    const { total_students, present_count, late_count, absent_count } = lesson.attendanceBadge;
    const recordedPresent = present_count + late_count;
    const missing = total_students - recordedPresent - absent_count;
    
    return {
      present: recordedPresent,
      missing: missing,
      absent: absent_count,
      potentialPresent: total_students - absent_count
    };
  }
  
  // Fallback to old logic
  const preExistingAbsentCount = lesson.preExistingAbsences?.length || 0;
  
  if (!lesson.attendance) {
    return {
      potentialPresent: lesson.enrolled - preExistingAbsentCount,
      absent: preExistingAbsentCount,
      present: 0,
      missing: lesson.enrolled - preExistingAbsentCount
    };
  }
  
  const { present, late, absent } = lesson.attendance;
  const recordedPresent = present.length + late.length;
  const recordedAbsent = absent.length;
  const missing = lesson.enrolled - recordedPresent - recordedAbsent;
  
  return {
    present: recordedPresent,
    missing: missing,
    absent: recordedAbsent,
    potentialPresent: lesson.enrolled - recordedAbsent
  };
}

export function getAttendanceSummary(lesson: Lesson) {
  // Use real attendance badge data if available
  if (lesson.attendanceBadge) {
    return {
      present: lesson.attendanceBadge.present_count,
      late: lesson.attendanceBadge.late_count,
      absent: lesson.attendanceBadge.absent_count
    };
  }
  
  // Fallback to old logic
  if (!lesson.attendance) return null;
  const { present, late, absent } = lesson.attendance;
  return {
    present: present.length,
    late: late.length,
    absent: absent.length
  };
}

export function needsAttendanceTracking(lessonTime: string, lessonEndTime: string, selectedDate: Date, isCurrent: boolean = false): boolean {
  // For testing: always show attendance button if we have valid lesson time
  if (!lessonTime || !lessonTime.includes(':')) {
    console.log('❌ No valid lesson time:', lessonTime);
    return false;
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  console.log('📅 Date check:', {
    selectedDate: selectedDate.toDateString(),
    today: new Date().toDateString(),
    isToday
  });

  if (isCurrent) {
    return true;
  }

  // For testing: always show attendance buttons
  return true;

  // Original logic (commented out for testing):
  // const currentTime = new Date();
  // const [startHours, startMinutes] = lessonTime.split(':').map(Number);
  // const lessonStartTime = new Date();
  // lessonStartTime.setHours(startHours, startMinutes, 0, 0);
  // return currentTime >= lessonStartTime;
}
