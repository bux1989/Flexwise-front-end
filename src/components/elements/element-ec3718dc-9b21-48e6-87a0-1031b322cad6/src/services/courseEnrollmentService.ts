import { supabase, type Student, type Course, type DayOfWeek, type EnrollmentContext, type CourseNote } from '../lib/supabase'

export class CourseEnrollmentService {

  // Default context - will be dynamically detected from the data
  private static defaultContext: EnrollmentContext = {
    school_id: '1df8108c-692a-48f2-8e22-98dbb6f4fdf4', // Your school ID
    registration_period_id: '', // Will be detected from first student/course record
    semester_id: '' // Will be detected from first student/course record
  }

  // Helper to detect context from actual data
  private static async detectContext(): Promise<Partial<EnrollmentContext>> {
    try {
      // Try to get context from a student record
      const { data: studentData } = await supabase
        .from('w_registration_period_students_by_day')
        .select('school_id, registration_period_id, semester_id')
        .eq('school_id', this.defaultContext.school_id)
        .limit(1)

      if (studentData && studentData.length > 0) {
        const context = studentData[0]
        console.log('Detected context from students:', context)
        return {
          school_id: context.school_id,
          registration_period_id: context.registration_period_id,
          semester_id: context.semester_id
        }
      }

      // Fallback: try from courses
      const { data: courseData } = await supabase
        .from('w_registration_period_courses_by_day')
        .select('school_id, registration_period_id, semester_id')
        .eq('school_id', this.defaultContext.school_id)
        .limit(1)

      if (courseData && courseData.length > 0) {
        const context = courseData[0]
        console.log('Detected context from courses:', context)
        return {
          school_id: context.school_id,
          registration_period_id: context.registration_period_id,
          semester_id: context.semester_id
        }
      }

      console.warn('Could not detect context from database')
      return {}
    } catch (error) {
      console.error('Error detecting context:', error)
      return {}
    }
  }

  // Get all students for a specific day using the actual view
  static async getStudentsForDay(
    dayOfWeek: number,
    context: Partial<EnrollmentContext> = {}
  ): Promise<Student[]> {
    // Detect context if not provided
    const detectedContext = await this.detectContext()
    const ctx = { ...this.defaultContext, ...detectedContext, ...context }

    console.log('Getting students with context:', ctx)

    let query = supabase
      .from('w_registration_period_students_by_day')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('school_id', ctx.school_id)

    // Add context filters if available
    if (ctx.registration_period_id) {
      query = query.eq('registration_period_id', ctx.registration_period_id)
    }
    if (ctx.semester_id) {
      query = query.eq('semester_id', ctx.semester_id)
    }

    const { data, error } = await query
      .order('class', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching students:', error)
      return []
    }

    console.log(`Found ${data?.length || 0} students for day ${dayOfWeek}`)
    return data || []
  }

  // Get all courses for a specific day using the actual view
  static async getCoursesForDay(
    dayOfWeek: number,
    context: Partial<EnrollmentContext> = {}
  ): Promise<Course[]> {
    // Detect context if not provided
    const detectedContext = await this.detectContext()
    const ctx = { ...this.defaultContext, ...detectedContext, ...context }

    console.log('Getting courses with context:', ctx)

    let query = supabase
      .from('w_registration_period_courses_by_day')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('school_id', ctx.school_id)

    // Add context filters if available
    if (ctx.registration_period_id) {
      query = query.eq('registration_period_id', ctx.registration_period_id)
    }
    if (ctx.semester_id) {
      query = query.eq('semester_id', ctx.semester_id)
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) {
      console.error('Error fetching courses:', error)
      return []
    }

    console.log(`Found ${data?.length || 0} courses for day ${dayOfWeek}`)
    return data || []
  }

