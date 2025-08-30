import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Comprehensive real-time hook for school operations
 * Handles all 9 critical tables with hybrid subscription approach
 */
export function useSchoolRealtime({
  schoolId,
  teacherLessonIds = [],
  onUpdate,
  enabled = true
}) {
  const { user } = useAuth()
  const subscriptionsRef = useRef([])
  const updateQueueRef = useRef([])
  const debounceTimerRef = useRef(null)

  // Debounced update handler to prevent excessive re-renders
  const debouncedUpdate = useCallback((type, payload) => {
    updateQueueRef.current.push({ type, payload, timestamp: Date.now() })
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      const updates = [...updateQueueRef.current]
      updateQueueRef.current = []
      
      if (updates.length > 0 && onUpdate) {
        // Group updates by type for batch processing
        const groupedUpdates = updates.reduce((acc, update) => {
          if (!acc[update.type]) acc[update.type] = []
          acc[update.type].push(update)
          return acc
        }, {})
        
        console.log('📡 Processing batched real-time updates:', groupedUpdates)
        onUpdate(groupedUpdates)
      }
    }, 300) // 300ms debounce
  }, [onUpdate])

  // Real-time subscription setup
  useEffect(() => {
    if (!enabled || !schoolId || !user) {
      console.log('🔄 Real-time disabled or missing requirements:', { enabled, schoolId, user: !!user })
      return
    }

    console.log('🔄 Setting up real-time subscriptions for school:', schoolId)

    // Cleanup existing subscriptions
    subscriptionsRef.current.forEach(sub => {
      console.log('🧹 Cleaning up existing subscription:', sub.topic)
      sub.unsubscribe()
    })
    subscriptionsRef.current = []

    // CHANNEL 1: School-wide Critical Updates (Safety & Operations)
    const schoolChannel = supabase
      .channel('school-critical-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_daily_log',
        filter: `school_id=eq.${schoolId}`
      }, payload => {
        console.log('📡 Student check-in/out update:', payload)
        debouncedUpdate('daily_log', payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'course_lessons',
        filter: `school_id=eq.${schoolId}`
      }, payload => {
        console.log('📡 Lesson update:', payload)
        debouncedUpdate('lesson', payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'substitutions',
        filter: `school_id=eq.${schoolId}`
      }, payload => {
        console.log('📡 Substitution update:', payload)
        debouncedUpdate('substitution', payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'staff_absences',
        filter: `school_id=eq.${schoolId}`
      }, payload => {
        console.log('📡 Staff absence update:', payload)
        debouncedUpdate('staff_absence', payload)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bulletin_posts',
        filter: `school_id=eq.${schoolId}`
      }, payload => {
        console.log('📡 Bulletin post update:', payload)
        debouncedUpdate('bulletin', payload)
      })
      .subscribe((status) => {
        console.log('📡 School channel status:', status)
      })

    subscriptionsRef.current.push(schoolChannel)

    // CHANNEL 2: Teacher-specific Attendance & Communication
    let teacherChannel = null
    if (teacherLessonIds.length > 0) {
      teacherChannel = supabase
        .channel('teacher-specific-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'student_attendance_logs',
          filter: `lesson_id=in.(${teacherLessonIds.join(',')})`
        }, payload => {
          console.log('📡 Attendance log update:', payload)
          debouncedUpdate('attendance', payload)
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'lesson_diary_entries',
          filter: `lesson_id=in.(${teacherLessonIds.join(',')})`
        }, payload => {
          console.log('📡 Diary entry update:', payload)
          debouncedUpdate('diary', payload)
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'student_absence_notes',
          filter: `school_id=eq.${schoolId}`
        }, payload => {
          console.log('📡 Absence note update:', payload)
          debouncedUpdate('absence_note', payload)
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'student_presence_events',
          filter: `school_id=eq.${schoolId}`
        }, payload => {
          console.log('📡 Presence event update:', payload)
          debouncedUpdate('presence_event', payload)
        })
        .subscribe((status) => {
          console.log('📡 Teacher channel status:', status)
        })

      subscriptionsRef.current.push(teacherChannel)
    }

    console.log('✅ Real-time subscriptions established:', subscriptionsRef.current.length, 'channels')

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions')
      subscriptionsRef.current.forEach(sub => {
        sub.unsubscribe()
      })
      subscriptionsRef.current = []
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [enabled, schoolId, user, teacherLessonIds?.join(','), debouncedUpdate])

  // Return subscription status and manual refresh function
  return {
    isConnected: subscriptionsRef.current.length > 0,
    channelCount: subscriptionsRef.current.length,
    refresh: useCallback(() => {
      // Force refresh by toggling subscriptions
      console.log('🔄 Manual real-time refresh triggered')
      if (onUpdate) {
        onUpdate({ refresh: [{ type: 'manual_refresh', timestamp: Date.now() }] })
      }
    }, [onUpdate])
  }
}

/**
 * Lightweight hook for specific table updates
 * Use when you only need updates for one table
 */
export function useTableRealtime(tableName, filter, onUpdate, enabled = true) {
  const { user } = useAuth()

  useEffect(() => {
    if (!enabled || !tableName || !user || !onUpdate) return

    console.log(`📡 Setting up real-time for table: ${tableName}`)

    const channel = supabase
      .channel(`${tableName}-updates`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: filter || undefined
      }, payload => {
        console.log(`📡 ${tableName} update:`, payload)
        onUpdate(payload)
      })
      .subscribe()

    return () => {
      console.log(`🧹 Cleaning up ${tableName} subscription`)
      channel.unsubscribe()
    }
  }, [enabled, tableName, filter, user, onUpdate])
}

// Helper function for parsing real-time updates
export function parseRealtimeUpdate(payload) {
  const { eventType, new: newRecord, old: oldRecord, table } = payload
  
  return {
    type: eventType?.toLowerCase() || 'unknown',
    table,
    record: newRecord || oldRecord || null,
    oldRecord: oldRecord || null,
    isInsert: eventType === 'INSERT',
    isUpdate: eventType === 'UPDATE', 
    isDelete: eventType === 'DELETE',
    timestamp: new Date().toISOString()
  }
}

// TODO: Future parent notification system integration
export function prepareParentNotification(studentId, eventType, data) {
  // This function will be implemented when messaging system is ready
  // Will integrate with:
  // - families table to identify parents
  // - notification service (web push, email, SMS)
  // - user preferences for notification types
  
  console.log('📱 Parent notification prepared (not yet implemented):', {
    studentId,
    eventType,
    data,
    implementationNote: 'Ready for messaging system integration'
  })
  
  return {
    studentId,
    eventType,
    data,
    status: 'prepared',
    message: 'Integration point ready for future messaging system'
  }
}
