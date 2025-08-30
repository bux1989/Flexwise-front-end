import { useState, useEffect } from 'react'
import { createMFAChallenge, verifyMFAChallenge } from '../lib/supabase-mfa'
import { ArrowLeft, Shield, Smartphone, Key } from 'lucide-react'

export function SecureTwoFactorVerification({ user, factors, onSuccess, onBack }) {
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedFactor, setSelectedFactor] = useState(null)
  const [challenge, setChallenge] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  // Auto-select first factor if only one available
  useEffect(() => {
    if (factors && factors.length === 1) {
      setSelectedFactor(factors[0])
    }
  }, [factors])

  // Create challenge when factor is selected
  useEffect(() => {
    if (selectedFactor && !challenge) {
      createChallenge()
    }
  }, [selectedFactor])

  const createChallenge = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🔐 Creating MFA challenge for factor:', selectedFactor.id)
      const challengeData = await createMFAChallenge(selectedFactor.id)
      setChallenge(challengeData)
      
      if (selectedFactor.factor_type === 'phone') {
        console.log('📱 SMS sent to phone')
      }
      
    } catch (err) {
      console.error('❌ Challenge creation failed:', err)
      setError('Failed to create verification challenge. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (e) => {
    e.preventDefault()
    
    if (!verificationCode.trim()) {
      setError('Please enter the verification code')
      return
    }

    if (!selectedFactor || !challenge) {
      setError('No verification challenge available. Please try again.')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔐 Verifying MFA code')
      
      const result = await verifyMFAChallenge(
        selectedFactor.id,
        challenge.id,
        verificationCode.trim()
      )

      if (result.success) {
        console.log('✅ MFA verification successful - secure session established')
        onSuccess(result)
      }

    } catch (err) {
      console.error('❌ MFA verification failed:', err)
      setRetryCount(prev => prev + 1)
      
      if (retryCount >= 2) {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Invalid verification code. Please check and try again.')
      }
      
      setVerificationCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setError('')
    setVerificationCode('')
    setChallenge(null)
    setSelectedFactor(null)
    onBack()
  }

  const handleRetry = () => {
    setError('')
    setVerificationCode('')
    setChallenge(null)
    setRetryCount(0)
    // Will trigger challenge creation via useEffect
  }

  const getFactorIcon = (factorType) => {
    switch (factorType) {
      case 'totp':
        return <Key className="w-5 h-5" />
      case 'phone':
        return <Smartphone className="w-5 h-5" />
      default:
        return <Shield className="w-5 h-5" />
    }
  }

  const getFactorLabel = (factor) => {
    switch (factor.factor_type) {
      case 'totp':
        return factor.friendly_name || 'Authenticator App'
      case 'phone':
        return `SMS to ${factor.phone || 'your phone'}`
      default:
        return 'Two-Factor Authentication'
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-600">
              Secure your account with an additional verification step
            </p>
          </div>

          {/* Factor Selection */}
          {!selectedFactor && factors && factors.length > 1 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Choose verification method:
              </h3>
              {factors.map((factor) => (
                <button
                  key={factor.id}
                  onClick={() => setSelectedFactor(factor)}
                  className="w-full flex items-center p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getFactorIcon(factor.factor_type)}
                    <span className="text-left">
                      <div className="font-medium text-gray-900">
                        {getFactorLabel(factor)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {factor.factor_type === 'totp' ? 'Use your authenticator app' : 'Receive SMS code'}
                      </div>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Factor Info */}
          {selectedFactor && (
            <div className="mb-6">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                {getFactorIcon(selectedFactor.factor_type)}
                <div>
                  <div className="font-medium text-blue-900">
                    {getFactorLabel(selectedFactor)}
                  </div>
                  <div className="text-sm text-blue-700">
                    {selectedFactor.factor_type === 'totp' 
                      ? 'Enter the 6-digit code from your authenticator app'
                      : 'Enter the code sent to your phone'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Form */}
          {selectedFactor && challenge && (
            <form onSubmit={handleVerification} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-xl tracking-widest font-mono"
                  disabled={loading}
                  autoComplete="one-time-code"
                  maxLength="6"
                  autoFocus
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={loading || !verificationCode || verificationCode.length < 6}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>

              {selectedFactor.factor_type === 'phone' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
                  >
                    Didn't receive the code? Resend SMS
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Loading State */}
          {selectedFactor && !challenge && loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {selectedFactor.factor_type === 'phone' ? 'Sending SMS...' : 'Preparing verification...'}
              </p>
            </div>
          )}

        </div>

        {/* Security Note */}
        <div className="text-center text-sm text-gray-500">
          <p>
            This additional security step protects your account from unauthorized access.
          </p>
        </div>
      </div>
    </div>
  )
}
