import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MFALoginFlow } from './MFALoginFlow'

/**
 * Guard component that checks if MFA verification is required
 * and presents the MFA flow when needed
 */
export function MFAGuard({ children, user, onMFAComplete }) {
  const [mfaRequired, setMfaRequired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      checkMFARequirement()
    } else {
      setLoading(false)
      setMfaRequired(false)
    }
  }, [user])

  const checkMFARequirement = async () => {
    try {
      setLoading(true)
      setError('')

      // Get current session and factors
      const [sessionResult, factorsResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.mfa.listFactors()
      ])

      const { data: sessionData } = sessionResult
      const { data: factorsData, error: factorsError } = factorsResult

      if (factorsError) {
        console.error('❌ Error checking MFA factors:', factorsError)
        // Don't block access if we can't check factors
        setMfaRequired(false)
        setLoading(false)
        return
      }

      const session = sessionData.session
      const verifiedFactors = factorsData.all.filter(f => f.status === 'verified')

      console.log('🔒 MFA Guard check:', {
        sessionAAL: session?.aal,
        verifiedFactors: verifiedFactors.length,
        userEmail: user?.email
      })

      // If user has verified MFA factors but session is AAL1, require MFA
      if (verifiedFactors.length > 0 && session && session.aal !== 'aal2') {
        console.log('🔒 MFA verification required - user has verified factors but AAL1 session')
        setMfaRequired(true)
      } else {
        console.log('✅ MFA not required or already satisfied')
        setMfaRequired(false)
      }

    } catch (err) {
      console.error('💥 Error checking MFA requirement:', err)
      setError(err.message)
      // Don't block access on errors
      setMfaRequired(false)
    } finally {
      setLoading(false)
    }
  }

  const handleMFAComplete = async (session) => {
    console.log('✅ MFA verification completed, session AAL:', session?.aal)
    setMfaRequired(false)
    
    // Notify parent component if needed
    if (onMFAComplete) {
      onMFAComplete(session)
    }
    
    // Trigger a re-check to ensure everything is properly set
    setTimeout(() => {
      checkMFARequirement()
    }, 1000)
  }

  const handleMFACancel = async () => {
    console.log('🚫 MFA verification cancelled, signing out user')
    
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking security requirements...</p>
        </div>
      </div>
    )
  }

  // Show error state (but don't block)
  if (error) {
    console.error('MFA Guard error:', error)
    // Log error but don't block access
    return children
  }

  // Show MFA flow if required
  if (mfaRequired && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-4 text-center">
              <h2 className="text-xl font-semibold">Security Verification</h2>
              <p className="text-sm opacity-90 mt-1">
                Additional verification required to continue
              </p>
            </div>
            
            <MFALoginFlow 
              onComplete={handleMFAComplete}
              onCancel={handleMFACancel}
              requireMFA={true}
            />
          </div>
        </div>
      </div>
    )
  }

  // Allow access - no MFA required or already satisfied
  return children
}
