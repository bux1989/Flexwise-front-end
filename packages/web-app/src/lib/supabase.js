import { createClient } from '@supabase/supabase-js'

// Use your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://api.schulflex.app'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ2MzA5NjAwLCJleHAiOjE5MDQwNzYwMDB9.mhTQEJi2po9vvM_sjtKzKUrYYQEbFyvykOwkE_gya-Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authentication only - App.jsx handles profile/role loading
export async function handleLogin(email, password) {
  try {
    console.log('🔐 Attempting login for:', email)

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      console.error('❌ Auth error:', error)
      throw error
    }

    console.log('✅ Authentication successful for:', authData.user.email)

    return {
      user: authData.user
      // Note: profile and role are handled by App.jsx
    }

  } catch (error) {
    console.error('💥 Login error:', error)
    throw error
  }
}

// Logout function
export async function handleLogout() {
  try {
    console.log('🚪 Logging out...')

    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error) {
      console.error('❌ Logout error:', error)
      console.log('🔄 Local session cleared despite error')
    } else {
      console.log('✅ Logout successful')
    }

    // Force redirect to login page (root shows login when not authenticated)
    window.location.href = '/'

  } catch (err) {
    console.error('💥 Logout failed:', err)
    console.log('🔄 Forcing local logout and redirect...')
    // Force redirect even if logout fails
    window.location.href = '/'
  }
}

