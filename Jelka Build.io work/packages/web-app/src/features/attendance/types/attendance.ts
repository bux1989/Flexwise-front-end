export interface AttendanceRecord {
  lesson_id: number;
  student_id: number;
  status: 'present' | 'late' | 'excused' | 'unexcused';
  minutes_late?: number;
  arrival_time?: string;
  excuse_reason?: string;
  recorded_by: string;
  recorded_at: string;
}

export interface LessonAttendance {
  present: AttendanceStudent[];
  late: LateStudent[];
  absent: AbsentStudent[];
}

export interface AttendanceStudent {
  id: number;
  name: string;
}

export interface LateStudent extends AttendanceStudent {
  minutesLate: number;
  arrivalTime?: string;
  lateExcused?: boolean;
}

export interface AbsentStudent extends AttendanceStudent {
  excused: boolean;
  reason?: string;
  excusedBy?: string;
  excusedAt?: string;
}