  // Get all days of week using the actual view
  static async getDaysOfWeek(context: Partial<EnrollmentContext> = {}): Promise<DayOfWeek[]> {
    const detectedContext = await this.detectContext()
    const ctx = { ...this.defaultContext, ...detectedContext, ...context }

    const { data, error } = await supabase
      .from('vw_school_days')
      .select('*')
      .eq('school_id', ctx.school_id)
      .order('day_number', { ascending: true })

    if (error) {
      console.error('Error fetching days of week:', error)
      return []
    }

    console.log(`Found ${data?.length || 0} days of week`)
    return data || []
  }

  // Move student using the stored function
  static async moveStudent(
    studentId: string,
    targetId: string | null, // This can be 'waiting', 'go-home', course_id, or window_id
    dayOfWeek: number,
    context: Partial<EnrollmentContext> = {}
  ): Promise<boolean> {
    // Detect context if not provided
    const detectedContext = await this.detectContext()
    const ctx = { ...this.defaultContext, ...detectedContext, ...context }

    console.log('Moving student with context:', ctx)
    console.log('Student ID:', studentId)
    console.log('Target ID:', targetId)
    console.log('Day of week:', dayOfWeek)

    try {
      // Determine the target parameter
      let target: string;
      if (targetId === null || targetId === 'waiting') {
        target = 'waiting';
      } else if (targetId === 'go-home') {
        target = 'go-home';
      } else {
        target = targetId; // Can be course_id or window_id, the function will resolve it
      }

      console.log('Resolved target:', target)

      // Validate we have required context
      if (!ctx.registration_period_id || !ctx.semester_id) {
        console.error('Missing required context:', ctx)
        return false
      }

      // Validate required parameters
      if (!studentId || typeof studentId !== 'string') {
        console.error('Invalid student ID:', studentId)
        return false
      }

      if (!target || typeof target !== 'string') {
        console.error('Invalid target:', target)
        return false
      }

      const rpcParams = {
        p_registration_period_id: ctx.registration_period_id,
        p_semester_id: ctx.semester_id,
        p_school_id: ctx.school_id,
        p_day_of_week: dayOfWeek,
        p_student_id: studentId,
        p_target: target,
        p_updated_by: '1886b0c0-428e-483b-b9b9-fd678e42dcf0' // Set specific user ID for authentication
      };

      console.log('🔄 Calling app_move_student_in_draft with params:', rpcParams);

      // Call the stored function
      const { data, error } = await supabase.rpc('app_move_student_in_draft', rpcParams);

      if (error) {
        console.error('Supabase RPC error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        return false;
      }

      console.log('Function response:', data);

      // Check the function response
      if (data && !data.ok) {
        console.error('Function returned error:', data.error);
        return false;
      }

      console.log('✅ Student moved successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error in moveStudent:', {
        message: error?.message || 'Unknown error',
        studentId,
        targetId,
        dayOfWeek,
        context: ctx,
        fullError: error
      });
      return false;
    }
  }

  // Toggle course lock status (this might need to be handled differently in your system)
  static async toggleCourseLock(
    courseId: string,
    isLocked: boolean,
    context: Partial<EnrollmentContext> = {}
  ): Promise<boolean> {
    try {
      // Note: Course locking might be handled through registration windows
      // This is a placeholder - you may need to adjust based on your business logic
      console.log('Course lock toggle requested:', { courseId, isLocked })

      // For now, we'll just log this since the locking logic might be complex
      // In your real system, this might involve updating registration windows

      return true
    } catch (error) {
      console.error('Error toggling course lock:', error)
      return false
    }
  }

  // Update search query (this would typically be handled client-side)
  static filterStudentsBySearch(students: Student[], searchQuery: string): Student[] {
    if (!searchQuery) return students

    const query = searchQuery.toLowerCase()
    return students.filter(student => 
      (student.name || '').toLowerCase().includes(query) || 
      (student.class || '').toLowerCase().includes(query)
    )
  }

  // Get enrollment statistics
  static async getEnrollmentStats(
    dayOfWeek: number,
    context: Partial<EnrollmentContext> = {}
  ) {
    const [students, courses] = await Promise.all([
      this.getStudentsForDay(dayOfWeek, context),
      this.getCoursesForDay(dayOfWeek, context)
    ])

    const enrollmentCounts: Record<string, number> = {}
    students.forEach(student => {
      if (student.current_enrollment) {
        enrollmentCounts[student.current_enrollment] = (enrollmentCounts[student.current_enrollment] || 0) + 1
      }
    })

    return {
      students,
      courses,
      enrollmentCounts,
      totalEnrolled: students.filter(s => s.current_enrollment).length,
      waitingList: students.filter(s => !s.current_enrollment),
      goingHome: students.filter(s => s.first_choice === 'go-home' || !s.current_enrollment)
    }
  }

  // Real-time subscription for live updates (updated for views)
  static subscribeToEnrollmentChanges(
    dayOfWeek: number,
    callback: () => void,
    context: Partial<EnrollmentContext> = {}
  ) {
    const ctx = { ...this.defaultContext, ...context }

    // Subscribe to course allocation drafts changes
    const draftsChannel = supabase
      .channel('drafts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_allocation_drafts',
          filter: `school_id=eq.${ctx.school_id}`
        },
        callback
      )
      .subscribe()

    // Subscribe to course enrollments changes
    const enrollmentsChannel = supabase
      .channel('enrollments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_enrollments'
        },
        callback
      )
      .subscribe()

