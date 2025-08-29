// Generated types from Supabase
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > packages/shared/supabase-types.ts
//
// NOTE: For comprehensive database types with better documentation and helper types,
// see: ../../types/database.ts

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      course_lessons: {
        Row: {
          id: string
          subject_id: string | null
          class_id: string | null
          room_id: string | null
          start_datetime: string
          end_datetime: string
          primary_teacher_id: string | null
          teacher_ids: string[] | null
          is_cancelled: boolean
          is_archived: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id?: string | null
          class_id?: string | null
          room_id?: string | null
          start_datetime: string
          end_datetime: string
          primary_teacher_id?: string | null
          teacher_ids?: string[] | null
          is_cancelled?: boolean
          is_archived?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subject_id?: string | null
          class_id?: string | null
          room_id?: string | null
          start_datetime?: string
          end_datetime?: string
          primary_teacher_id?: string | null
          teacher_ids?: string[] | null
          is_cancelled?: boolean
          is_archived?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_attendance_logs: {
        Row: {
          id: string
          lesson_id: string
          student_id: string
          status: 'present' | 'late' | 'absent_excused' | 'absent_unexcused'
          recorded_at: string
          notes: string | null
          late_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          student_id: string
          status: 'present' | 'late' | 'absent_excused' | 'absent_unexcused'
          recorded_at?: string
          notes?: string | null
          late_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          student_id?: string
          status?: 'present' | 'late' | 'absent_excused' | 'absent_unexcused'
          recorded_at?: string
          notes?: string | null
          late_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      vw_react_lesson_details: {
        Row: {
          lesson_id: string
          subject_name: string | null
          class_name: string | null
          room_name: string | null
          start_datetime: string
          end_datetime: string
          lesson_type: string
          is_substitute: boolean
          is_cancelled: boolean
          substitute_staff_id: string | null
          cancellation_reason: string | null
          assigned_teacher_id: string | null
          teacher_names: string[] | null
          student_count: number
          student_names_with_class: string[] | null
          lesson_date: string
          period_number: number | null
          notes: string | null
          attendance_taken: boolean
          course_id: string | null
          subject_id: string | null
          class_id: string | null
          room_id: string | null
          school_id: string | null
          subject_color: string | null
          subject_abbreviation: string | null
          class_year: string | null
          grade_level: string | null
          room_number: string | null
          building: string | null
          period_start_time: string | null
          period_end_time: string | null
          period_label: string | null
        }
      }
      vw_lesson_attendance_badges: {
        Row: {
          lesson_id: string
          total_students: number
          present_count: number
          late_count: number
          absent_count: number
          attendance_status: 'none' | 'incomplete' | 'complete'
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attendance_status: 'present' | 'late' | 'absent_excused' | 'absent_unexcused'
    }
  }
}
