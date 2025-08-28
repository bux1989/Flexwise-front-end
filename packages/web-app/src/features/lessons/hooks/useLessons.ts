import { useState, useEffect, useCallback } from 'react';
import { fetchTodaysLessons, fetchAttendanceBadges } from '../../../lib/supabase';
import { useSchoolRealtime } from '../../../hooks/useSchoolRealtime';
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
  realtime: {
    isConnected: boolean;
    channelCount: number;
    refresh: () => void;
  };
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

    // Create mock attendance arrays with correct lengths for helper functions
    const presentCount = badge.present_count || 0;
    const lateCount = badge.late_count || 0;
    const absentCount = badge.absent_count || 0;
    const totalStudents = badge.total_students || lesson.student_count || 0;

    // Create arrays with correct lengths (mock data for counts)
    const presentArray = Array(presentCount).fill(null).map((_, i) => ({ id: `present_${i}`, name: `Student ${i + 1}` }));
    const lateArray = Array(lateCount).fill(null).map((_, i) => ({ id: `late_${i}`, name: `Student ${i + 1}` }));
    const absentArray = Array(absentCount).fill(null).map((_, i) => ({ id: `absent_${i}`, name: `Student ${i + 1}` }));

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
      enrolled: totalStudents, // For helper functions
      attendance: {
        present: presentArray,
        late: lateArray,
        absent: absentArray
      },
      attendanceTaken: lesson.attendance_taken || false
    };
  });
}

export function useLessons(teacherId: string | null, selectedDate: Date): UseLessonsResult {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

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

      // Extract school ID for real-time subscriptions
      if (supabaseLessons.length > 0 && !schoolId) {
        const lessonSchoolId = supabaseLessons[0].school_id;
        setSchoolId(lessonSchoolId);
        console.log('🏫 School ID detected for real-time:', lessonSchoolId);
      }

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

  // Handle real-time updates
  const handleRealtimeUpdates = useCallback(async (groupedUpdates: any) => {
    console.log('📡 Processing real-time updates for lessons:', groupedUpdates);

    // Check if any updates affect our lessons
    const relevantUpdates = ['attendance', 'lesson', 'daily_log', 'diary', 'substitution'];
    const hasRelevantUpdates = relevantUpdates.some(type => groupedUpdates[type]);

    if (hasRelevantUpdates) {
      console.log('🔄 Relevant updates detected, refreshing lesson data...');

      // For attendance updates, try to update just the affected lessons
      if (groupedUpdates.attendance) {
        try {
          // Refresh attendance badges for current lessons
          const currentLessonIds = lessons.map(l => l.id);
          if (currentLessonIds.length > 0) {
            const updatedBadges = await fetchAttendanceBadges(currentLessonIds);

            setLessons(prevLessons =>
              prevLessons.map(lesson => {
                const badge = updatedBadges[lesson.id];
                if (badge) {
                  return {
                    ...lesson,
                    attendance: {
                      present: Array(badge.present_count || 0).fill(null).map((_, i) => ({ id: `present_${i}`, name: `Student ${i + 1}` })),
                      late: Array(badge.late_count || 0).fill(null).map((_, i) => ({ id: `late_${i}`, name: `Student ${i + 1}` })),
                      absent: Array(badge.absent_count || 0).fill(null).map((_, i) => ({ id: `absent_${i}`, name: `Student ${i + 1}` }))
                    },
                    enrolled: badge.total_students || lesson.enrolled
                  };
                }
                return lesson;
              })
            );

            console.log('✅ Attendance badges updated via real-time');
            return;
          }
        } catch (error) {
          console.error('❌ Error updating attendance badges:', error);
        }
      }

      // For other updates, do a full refresh
      await fetchLessons();
    }
  }, [lessons, schoolId]);

  // Get lesson IDs for real-time subscriptions
  const teacherLessonIds = lessons.map(lesson => lesson.id);

  // Set up real-time subscriptions
  const realtimeStatus = useSchoolRealtime({
    schoolId,
    teacherLessonIds,
    onUpdate: handleRealtimeUpdates,
    enabled: !!schoolId && !!teacherId
  });

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
