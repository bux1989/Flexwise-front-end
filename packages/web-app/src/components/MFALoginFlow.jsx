import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { createMFAChallenge, verifyMFAChallenge } from '../lib/supabase-mfa'

/**
 * Component to handle MFA verification during login when user has AAL1 session
 * but needs AAL2 (requires MFA verification)
 */
export function MFALoginFlow({ onComplete, onCancel, requireMFA = false }) {
  const [factors, setFactors] = useState([])
  const [selectedFactor, setSelectedFactor] = useState(null)
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('loading') // loading, select, verify, complete
  const [smsSent, setSmsSent] = useState(false) // Track if any SMS has been sent

  useEffect(() => {
    loadMFAFactors()
  }, [])

  const loadMFAFactors = async () => {
    try {
      setLoading(true)
      setError('')
      
      const { data: sessionData } = await supabase.auth.getSession()
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
      
      if (factorsError) {
        throw factorsError
      }

      console.log('🔐 MFA Login Flow - Session AAL:', sessionData.session?.aal)
      console.log('🔐 MFA Login Flow - Available factors:', factorsData.all.length)

      const verifiedFactors = factorsData.all.filter(f => f.status === 'verified')
      
      if (verifiedFactors.length === 0) {
        setError('No verified MFA factors found. Please set up MFA first.')
        setStep('error')
        return
      }

      // If session is already AAL2 and we don't require MFA, we're done
      if (sessionData.session?.aal === 'aal2' && !requireMFA) {
        console.log('✅ Session is already AAL2, MFA verification complete')
        onComplete && onComplete(sessionData.session)
        return
      }

      setFactors(verifiedFactors)
      
      // Auto-select if only one factor but don't send SMS immediately
      if (verifiedFactors.length === 1) {
        setSelectedFactor(verifiedFactors[0])
        setStep('verify')
        // Don't automatically create challenge - wait for user action
      } else {
        setStep('select')
      }

    } catch (err) {
      console.error('❌ Error loading MFA factors:', err)
      setError(err.message)
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const createChallenge = async (factor) => {
    try {
      setLoading(true)
      setError('')

      console.log('🔐 Creating MFA challenge for factor:', factor.id)

      const challengeData = await createMFAChallenge(factor.id)

      setChallenge({
        id: challengeData.id,
        factorId: factor.id,
        createdAt: Date.now()
      })

      // Mark SMS as sent for phone factors
      if (factor.factor_type === 'phone') {
        setSmsSent(true)
      }

      console.log('✅ MFA challenge created successfully')

    } catch (err) {
      console.error('❌ Error creating MFA challenge:', err)

      // Handle rate limiting with specific messaging
      // Check multiple ways the rate limit error might be indicated
      const isRateLimit = err.isRateLimit ||
                         err.originalError?.isRateLimit ||
                         err.message.includes('you can only request this after') ||
                         err.message.includes('Please wait') ||
                         err.message.includes('seconds before requesting')

      if (isRateLimit) {
        // Extract wait time from error message if not directly available
        let waitTime = err.waitTime || err.originalError?.waitTime

        if (!waitTime && err.message) {
          const match = err.message.match(/(\d+)\s*seconds?/)
          waitTime = match ? parseInt(match[1]) : 60
        }

        setError(`⏱️ ${err.message}`)

        // Clear failed challenge state since the request was rate limited
        setChallenge(null)
        setSmsSent(false)

        // Start countdown
        if (waitTime) {
          console.log('🕐 Starting rate limit countdown:', waitTime + 's')
          startRateLimitCountdown(waitTime)
        }
      } else {
        setError(`Failed to send verification code: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const [rateLimitCountdown, setRateLimitCountdown] = useState(0)

  const startRateLimitCountdown = (seconds) => {
    setRateLimitCountdown(seconds)

    const interval = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setError('') // Clear error when countdown ends
          console.log('⏰ Rate limit countdown ended - ready for new SMS request')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleFactorSelect = async (factor) => {
    setSelectedFactor(factor)
    setStep('verify')
    await createChallenge(factor)
  }

  const handleVerification = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit verification code')
      return
    }

    if (!challenge) {
      setError('No active challenge. Please try again.')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      console.log('🔐 Verifying MFA code for login flow')
      
      const result = await verifyMFAChallenge(challenge.factorId, challenge.id, code.trim())
      
      if (result.success) {
        console.log('✅ MFA verification successful - session elevated to AAL2')
        setStep('complete')

        // Complete immediately since session.aal doesn't exist in this Supabase version
        // The MFA_CHALLENGE_VERIFIED event will be fired automatically
        setTimeout(() => {
          console.log('✅ MFA verification complete, finishing flow')
          onComplete && onComplete(result.session)
        }, 500)
      }
      
    } catch (err) {
      console.error('❌ MFA verification failed:', err)
      
      let errorMessage = err.message
      const challengeAge = challenge.createdAt ? Date.now() - challenge.createdAt : null
      
      if (err.message.includes('Invalid MFA Phone code')) {
        if (challengeAge && challengeAge > 5 * 60 * 1000) {
          errorMessage = 'Verification code has expired. Please request a new one.'
        } else {
          errorMessage = 'Invalid verification code. Please check the code and try again.'
        }
      }
      
      setError(errorMessage)
      
      // If the challenge is old, clear it so user can request new one
      if (challengeAge && challengeAge > 5 * 60 * 1000) {
        setChallenge(null)
        setCode('')
      }
      
    } finally {
      setLoading(false)
    }
  }

  const handleNewCode = async () => {
    if (selectedFactor) {
      setCode('')
      setError('')
      await createChallenge(selectedFactor)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && code.length === 6 && !loading) {
      handleVerification()
    }
  }

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading MFA options...</p>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">❌ {error}</div>
        <button 
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    )
  }

  if (step === 'select') {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Multi-Factor Authentication Required</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please select a verification method to complete your login:
        </p>
        
        <div className="space-y-3">
          {factors.map((factor) => (
            <button
              key={factor.id}
              onClick={() => handleFactorSelect(factor)}
              disabled={loading}
              className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 disabled:opacity-50 flex items-center"
            >
              <div className="mr-3">
                {factor.factor_type === 'phone' ? '📱' : '🔐'}
              </div>
              <div>
                <div className="font-medium">
                  {factor.factor_type === 'phone' ? 'SMS' : 'Authenticator App'}
                </div>
                <div className="text-sm text-gray-500">
                  {factor.factor_type === 'phone' 
                    ? 'Send code to your phone' 
                    : 'Use your authenticator app'
                  }
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel Login
          </button>
        )}
      </div>
    )
  }

  if (step === 'verify') {
    const challengeAge = challenge?.createdAt ? Date.now() - challenge.createdAt : null
    const isOldChallenge = challengeAge && challengeAge > 4 * 60 * 1000

    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Enter Verification Code</h3>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className="mr-2">
              {selectedFactor?.factor_type === 'phone' ? '📱' : '🔐'}
            </div>
            <span className="text-sm text-gray-600">
              {selectedFactor?.factor_type === 'phone'
                ? (smsSent ? 'SMS sent to your phone' : 'Ready to send SMS to your phone')
                : 'Use your authenticator app'
              }
            </span>
          </div>

          {smsSent && challengeAge && (
            <div className="text-xs text-gray-500">
              Code sent {Math.round(challengeAge / 1000)}s ago
            </div>
          )}

          {!smsSent && selectedFactor?.factor_type === 'phone' && (
            <div className="text-xs text-blue-600">
              Click "Send SMS Code" below to receive your verification code
            </div>
          )}
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyPress={handleKeyPress}
            maxLength="6"
            className="w-full px-4 py-3 border rounded-lg text-center font-mono text-lg tracking-widest"
            autoFocus
            disabled={loading}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {isOldChallenge && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm">
            ⚠️ Code is over 4 minutes old and may have expired
          </div>
        )}

        <div className="space-y-3">
          {!smsSent && selectedFactor?.factor_type === 'phone' ? (
            // No SMS sent yet - prioritize sending SMS
            <>
              <button
                onClick={handleNewCode}
                disabled={loading || rateLimitCountdown > 0}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sending SMS...' :
                 rateLimitCountdown > 0 ? `Wait ${rateLimitCountdown}s` :
                 '📱 Send SMS Code'}
              </button>

              <div className="text-xs text-center text-gray-500 px-4">
                SMS charges may apply. You'll receive a 6-digit verification code.
              </div>
            </>
          ) : (
            // SMS sent or non-phone factor - show verification
            <button
              onClick={handleVerification}
              disabled={loading || code.length !== 6 || (!smsSent && selectedFactor?.factor_type === 'phone')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          )}

          {smsSent && selectedFactor?.factor_type === 'phone' && (
            <button
              onClick={handleNewCode}
              disabled={loading || rateLimitCountdown > 0}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Sending...' :
               rateLimitCountdown > 0 ? `Wait ${rateLimitCountdown}s` :
               'Send New Code'}
            </button>
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel Login
            </button>
          )}
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">✅</div>
        <h3 className="text-lg font-semibold mb-2">Verification Complete!</h3>
        <p className="text-sm text-gray-600">
          You are now securely logged in with multi-factor authentication.
        </p>
      </div>
    )
  }

  return null
}
