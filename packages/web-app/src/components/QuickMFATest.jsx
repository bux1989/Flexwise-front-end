import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function QuickMFATest() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [smsCode, setSmsCode] = useState('')
  const [challengeData, setChallengeData] = useState(null)

  const testSMSEnrollment = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🧪 Starting SMS MFA enrollment test...')
      
      // Step 1: Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      
      console.log('👤 Current user:', user.email, 'Phone:', user.phone)
      
      // Step 2: Check existing MFA factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) throw factorsError
      
      console.log('📋 Existing factors:', factors)
      
      // Step 3: Try to enroll phone for MFA
      const { data: enrollment, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'phone',
        phone: user.phone // Use existing confirmed phone
      })
      
      if (enrollError) {
        console.error('❌ Enrollment error:', enrollError)
        throw enrollError
      }
      
      console.log('✅ Enrollment started:', enrollment)
      
      // Step 4: Check factors again
      const { data: newFactors, error: newFactorsError } = await supabase.auth.mfa.listFactors()
      if (newFactorsError) throw newFactorsError
      
      console.log('📋 New factors after enrollment:', newFactors)
      
      setResult({
        success: true,
        user: {
          email: user.email,
          phone: user.phone,
          phoneConfirmed: !!user.phone_confirmed_at
        },
        oldFactors: factors,
        newFactors: newFactors,
        enrollment: enrollment,
        message: 'SMS MFA enrollment initiated successfully!'
      })
      
    } catch (error) {
      console.error('💥 SMS MFA test failed:', error)
      setResult({
        success: false,
        error: error.message,
        details: error
      })
    } finally {
      setLoading(false)
    }
  }

  const verifySMSCode = async () => {
    if (!smsCode || smsCode.length !== 6) {
      alert('Please enter a 6-digit SMS code')
      return
    }

    if (!challengeData) {
      alert('No active challenge - please request SMS first')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      console.log('🧪 Verifying SMS code:', smsCode)

      // Verify the SMS code
      const { data: verification, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: challengeData.factorId,
        challengeId: challengeData.challengeId,
        code: smsCode
      })

      if (verifyError) throw verifyError

      console.log('✅ SMS verification successful:', verification)

      setResult({
        success: true,
        message: 'SMS MFA verification successful! You now have verified MFA factors.',
        verification: verification,
        nextStep: 'MFA enforcement should now work - try logging out and back in!'
      })

      // Clear the challenge and code
      setChallengeData(null)
      setSmsCode('')

    } catch (error) {
      console.error('💥 SMS verification failed:', error)
      setResult({
        success: false,
        error: error.message,
        details: error
      })
    } finally {
      setLoading(false)
    }
  }

  const testSMSChallenge = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🧪 Testing SMS MFA challenge...')
      
      // Get available factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) throw factorsError
      
      const phoneFactors = factors.all.filter(f => f.factor_type === 'phone')
      if (phoneFactors.length === 0) {
        throw new Error('No phone factors found - need to enroll first')
      }
      
      const phoneFactor = phoneFactors[0]
      console.log('📱 Using phone factor:', phoneFactor)
      
      // Create challenge (this should send SMS)
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: phoneFactor.id
      })
      
      if (challengeError) throw challengeError
      
      console.log('✅ SMS challenge created:', challenge)

      setChallengeData({
        challengeId: challenge.id,
        factorId: phoneFactor.id
      })

      setResult({
        success: true,
        message: 'SMS challenge sent! Check your phone for the code.',
        challenge: challenge,
        factor: phoneFactor,
        instructions: 'Enter the SMS code you received below:'
      })
      
    } catch (error) {
      console.error('💥 SMS challenge failed:', error)
      setResult({
        success: false,
        error: error.message,
        details: error
      })
    } finally {
      setLoading(false)
    }
  }

  if (!import.meta.env.DEV) return null

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80">
      <div className="bg-white border rounded-lg p-4 shadow-lg">
        <h3 className="font-semibold mb-3 text-sm">🧪 Quick SMS MFA Test</h3>
        
        <div className="space-y-2 mb-4">
          <button
            onClick={testSMSEnrollment}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : '📱 Test SMS Enrollment'}
          </button>

          <button
            onClick={testSMSChallenge}
            disabled={loading}
            className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : '💬 Test SMS Challenge'}
          </button>

          {challengeData && (
            <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-xs font-semibold text-yellow-800">SMS Code Received?</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="123456"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength="6"
                  className="flex-1 px-2 py-1 border rounded text-center font-mono text-sm"
                />
                <button
                  onClick={verifySMSCode}
                  disabled={loading || smsCode.length !== 6}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 disabled:opacity-50"
                >
                  ✅ Verify
                </button>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className={`p-3 rounded text-xs ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="font-semibold mb-2">
              {result.success ? '✅ Success' : '❌ Error'}
            </div>
            
            {result.success ? (
              <div className="space-y-1">
                <div>{result.message}</div>
                {result.user && (
                  <div>
                    <div>Email: {result.user.email}</div>
                    <div>Phone: {result.user.phone}</div>
                    <div>Phone Confirmed: {result.user.phoneConfirmed ? '✅' : '❌'}</div>
                  </div>
                )}
                {result.newFactors && (
                  <div>
                    <div>Total Factors: {result.newFactors.all?.length || 0}</div>
                    <div>Phone Factors: {result.newFactors.phone?.length || 0}</div>
                  </div>
                )}
                {result.instructions && (
                  <div className="mt-2 p-2 bg-blue-100 rounded">
                    {result.instructions}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div>Error: {result.error}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
