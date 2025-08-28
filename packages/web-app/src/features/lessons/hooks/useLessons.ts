import { useState, useEffect } from 'react';
import { fetchTodaysLessons, fetchAttendanceBadges } from '../../../lib/supabase';
import dayjs from 'dayjs';

interface LessonData {
  id: string;
  time: string;
  endTime: string;
  subject: string;
  class: string;
  room: string | null;
  location: string | null;
  isCurrent: boolean;
  isSubstitute: boolean;
  isCancelled: boolean;
  otherTeachers: any[];
  adminComment: string | null;
  students: any[];
  enrolled: number; // Total student count for helpers
  attendance: {
    present: any[];
    late: any[];
    absent: any[];
  };
  attendanceTaken: boolean;
}

interface UseLessonsResult {
  lessons: LessonData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Transform Supabase lesson data to component format
function transformLessonData(supabaseLessons: any[], attendanceBadges: any = {}): LessonData[] {
  const now = dayjs();

  return supabaseLessons.map(lesson => {
    const startTime = dayjs(lesson.start_datetime);
    const endTime = dayjs(lesson.end_datetime);
    const badge = attendanceBadges[lesson.lesson_id] || {};

    // Determine if lesson is current (within the lesson time window)
    const isCurrent = now.isAfter(startTime) && now.isBefore(endTime);

    // Transform teacher names array to expected format
    const otherTeachers = (lesson.teacher_names || []).map((name: string, index: number) => ({
      id: `teacher_${index}`,
      name: name
    }));

    // Transform student names array to expected format
    const students = (lesson.student_names_with_class || []).map((nameWithClass: string, index: number) => ({
      id: `student_${index}`,
      name: nameWithClass
    }));

    return {
      id: lesson.lesson_id,
      time: startTime.format('HH:mm'),
      endTime: endTime.format('HH:mm'),
      subject: lesson.subject_name || 'Unbekanntes Fach',
      class: lesson.class_name || 'Unbekannte Klasse',
      room: lesson.room_name,
      location: lesson.room_name, // Use room as location
      isCurrent,
      isSubstitute: lesson.is_substitute || false,
      isCancelled: lesson.is_cancelled || false,
      otherTeachers,
      adminComment: lesson.notes,
      students,
      attendance: {
        present: [], // Arrays not provided by badge view, would need separate fetch
        late: [],
        absent: [],
        // Add badge counts for display
        presentCount: badge.present_count || 0,
        lateCount: badge.late_count || 0,
        absentCount: badge.absent_count || 0,
        totalStudents: badge.total_students || 0,
        status: badge.attendance_status || 'none'
      },
      attendanceTaken: lesson.attendance_taken || false
    };
  });
}

export function useLessons(teacherId: string | null, selectedDate: Date): UseLessonsResult {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = async () => {
    if (!teacherId) {
      setLessons([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📚 Fetching lessons for teacher:', teacherId, 'date:', selectedDate);
      
      // Fetch lessons for the selected date
      const supabaseLessons = await fetchTodaysLessons(teacherId, selectedDate);
      
      // Fetch attendance badges for all lessons
      const lessonIds = supabaseLessons.map(lesson => lesson.lesson_id);
      const attendanceBadges = lessonIds.length > 0 ? await fetchAttendanceBadges(lessonIds) : {};
      
      // Transform data to match component expectations
      const transformedLessons = transformLessonData(supabaseLessons, attendanceBadges);
      
      console.log('✅ Lessons loaded:', transformedLessons.length, 'lessons');
      setLessons(transformedLessons);
      
    } catch (err) {
      console.error('❌ Error fetching lessons:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lessons when teacher ID or date changes
  useEffect(() => {
    fetchLessons();
  }, [teacherId, selectedDate]);

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons
  };
}

// Hook for fetching teacher's profile ID from user profile
export function useTeacherProfile() {
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeacherProfile = async () => {
      try {
        // Import here to avoid circular dependency
        const { getCurrentUserProfile } = await import('../../../lib/supabase');
        
        const profile = await getCurrentUserProfile();
        if (profile?.id) {
          setTeacherId(profile.id);
          console.log('👨‍🏫 Teacher profile loaded:', profile.id);
        } else {
          throw new Error('No teacher profile found');
        }
      } catch (err) {
        console.error('❌ Error loading teacher profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load teacher profile');
      } finally {
        setLoading(false);
      }
    };

    loadTeacherProfile();
  }, []);

  return { teacherId, loading, error };
}
