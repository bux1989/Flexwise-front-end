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
        roles(name),
        structure_schools(name)
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
    const school = profile.structure_schools?.name || 'Unknown School'
    
    console.log('✅ Profile loaded successfully:', {
      profile_id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      role: role,
      school: school
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

// Attendance tracking functions
export async function fetchLessonAttendance(lessonId) {
  try {
    console.log('📋 Fetching attendance for lesson:', lessonId)

    const { data: attendance, error } = await supabase
      .from('student_attendance_logs')
      .select(`
        *,
        user_profiles(first_name, last_name)
      `)
      .eq('lesson_id', lessonId)

    if (error) {
      console.error('❌ Error fetching attendance:', error)
      throw error
    }

    // Group attendance by status
    const grouped = {
      present: attendance?.filter(record => record.status === 'present') || [],
      late: attendance?.filter(record => record.status === 'late') || [],
      absent: attendance?.filter(record => record.status === 'absent') || []
    }

    console.log('✅ Attendance fetched:', grouped)
    return grouped

  } catch (error) {
    console.error('💥 Error in fetchLessonAttendance:', error)
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
