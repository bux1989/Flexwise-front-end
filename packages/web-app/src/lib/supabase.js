import { createClient } from '@supabase/supabase-js'

// Environment variable validation (no fallbacks for security)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing required environment variable: VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session from URL (for auth callbacks)
    detectSessionInUrl: true,
    // Set custom session storage (optional)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Add debug logging in development only
    debug: import.meta.env.DEV
  },
  realtime: {
    // Rate limiting for realtime connections
    params: {
      eventsPerSecond: 10
    },
    // Heartbeat interval for connection health
    heartbeatIntervalMs: 30000,
    // Reconnection attempts
    reconnectAfterMs: function (tries) {
      return Math.min(tries * 1000, 30000)
    }
  },
  // Security headers
  global: {
    headers: {
      'X-Client-Info': 'flexwise-web-app'
    }
  }
})

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

// Fetch single lesson by ID for attendance modal fallback
export async function fetchSingleLesson(lessonId) {
  try {
    console.log('📚 Fetching single lesson:', lessonId);

    const { data: lesson, error } = await supabase
      .from('vw_react_lesson_details')
      .select('*')
      .eq('lesson_id', lessonId)
      .single();

    if (error) {
      console.error('❌ Error fetching lesson:', error);
      return null;
    }

    if (!lesson) {
      console.warn('⚠️ No lesson found with ID:', lessonId);
      return null;
    }

    // Fetch student data for the lesson
    let students = [];
    try {
      const { students: studentData } = await getLessonStudentNameIdPairs(lessonId);
      students = studentData.map(s => ({
        id: s.id,
        name: s.displayName
      }));
    } catch (error) {
      console.warn('⚠️ Could not fetch students for lesson:', lessonId, error);
      // Try alternative student fetch if available
      if (lesson.class_id) {
        try {
          const { data: classStudents, error: classError } = await supabase
            .from('profile_info_student')
            .select('profile_id, user_profiles!inner(first_name, last_name)')
            .eq('class_id', lesson.class_id);

          if (!classError && classStudents) {
            students = classStudents.map(s => ({
              id: s.profile_id,
              name: `${s.user_profiles.first_name} ${s.user_profiles.last_name}`
            }));
          }
        } catch (classError) {
          console.warn('⚠️ Could not fetch class students either:', classError);
        }
      }
    }

    // Transform to teacher dashboard lesson format
    const startTime = new Date(lesson.start_datetime);
    const endTime = new Date(lesson.end_datetime);

    return {
      id: lesson.lesson_id,
      time: startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      subject: lesson.subject_name || 'Unbekannt',
      class: lesson.class_name || 'Unbekannte Klasse',
      room: lesson.room_name,
      location: lesson.room_name,
      isCurrent: false, // Will be calculated if needed
      isSubstitute: lesson.lesson_type === 'substitute',
      isCancelled: lesson.is_cancelled || false,
      otherTeachers: [],
      adminComment: lesson.notes,
      students: students,
      enrolled: students.length || lesson.student_count || 0,
      attendance: { present: [], late: [], absent: [] },
      attendanceTaken: lesson.attendance_taken || false
    };

  } catch (error) {
    console.error('💥 Error in fetchSingleLesson:', error);
    return null;
  }
}

// RPC call to save attendance via DB function
export async function fetchLessonDiaryEntry(lessonId) {
  try {
    console.log('📝 Fetching lesson diary entry for lesson:', lessonId)

    const { data: diaryEntries, error } = await supabase
      .from('lesson_diary_entries')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('entry_type', 'attendance')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ Error fetching lesson diary entry:', error)
      throw error
    }

    const latestEntry = diaryEntries?.[0]
    console.log('✅ Lesson diary entry fetched:', latestEntry?.entry_text || 'No entry found')

    return latestEntry?.entry_text || ''

  } catch (error) {
    console.error('💥 Error in fetchLessonDiaryEntry:', error)
    return '' // Return empty string on error to prevent crashes
  }
}

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

