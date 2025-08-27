import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function TeacherDashboard({ user, profile }) {
  const [teacherData, setTeacherData] = useState(null)
  const [schedule, setSchedule] = useState([])
  const [attendance, setAttendance] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    fetchTeacherData()
    
    return () => clearInterval(timer)
  }, [])

  const fetchTeacherData = async () => {
    try {
      setLoading(true)
      
      if (profile) {
        // Use real profile data
        setTeacherData({
          first_name: profile.first_name || 'Teacher',
          last_name: profile.last_name || 'User',
          email: user.email,
          school_name: profile.structure_schools?.name || 'School',
          role: profile.role
        })
      }

      // Fetch real schedule data - RLS will automatically filter for this teacher
      try {
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('student_daily_log') // or your schedule table
          .select(`
            *,
            structure_classes(name),
            structure_subjects(name)
          `)
          .limit(10)
          
        if (scheduleData && !scheduleError) {
          // Transform to schedule format
          const transformedSchedule = scheduleData.slice(0, 5).map((item, index) => ({
            id: item.id || index + 1,
            time: `${8 + index}:00-${9 + index}:00`,
            subject: item.structure_subjects?.name || 'Mathematics',
            class: item.structure_classes?.name || `Class ${index + 1}`,
            room: `Room ${101 + index}`
          }))
          setSchedule(transformedSchedule)
        } else {
          // Fallback to demo data if real data not available
          setSchedule([
            { id: 1, time: '08:00-09:00', subject: 'Mathematics', class: '9A', room: 'Room 101' },
            { id: 2, time: '09:00-10:00', subject: 'Mathematics', class: '9B', room: 'Room 101' },
            { id: 3, time: '10:30-11:30', subject: 'Physics', class: '10A', room: 'Lab 1' },
            { id: 4, time: '11:30-12:30', subject: 'Physics', class: '10B', room: 'Lab 1' },
            { id: 5, time: '14:00-15:00', subject: 'Mathematics', class: '8A', room: 'Room 102' }
          ])
        }
      } catch (scheduleError) {
        console.error('Schedule fetch error:', scheduleError)
        // Use fallback data
        setSchedule([
          { id: 1, time: '08:00-09:00', subject: 'Mathematics', class: '9A', room: 'Room 101' },
          { id: 2, time: '09:00-10:00', subject: 'Mathematics', class: '9B', room: 'Room 101' }
        ])
      }

      // Fetch attendance data - RLS will automatically filter
      try {
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('student_daily_log')
          .select(`
            *,
            students(first_name, last_name),
            structure_classes(name)
          `)
          .limit(10)
          
        if (attendanceData && !attendanceError) {
          const transformedAttendance = attendanceData.slice(0, 4).map(item => ({
            id: item.id,
            student: item.students ? `${item.students.first_name} ${item.students.last_name}` : 'Student Name',
            class: item.structure_classes?.name || 'Class',
            status: item.attendance_status || 'present',
            time: item.created_at ? new Date(item.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '08:05'
          }))
          setAttendance(transformedAttendance)
        } else {
          // Fallback data
          setAttendance([
            { id: 1, student: 'Emma Schmidt', class: '9A', status: 'present', time: '08:05' },
            { id: 2, student: 'Max Mueller', class: '9A', status: 'late', time: '08:15' },
            { id: 3, student: 'Lisa Weber', class: '9A', status: 'absent', time: '-' },
            { id: 4, student: 'Tom Fischer', class: '9B', status: 'present', time: '09:02' }
          ])
        }
      } catch (attendanceError) {
        console.error('Attendance fetch error:', attendanceError)
        // Use fallback data
        setAttendance([
          { id: 1, student: 'Emma Schmidt', class: '9A', status: 'present', time: '08:05' }
        ])
      }
      
    } catch (error) {
      console.error('Error fetching teacher data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const getCurrentLesson = () => {
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    
    return schedule.find(lesson => {
      const [startTime] = lesson.time.split('-')
      return startTime <= currentTimeString
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  const currentLesson = getCurrentLesson()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Teacher Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {teacherData?.first_name} {teacherData?.last_name}
              </p>
              {teacherData?.school_name && (
                <p className="text-sm text-gray-500">{teacherData.school_name}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Current Time</div>
                <div className="font-semibold">
                  {currentTime.toLocaleTimeString('de-DE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Classes</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {schedule.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Students</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {attendance.length * 25}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Today's Lessons</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {schedule.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">Current Lesson</div>
                    <div className="text-lg font-bold text-gray-900">
                      {currentLesson ? `${currentLesson.subject} - ${currentLesson.class}` : 'Break Time'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Today's Schedule */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {schedule.map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className={`p-4 rounded-lg border ${
                        lesson === currentLesson 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-900">{lesson.subject}</div>
                          <div className="text-sm text-gray-600">Class {lesson.class}</div>
                          <div className="text-sm text-gray-500">{lesson.room}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{lesson.time}</div>
                          {lesson === currentLesson && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Attendance */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Attendance</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{record.student}</div>
                        <div className="text-sm text-gray-600">Class {record.class}</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
                        </span>
                        {record.time !== '-' && (
                          <div className="text-xs text-gray-500 mt-1">{record.time}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