    return () => {
      supabase.removeChannel(draftsChannel)
      supabase.removeChannel(enrollmentsChannel)
    }
  }

  // Set enrollment context (useful for switching between different periods/semesters)
  static setDefaultContext(context: Partial<EnrollmentContext>) {
    this.defaultContext = { ...this.defaultContext, ...context }
  }

  // Get available registration periods
  static async getRegistrationPeriods(schoolId: string) {
    const { data, error } = await supabase
      .from('course_registration_periods')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching registration periods:', error)
      return []
    }

    return data || []
  }

  // Get available semesters
  static async getSemesters(schoolId: string) {
    const { data, error } = await supabase
      .from('structure_school_semesters')
      .select('*')
      .eq('school_id', schoolId)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching semesters:', error)
      return []
    }

    return data || []
  }

  // Course Notes Management

  // Get all notes for courses on a specific day
  static async getCourseNotesForDay(
    dayOfWeek: number,
    context: Partial<EnrollmentContext> = {}
  ): Promise<CourseNote[]> {
    const detectedContext = await this.detectContext()
    const ctx = { ...this.defaultContext, ...detectedContext, ...context }

    console.log('Getting course notes for day:', dayOfWeek, 'with context:', ctx)

    if (!ctx.registration_period_id || !ctx.semester_id) {
      console.error('Missing required context for notes:', ctx)
      return []
    }

    const { data, error } = await supabase
      .from('course_notes')
      .select('*')
      .eq('school_id', ctx.school_id)
      .eq('registration_period_id', ctx.registration_period_id)
      .eq('semester_id', ctx.semester_id)
      .eq('day_of_week', dayOfWeek)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching course notes details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      })
      return []
    }

    console.log(`Found ${data?.length || 0} notes for day ${dayOfWeek}`)
    return data || []
  }

  // Get unresolved problems for a day (simplified without stored function)
  static async getUnresolvedProblems(
    dayOfWeek: number,
    context: Partial<EnrollmentContext> = {}
  ): Promise<Array<CourseNote & { course_name: string }>> {
    const detectedContext = await this.detectContext()
    const ctx = { ...this.defaultContext, ...detectedContext, ...context }

    console.log('Getting unresolved problems for day:', dayOfWeek)

    if (!ctx.registration_period_id || !ctx.semester_id) {
      console.error('Missing required context for problems:', ctx)
      return []
    }

    try {
      console.log('🔍 Querying unresolved problems with context:', {
        school_id: ctx.school_id,
        registration_period_id: ctx.registration_period_id,
        semester_id: ctx.semester_id,
        day_of_week: dayOfWeek
      });

      // Try a simpler query first without join to test if table exists
      const { data, error } = await supabase
        .from('course_notes')
        .select('*')
        .eq('school_id', ctx.school_id)
        .eq('registration_period_id', ctx.registration_period_id)
        .eq('semester_id', ctx.semester_id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_problem', true)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching unresolved problems details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        return [];
      }

      // For now, just return the notes without course names (we'll add course names later)
      const problems = (data || []).map(note => ({
        ...note,
        course_name: 'Course ID: ' + note.course_id // Temporary until we fix the join
      }))

      console.log(`Found ${problems.length} unresolved problems for day ${dayOfWeek}`);
      return problems;
    } catch (error) {
      console.error('❌ Error in getUnresolvedProblems:', {
        message: error?.message || 'Unknown error',
        dayOfWeek,
        context: ctx,
        fullError: error
      });
      return [];
    }
  }

  // Add a note to a course (simplified without stored function)
  static async addCourseNote(
    courseId: string,
    text: string,
    isProblem: boolean = false,
    author: string = 'Admin',
    dayOfWeek: number,
    context: Partial<EnrollmentContext> = {}
  ): Promise<boolean> {
    const detectedContext = await this.detectContext()
    const ctx = { ...this.defaultContext, ...detectedContext, ...context }

    console.log('Adding course note:', { courseId, text, isProblem, author })

    if (!ctx.registration_period_id || !ctx.semester_id) {
      console.error('Missing required context for adding note:', ctx)
      return false
    }

    try {
      // Insert note directly
      const { data, error } = await supabase
        .from('course_notes')
        .insert({
          course_id: courseId,
          school_id: ctx.school_id,
          registration_period_id: ctx.registration_period_id,
          semester_id: ctx.semester_id,
          day_of_week: dayOfWeek,
          text: text,
          author: author,
          is_problem: isProblem,
          is_resolved: false
        })
        .select()

      if (error) {
        console.error('Error adding course note details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        return false;
      }

      console.log('✅ Course note added successfully!', data);
      return true;
    } catch (error) {
      console.error('❌ Error in addCourseNote:', {
        message: error?.message || 'Unknown error',
        courseId,
        text,
        isProblem,
        context: ctx,
        fullError: error
      });
      return false;
    }
  }

  // Resolve a problem note (simplified without stored function)
  static async resolveProblemNote(
    noteId: string,
    resolvedBy: string = 'Admin'
  ): Promise<boolean> {
    console.log('Resolving problem note:', noteId)

    try {
      // Update note to resolved directly
      const { data, error } = await supabase
        .from('course_notes')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('is_problem', true)
        .select()

      if (error) {
        console.error('Error resolving problem note details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        });
        return false;
      }

      if (!data || data.length === 0) {
        console.error('Note not found or not a problem');
        return false;
      }

      console.log('✅ Problem note resolved successfully!', data);
      return true;
    } catch (error) {
      console.error('❌ Error in resolveProblemNote:', {
        message: error?.message || 'Unknown error',
        noteId,
        resolvedBy,
        fullError: error
      });
      return false;
    }
  }

  // Test database connection
  static async testConnection() {
    try {
      const [studentsTest, coursesTest, daysTest, notesTest] = await Promise.all([
        supabase.from('w_registration_period_students_by_day').select('count').limit(1),
        supabase.from('w_registration_period_courses_by_day').select('count').limit(1),
        supabase.from('vw_school_days').select('count').limit(1),
        supabase.from('course_notes').select('count').limit(1)
      ])

      return {
        studentsViewExists: !studentsTest.error,
        coursesViewExists: !coursesTest.error,
        daysViewExists: !daysTest.error,
        courseNotesExists: !notesTest.error,
        errors: {
          students: studentsTest.error?.message,
          courses: coursesTest.error?.message,
          days: daysTest.error?.message,
          notes: notesTest.error?.message
        }
      }
    } catch (error) {
      console.error('Database connection test failed:', error)
      return { error: error.message }
    }
  }
}
