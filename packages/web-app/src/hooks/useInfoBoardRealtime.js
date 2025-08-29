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
      
      // Only show posts from today or posts scheduled to display today
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      const startOfTodayISO = startOfToday.toISOString()
      const endOfTodayISO = endOfToday.toISOString()

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
          created_by,
          display_from
        `)
        .eq('school_id', schoolId)
        .eq('is_public', true)
        .or('expires_at.is.null,expires_at.gte.now()')
        .or(`created_at.gte.${startOfTodayISO},display_from.gte.${startOfTodayISO}`)
        .or(`created_at.lt.${endOfTodayISO},display_from.lt.${endOfTodayISO}`)
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
          status
        `)
        .eq('school_id', schoolId)
        .in('status', ['approved', 'pending'])
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
    subject: 'Vertretung', // Simplified since we don't have lesson details yet
    subjectAbbr: 'V',
    class: 'Verschiedene Klassen',
    room: 'Siehe Details',
    reason: sub.reason || 'Vertretung',
    notes: sub.notes,
    date: sub.valid_until,
    time: 'Siehe Stundenplan',
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
