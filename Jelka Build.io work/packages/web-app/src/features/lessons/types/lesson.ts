export interface Lesson {
  id: number;
  subject: string;
  class: string;
  room: string;
  time: string;
  endTime: string;
  date: Date;
  teacher_id: number;
  isSubstitute?: boolean;
  isCancelled?: boolean;
  isCurrent?: boolean;
  enrolled: number;
  students: LessonStudent[];
  attendance?: LessonAttendance;
  attendanceTaken: boolean;
  lessonNote?: string;
  attendanceTakenBy?: string;
  attendanceTakenAt?: string;
}

export interface LessonStudent {
  id: number;
  name: string;
}

import { LessonAttendance } from '../attendance/types/attendance';
