import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useTableRealtime } from './useSchoolRealtime'

/**
 * Real-time hook for Info-Board data
 * Handles bulletin posts and substitutions with live updates
 */
export function useInfoBoardRealtime(schoolId, enabled = true) {
  const [bulletinPosts, setBulletinPosts] = useState([])
  const [substitutions, setSubstitutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch bulletin posts
  const fetchBulletinPosts = useCallback(async () => {
    if (!schoolId) return []

    try {
      console.log('📋 Fetching bulletin posts for school:', schoolId)
      
      const { data, error } = await supabase
        .from('bulletin_posts')
        .select(`
          id,
          title,
          content,
          priority,
          created_at,
          updated_at,
          is_public,
          expires_at,
          created_by
        `)
        .eq('school_id', schoolId)
        .eq('is_public', true)
        .or('expires_at.is.null,expires_at.gte.now()')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('❌ Error fetching bulletin posts:', error)
        throw error
      }

      console.log('✅ Bulletin posts loaded:', data?.length || 0)
      return data || []

    } catch (err) {
      console.error('💥 Error in fetchBulletinPosts:', err)
      throw err
    }
  }, [schoolId])

  // Fetch substitutions
  const fetchSubstitutions = useCallback(async () => {
    if (!schoolId) return []

    try {
      console.log('📋 Fetching substitutions for school:', schoolId)

      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('substitutions')
        .select(`
          id,
          original_lesson_id,
          substitute_staff_id,
          reason,
          notes,
          created_at,
          valid_until,
          status,
          course_lessons!inner(
            id,
            subject_id,
            class_id,
            room_id,
            start_datetime,
            end_datetime,
            subjects(name, abbreviation),
            structure_classes(name),
            structure_rooms(name)
          )
        `)
        .eq('school_id', schoolId)
        .eq('status', 'approved')
        .gte('valid_until', today)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('❌ Error fetching substitutions:', error)
        throw error
      }

      console.log('✅ Substitutions loaded:', data?.length || 0)
      return data || []

    } catch (err) {
      console.error('💥 Error in fetchSubstitutions:', err)
      throw err
    }
  }, [schoolId])

  // Load all data
  const loadData = useCallback(async () => {
    if (!schoolId) {
      setBulletinPosts([])
      setSubstitutions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [bulletins, subs] = await Promise.all([
        fetchBulletinPosts(),
        fetchSubstitutions()
      ])

      setBulletinPosts(bulletins)
      setSubstitutions(subs)

    } catch (err) {
      console.error('❌ Error loading Info-Board data:', err)
      setError(err.message || 'Failed to load Info-Board data')
    } finally {
      setLoading(false)
    }
  }, [schoolId, fetchBulletinPosts, fetchSubstitutions])

  // Handle bulletin posts real-time updates
  const handleBulletinUpdate = useCallback(async (payload) => {
    console.log('📡 Bulletin post real-time update:', payload)
    
    // Reload bulletin posts on any change
    try {
      const updatedBulletins = await fetchBulletinPosts()
      setBulletinPosts(updatedBulletins)
      console.log('✅ Bulletin posts updated via real-time')
    } catch (error) {
      console.error('❌ Error updating bulletins via real-time:', error)
    }
  }, [fetchBulletinPosts])

  // Handle substitutions real-time updates
  const handleSubstitutionUpdate = useCallback(async (payload) => {
    console.log('📡 Substitution real-time update:', payload)
    
    // Reload substitutions on any change
    try {
      const updatedSubs = await fetchSubstitutions()
      setSubstitutions(updatedSubs)
      console.log('✅ Substitutions updated via real-time')
    } catch (error) {
      console.error('❌ Error updating substitutions via real-time:', error)
    }
  }, [fetchSubstitutions])

  // Set up real-time subscriptions
  useTableRealtime(
    'bulletin_posts',
    schoolId ? `school_id=eq.${schoolId}` : null,
    handleBulletinUpdate,
    enabled && !!schoolId
  )

  useTableRealtime(
    'substitutions',
    schoolId ? `school_id=eq.${schoolId}` : null,
    handleSubstitutionUpdate,
    enabled && !!schoolId
  )

  // Initial data load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Transform substitutions for display
  const transformedSubstitutions = substitutions.map(sub => ({
    id: sub.id,
    subject: sub.course_lessons?.subjects?.name || 'Unbekanntes Fach',
    subjectAbbr: sub.course_lessons?.subjects?.abbreviation || 'UF',
    class: sub.course_lessons?.structure_classes?.name || 'Unbekannte Klasse',
    room: sub.course_lessons?.structure_rooms?.name || 'Raum unbekannt',
    reason: sub.reason || 'Vertretung',
    notes: sub.notes,
    date: sub.lesson_date,
    time: `${sub.period_start || ''} - ${sub.period_end || ''}`,
    originalTeacher: 'N/A', // TODO: Resolve teacher names
    substituteTeacher: 'N/A' // TODO: Resolve teacher names
  }))

  return {
    bulletinPosts: bulletinPosts.map(post => ({
      id: post.id,
      title: post.title || 'Ankündigung',
      content: post.content || '',
      priority: post.priority || 'normal',
      timestamp: new Date(post.created_at).toLocaleString('de-DE'),
      isExpired: post.expires_at ? new Date(post.expires_at) < new Date() : false
    })),
    substitutions: transformedSubstitutions,
    loading,
    error,
    refresh: loadData
  }
}

// Helper function to format substitution display text
export function formatSubstitutionText(substitution) {
  const { subject, class: className, reason } = substitution
  return `${subject} ${className} - ${reason}`
}