// Get current user profile using the correct connection pattern
export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ No authenticated user found')
      return null
    }
    
    console.log('👤 Getting profile for user:', {
      auth_id: user.id,
      email: user.email,
      profile_id: user.user_metadata?.profile_id
    })
    
    // Check if we have the profile_id in user_metadata
    const profileId = user.user_metadata?.profile_id
    
    if (!profileId) {
      console.error('❌ No profile_id found in user_metadata for user:', user.email)
      throw new Error('User account not properly set up - missing profile_id in metadata')
    }
    
    // Use the correct connection pattern: user_metadata.profile_id ��� user_profiles.id
    console.log('🔗 Looking up profile using profile_id:', profileId)
    console.log('📋 Full user metadata:', user.user_metadata)

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        roles(name)
      `)
      .eq('id', profileId)
      .single()

    console.log('📊 Database query result:', { profile, error })
      
    if (error) {
      console.error('❌ Profile lookup failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        query_attempted: `user_profiles.id = ${profileId}`
      })

      // Don't use fallbacks - let authentication fail properly
      throw new Error(`Profile lookup failed: ${error.message}`)
    }
    
    if (!profile) {
      console.error('❌ No profile found for profile_id:', profileId)
      return null
    }
    
    const role = profile.roles?.name || 'Parent'

    console.log('✅ Profile loaded successfully:', {
      profile_id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      role: role,
      school_id: profile.school_id
    })
    
    return {
      ...profile,
      role: role
    }
    
  } catch (error) {
    console.error('💥 Error in getCurrentUserProfile:', error)
    return null
  }
}

// Role-based routing logic
export function getRouteByRole(role) {
  const routes = {
    'Parent': '/dashboard/parent',
    'Teacher': '/dashboard/teacher', 
    'Admin': '/dashboard/admin',
    'Student': '/dashboard/student',
    'Erzieher*innen': '/dashboard/teacher', // Use teacher dashboard for erzieher
    'Externe': '/dashboard/external',
    'Super Admin': '/dashboard/admin'
  }
  
  console.log('🗺️ Getting route for role:', role, '→', routes[role] || '/dashboard/parent')
  return routes[role] || '/dashboard/parent'
}

// RLS Context Setup
export async function setupRLSContext() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Route Protection
export async function checkAccess() {
  const session = await supabase.auth.getSession()
  return session.data.session
}

// Fetch lessons from vw_react_lesson_details view
export async function fetchLessonsForTeacher(teacherId) {
  try {
    console.log('📚 Fetching lessons from vw_react_lesson_details for teacher:', teacherId)

    const { data: lessons, error } = await supabase
      .from('vw_react_lesson_details')
      .select('*')
      .eq('assigned_teacher_id', teacherId)
      .order('start_datetime', { ascending: true })

    if (error) {
      console.error('❌ Error fetching lessons:', error)
      throw error
    }

    console.log('✅ Lessons fetched successfully:', lessons?.length || 0, 'lessons')
    return lessons || []

  } catch (error) {
    console.error('💥 Error in fetchLessonsForTeacher:', error)
    throw error
  }
}

// Fetch lessons for current date
export async function fetchTodaysLessons(teacherId, date = new Date()) {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    console.log('📅 Fetching lessons for date:', date.toISOString().split('T')[0])

    const { data: lessons, error } = await supabase
      .from('vw_react_lesson_details')
      .select('*')
      .eq('assigned_teacher_id', teacherId)
      .gte('start_datetime', startOfDay.toISOString())
      .lt('start_datetime', endOfDay.toISOString())
      .order('start_datetime', { ascending: true })

    if (error) {
      console.error('❌ Error fetching today\'s lessons:', error)
      throw error
    }

    console.log('✅ Today\'s lessons fetched:', lessons?.length || 0, 'lessons')
    return lessons || []

  } catch (error) {
    console.error('💥 Error in fetchTodaysLessons:', error)
    throw error
  }
}

// Fetch attendance badge data for lessons
export async function fetchAttendanceBadges(lessonIds) {
  try {
    console.log('🏷️ Fetching attendance badges for lessons:', lessonIds)

    // Handle empty or null lesson IDs
    if (!lessonIds || lessonIds.length === 0) {
      console.log('📋 No lesson IDs provided, returning empty badges')
      return {}
    }

    const { data: badges, error } = await supabase
      .from('vw_lesson_attendance_badges')
      .select('*')
      .in('lesson_id', lessonIds)

    if (error) {
      console.error('❌ Error fetching attendance badges:', error)
      throw error
    }

    // Convert to lookup object for easy access
    const badgeLookup = {}
    badges?.forEach(badge => {
      badgeLookup[badge.lesson_id] = badge
    })

    console.log('✅ Attendance badges fetched:', Object.keys(badgeLookup).length, 'badges')
    return badgeLookup

  } catch (error) {
    console.error('💥 Error in fetchAttendanceBadges:', error)
    return {} // Return empty object on error to prevent crashes
  }
}

// Attendance tracking functions
export async function fetchLessonAttendance(lessonId) {
  try {
    console.log('📋 Fetching attendance for lesson:', lessonId)
    console.log('📋 Lesson ID type:', typeof lessonId)

    // First, let's try a simple query to see if the table exists
    console.log('🔍 Testing table access...')
    const { data: testData, error: testError } = await supabase
      .from('student_attendance_logs')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ Table access failed:', testError)
      console.error('❌ Error message:', testError.message || 'No message')
      console.error('❌ Error code:', testError.code || 'No code')
      console.error('❌ Error details:', testError.details || 'No details')
      console.error('❌ Error hint:', testError.hint || 'No hint')
      throw new Error(`Table access failed: ${testError.message}`)
    }

    console.log('✅ Table access successful, test data:', testData)

    // Now try the actual query - specify which user_profiles relationship we want
    const { data: attendance, error } = await supabase
      .from('student_attendance_logs')
      .select(`
        *,
        user_profiles!student_attendance_logs_student_id_fkey(first_name, last_name)
      `)
      .eq('lesson_id', lessonId)

    if (error) {
      console.error('❌ Error fetching attendance:', error)
      console.error('❌ Error message:', error.message || 'No message')
      console.error('❌ Error code:', error.code || 'No code')
      console.error('❌ Error details:', error.details || 'No details')
      console.error('❌ Error hint:', error.hint || 'No hint')
      throw new Error(`Attendance fetch failed: ${error.message}`)
    }

    console.log('📋 Raw attendance data:', attendance)

    // Group attendance by status
    const grouped = {
      present: attendance?.filter(record => record.status === 'present') || [],
      late: attendance?.filter(record => record.status === 'late') || [],
      absent: attendance?.filter(record =>
        record.status === 'absent_excused' || record.status === 'absent_unexcused'
      ) || []
    }

    console.log('✅ Attendance fetched and grouped:', grouped)
    return grouped

  } catch (error) {
    console.error('💥 Error in fetchLessonAttendance:', error)
    console.error('💥 Error name:', error.name || 'No name')
    console.error('💥 Error message:', error.message || 'No message')
    console.error('💥 Error stack:', error.stack || 'No stack')
    throw error
  }
}

export async function saveAttendanceRecord(lessonId, studentId, status, additionalData = {}) {
  try {
    console.log('💾 Saving attendance record:', { lessonId, studentId, status, additionalData })

    const attendanceRecord = {
      lesson_id: lessonId,
      student_id: studentId,
      status: status, // 'present', 'late', 'absent'
      recorded_at: new Date().toISOString(),
      ...additionalData // Can include notes, late_minutes, etc.
    }

    const { data, error } = await supabase
      .from('student_attendance_logs')
      .upsert(attendanceRecord, {
        onConflict: 'lesson_id,student_id',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('❌ Error saving attendance:', error)
      throw error
    }

    console.log('✅ Attendance record saved:', data)
    return data

  } catch (error) {
    console.error('💥 Error in saveAttendanceRecord:', error)
    throw error
  }
}

export async function bulkSaveAttendance(lessonId, attendanceRecords) {
  try {
    console.log('📚 Bulk saving attendance for lesson:', lessonId, attendanceRecords)

    const records = attendanceRecords.map(record => ({
      lesson_id: lessonId,
      student_id: record.studentId,
      status: record.status,
      recorded_at: new Date().toISOString(),
      notes: record.notes || null,
      late_minutes: record.lateMinutes || null
    }))

    const { data, error } = await supabase
      .from('student_attendance_logs')
      .upsert(records, {
        onConflict: 'lesson_id,student_id',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('❌ Error bulk saving attendance:', error)
      throw error
    }

    console.log('✅ Bulk attendance saved:', data)
    return data

  } catch (error) {
    console.error('💥 Error in bulkSaveAttendance:', error)
    throw error
  }
}

export const isDemo = false // Always use real authentication now

// Fetch lesson meta from course_lessons
export async function getLessonMeta(lessonId) {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('id, school_id, course_id, class_id, start_datetime, end_datetime')
    .eq('id', lessonId)
    .single()
  if (error) throw error
  return data
}


// Build student ID ↔ name pairs for a lesson
export async function getLessonStudentNameIdPairs(lessonId) {
  const lesson = await getLessonMeta(lessonId)
  if (!lesson) return { students: [], schoolId: null }

  // Helper to fetch profiles and classes
  const fetchProfilesAndClasses = async (studentIds, classIdOverride = null) => {
    if (!studentIds.length) return []
    const { data: profiles, error: pErr } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .in('id', studentIds)
    if (pErr) throw pErr

    // Map profile_id -> class_id
    let classMap = {}
    if (classIdOverride) {
      profiles.forEach(p => { classMap[p.id] = classIdOverride })
    } else {
      const { data: pis, error: pisErr } = await supabase
        .from('profile_info_student')
        .select('profile_id, class_id')
        .in('profile_id', studentIds)
      if (pisErr) throw pisErr
      classMap = (pis || []).reduce((acc, r) => { acc[r.profile_id] = r.class_id; return acc }, {})
    }

    const classIds = Array.from(new Set(Object.values(classMap).filter(Boolean)))
    let classNameById = {}
    if (classIds.length) {
      const { data: classes, error: cErr } = await supabase
        .from('structure_classes')
        .select('id, name')
        .in('id', classIds)
      if (cErr) throw cErr
      classNameById = (classes || []).reduce((acc, c) => { acc[c.id] = c.name; return acc }, {})
    }

    return profiles.map(p => {
      const className = classNameById[classMap[p.id]] || ''
      const displayName = `${p.first_name || ''} ${p.last_name || ''}${className ? ` (${className})` : ''}`.trim()
      return { id: p.id, displayName }
    })
  }

  if (lesson.course_id) {
    const { data: enrollments, error: eErr } = await supabase
      .from('course_enrollments')
      .select('student_id')
      .eq('course_id', lesson.course_id)
    if (eErr) throw eErr
    const studentIds = (enrollments || []).map(e => e.student_id).filter(Boolean)
    const students = await fetchProfilesAndClasses(studentIds)
    return { students, schoolId: lesson.school_id }
  }

  if (lesson.class_id) {
    const { data: pis, error: pisErr } = await supabase
      .from('profile_info_student')
      .select('profile_id')
      .eq('class_id', lesson.class_id)
    if (pisErr) throw pisErr
    const studentIds = (pis || []).map(r => r.profile_id).filter(Boolean)
    const students = await fetchProfilesAndClasses(studentIds, lesson.class_id)
    return { students, schoolId: lesson.school_id }
  }

  return { students: [], schoolId: lesson.school_id }
}

// RPC call to save attendance via DB function
export async function saveLessonAttendanceBulkRPC({ lessonId, schoolId, attendance, diaryText, diaryType = 'attendance', diaryPrivate = false }) {
  const payload = {
    p_lesson_id: lessonId,
    p_school_id: schoolId,
    p_attendance: attendance,
    p_diary_entry_text: diaryText || null,
    p_diary_entry_type: diaryType,
    p_diary_is_private: !!diaryPrivate
  }
  const { data, error } = await supabase.rpc('save_lesson_attendance_bulk', payload)
  if (error) throw error
  return data
}