// 2FA and Device Trust Management Functions

// Generate device fingerprint for device trust
export function generateDeviceFingerprint() {
  try {
    // Use more stable characteristics that don't change frequently
    const data = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(',') || navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      // Use available screen dimensions (more stable than current window)
      screenResolution: screen.availWidth && screen.availHeight
        ? `${screen.availWidth}x${screen.availHeight}`
        : `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth || 24,
      pixelDepth: screen.pixelDepth || 24
    }

    // Create a stable hash without timestamp
    const fingerprint = btoa(JSON.stringify(data))
    console.log('Device fingerprint generated:', {
      length: fingerprint.length,
      preview: fingerprint.substring(0, 20) + '...',
      components: Object.keys(data).length
    })

    return fingerprint
  } catch (error) {
    console.error('Error generating device fingerprint:', error)
    // Fallback with minimal but stable data
    const fallback = {
      userAgent: navigator.userAgent || 'unknown',
      platform: navigator.platform || 'unknown',
      language: navigator.language || 'unknown'
    }
    return btoa(JSON.stringify(fallback))
  }
}

// Generate human-readable device name
export function generateDeviceName() {
  try {
    const ua = navigator.userAgent
    let browser = 'Unknown Browser'
    let os = 'Unknown OS'

    // Detect browser
    if (ua.includes('Chrome')) browser = 'Chrome'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Safari')) browser = 'Safari'
    else if (ua.includes('Edge')) browser = 'Edge'

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iOS')) os = 'iOS'

    return `${browser} on ${os}`
  } catch (error) {
    console.error('Error generating device name:', error)
    return 'Unknown Device'
  }
}

// Check if user requires 2FA (currently only Admins)
export async function userRequires2FA(userProfile) {
  try {
    if (!userProfile) return false

    // Currently only require 2FA for Admin roles
    const adminRoles = ['Admin', 'Super Admin']

    // Check direct role
    if (userProfile.roles?.name && adminRoles.includes(userProfile.roles.name)) {
      return true
    }

    // Check multiple roles (user_roles table)
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('*, roles(name)')
      .eq('user_profile_id', userProfile.id)

    if (error) {
      console.error('Error checking user roles for 2FA:', error)
      return false // Default to not requiring 2FA on error
    }

    const hasAdminRole = userRoles?.some(ur =>
      ur.roles?.name && adminRoles.includes(ur.roles.name)
    )

    console.log('2FA check for user:', {
      email: userProfile.email,
      hasAdminRole,
      roles: userRoles?.map(ur => ur.roles?.name)
    })

    return hasAdminRole
  } catch (error) {
    console.error('Error in userRequires2FA:', error)
    return false
  }
}

// Check if user has 2FA enabled
export async function userHas2FAEnabled(user) {
  try {
    const { data: factors, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      console.error('Error checking 2FA status:', error)
      return false
    }

    // Check for verified factors (TOTP or phone/SMS)
    const hasVerifiedFactors = factors.totp.some(factor => factor.status === 'verified') ||
                               factors.phone?.some(factor => factor.status === 'verified') ||
                               (user.phone_confirmed_at && user.phone)

    console.log('2FA status check:', {
      email: user.email,
      hasVerifiedFactors,
      totpFactors: factors.totp.length,
      phoneFactors: factors.phone?.length || 0
    })

    return hasVerifiedFactors
  } catch (error) {
    console.error('Error checking 2FA enabled status:', error)
    return false
  }
}

// Check if current device is trusted
export async function isDeviceTrusted(userProfileId) {
  try {
    const deviceFingerprint = generateDeviceFingerprint()

    const { data: trustedDevice, error } = await supabase
      .from('user_trusted_devices')
      .select('*')
      .eq('user_profile_id', userProfileId)
      .eq('device_fingerprint', deviceFingerprint)
      .eq('is_active', true)
      .gt('trusted_until', new Date().toISOString())
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking device trust:', error)
      return false
    }

    const isTrusted = !!trustedDevice
    console.log('Device trust check:', {
      userProfileId,
      isTrusted,
      deviceFingerprint: deviceFingerprint.substring(0, 20) + '...'
    })

    // Update last_used_at if device is trusted
    if (isTrusted) {
      await supabase
        .from('user_trusted_devices')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', trustedDevice.id)
    }

    return isTrusted
  } catch (error) {
    console.error('Error in isDeviceTrusted:', error)
    return false
  }
}

// Add device to trusted devices
export async function addTrustedDevice(userProfileId, userRole, schoolId) {
  try {
    const deviceFingerprint = generateDeviceFingerprint()
    const deviceName = generateDeviceName()

    // Determine trust duration based on role
    const adminRoles = ['Admin', 'Super Admin']
    const trustDays = adminRoles.includes(userRole) ? 30 : 90

    const trustedUntil = new Date()
    trustedUntil.setDate(trustedUntil.getDate() + trustDays)

    const { data, error } = await supabase
      .from('user_trusted_devices')
      .insert({
        user_profile_id: userProfileId,
        device_fingerprint: deviceFingerprint,
        device_name: deviceName,
        trusted_until: trustedUntil.toISOString(),
        school_id: schoolId
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding trusted device:', error)
      throw error
    }

    console.log('Device added to trusted list:', {
      deviceName,
      trustDays,
      trustedUntil: trustedUntil.toISOString()
    })

    return data
  } catch (error) {
    console.error('Error in addTrustedDevice:', error)
    throw error
  }
}

// Security audit logging
export async function logSecurityEvent(eventType, details = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    const logEntry = {
      event_type: eventType,
      user_id: user?.id || null,
      user_email: user?.email || null,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        deviceFingerprint: generateDeviceFingerprint().substring(0, 20) + '...'
      }
    }

    console.log('🔒 Security Event:', logEntry)

    // In a production environment, you might want to send this to a logging service
    // For now, we'll log to console and could store in a security_logs table

    return logEntry
  } catch (error) {
    console.error('Error logging security event:', error)
  }
}

// Enhanced login function with 2FA check
export async function handleLoginWith2FA(email, password) {
  try {
    console.log('🔐 Attempting login with 2FA check for:', email)

    // Step 1: Authenticate with email/password
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      console.error('❌ Auth error:', error)
      throw error
    }

    console.log('✅ Email/Password authentication successful for:', authData.user.email)

    // Step 2: Get user profile to check role
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      throw new Error('Unable to load user profile')
    }

    // Step 3: Check if user has 2FA enabled (ALWAYS check this first)
    const has2FA = await userHas2FAEnabled(authData.user)
    console.log('🔍 2FA enabled check result:', has2FA)

    // Step 4: Check if user requires 2FA based on role
    const requires2FA = await userRequires2FA(userProfile)
    console.log('🔍 Role-based 2FA requirement:', requires2FA)

    // Step 5: If user has 2FA enabled, ALWAYS require verification (regardless of role)
    if (has2FA) {
      console.log('🔒 User has 2FA enabled, checking device trust')

      // Check if device is trusted
      const deviceTrusted = await isDeviceTrusted(userProfile.id)
      if (deviceTrusted) {
        console.log('✅ Device is trusted, 2FA verification bypassed')
        return {
          user: authData.user,
          profile: userProfile,
          requires2FA: requires2FA,
          has2FA: true,
          deviceTrusted: true,
          loginComplete: true
        }
      }

      // Device not trusted, require 2FA verification
      console.log('🔒 Device not trusted, 2FA verification required')
      return {
        user: authData.user,
        profile: userProfile,
        requires2FA: requires2FA,
        has2FA: true,
        deviceTrusted: false,
        loginComplete: false,
        needsVerification: true
      }
    }

    // Step 6: User doesn't have 2FA enabled - check if role requires it
    if (requires2FA) {
      console.log('⚠️ User role requires 2FA but has not set it up yet')
      return {
        user: authData.user,
        profile: userProfile,
        requires2FA: true,
        has2FA: false,
        needsSetup: true,
        loginComplete: true // Allow login but prompt for 2FA setup
      }
    }

    // Step 7: User doesn't have 2FA and role doesn't require it
    console.log('ℹ️ User does not have 2FA enabled and role does not require it, login complete')
    return {
      user: authData.user,
      profile: userProfile,
      requires2FA: false,
      has2FA: false,
      loginComplete: true
    }

  } catch (error) {
    console.error('💥 Login error:', error)
    throw error
  }
}

// 2FA System Health Check and Monitoring
export async function check2FASystemHealth() {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    issues: [],
    components: {}
  }

  try {
    // Check database connection
    const { data: testQuery, error: dbError } = await supabase
      .from('user_trusted_devices')
      .select('count(*)')
      .limit(1)

    health.components.database = {
      status: dbError ? 'error' : 'healthy',
      error: dbError?.message
    }

    if (dbError) {
      health.issues.push('Database connection failed')
      health.status = 'degraded'
    }

    // Check MFA service availability
    try {
      const { data: factors, error: mfaError } = await supabase.auth.mfa.listFactors()
      health.components.mfa_service = {
        status: mfaError ? 'error' : 'healthy',
        error: mfaError?.message,
        factors_count: factors?.totp?.length || 0
      }

      if (mfaError) {
        health.issues.push('MFA service unavailable')
        health.status = 'degraded'
      }
    } catch (mfaError) {
      health.components.mfa_service = {
        status: 'error',
        error: mfaError.message
      }
      health.issues.push('MFA service error')
      health.status = 'degraded'
    }

    // Check device fingerprinting
    try {
      const fingerprint = generateDeviceFingerprint()
      health.components.device_fingerprinting = {
        status: fingerprint ? 'healthy' : 'error',
        fingerprint_length: fingerprint?.length || 0
      }

      if (!fingerprint || fingerprint.length < 10) {
        health.issues.push('Device fingerprinting failed')
        health.status = 'degraded'
      }
    } catch (fpError) {
      health.components.device_fingerprinting = {
        status: 'error',
        error: fpError.message
      }
      health.issues.push('Device fingerprinting error')
      health.status = 'degraded'
    }

    console.log('🏥 2FA Health Check:', health)
    return health

  } catch (error) {
    console.error('💥 Health check failed:', error)
    return {
      ...health,
      status: 'error',
      error: error.message,
      issues: [...health.issues, 'Health check system failure']
    }
  }
}

// Get 2FA usage statistics
export async function get2FAUsageStats() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const profileId = user.user_metadata?.profile_id
    if (!profileId) return null

    // Get user's trusted devices
    const { data: devices, error: devicesError } = await supabase
      .from('user_trusted_devices')
      .select('*')
      .eq('user_profile_id', profileId)
      .eq('is_active', true)

    if (devicesError) {
      console.error('Error fetching device stats:', devicesError)
      return null
    }

    // Get MFA factors
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()

    if (factorsError) {
      console.error('Error fetching MFA stats:', factorsError)
      return null
    }

    const stats = {
      user_email: user.email,
      has_2fa_enabled: factors?.totp?.some(f => f.status === 'verified') || false,
      trusted_devices_count: devices?.length || 0,
      active_devices: devices?.filter(d => new Date(d.trusted_until) > new Date()).length || 0,
      expired_devices: devices?.filter(d => new Date(d.trusted_until) <= new Date()).length || 0,
      totp_factors: factors?.totp?.length || 0,
      verified_totp_factors: factors?.totp?.filter(f => f.status === 'verified').length || 0
    }

    console.log('📊 2FA Usage Stats:', stats)
    return stats

  } catch (error) {
    console.error('Error getting 2FA stats:', error)
    return null
  }
}
