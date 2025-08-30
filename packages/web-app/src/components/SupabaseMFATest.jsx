import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function SupabaseMFATest() {
  const [testResults, setTestResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const testMFAEnforcement = async () => {
    setLoading(true)
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    }

    try {
      // Test 1: Check Supabase Auth configuration
      const { data: { user } } = await supabase.auth.getUser()
      results.tests.currentUser = {
        authenticated: !!user,
        email: user?.email,
        aal: user?.aal // Authentication Assurance Level
      }

      if (!user) {
        results.error = 'Please log in first to test MFA enforcement'
        setTestResults(results)
        setLoading(false)
        return
      }

      // Test 2: Check MFA factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      results.tests.mfaFactors = {
        error: factorsError?.message,
        totalFactors: factors?.all?.length || 0,
        verifiedFactors: factors?.all?.filter(f => f.status === 'verified')?.length || 0,
        totpFactors: factors?.totp?.length || 0,
        phoneFactors: factors?.phone?.length || 0,
        factorDetails: factors?.all?.map(f => ({
          id: f.id,
          type: f.factor_type,
          status: f.status,
          friendlyName: f.friendly_name
        }))
      }

      // Test 3: Check current session AAL
      const { data: session } = await supabase.auth.getSession()
      results.tests.sessionAAL = {
        hasSession: !!session.session,
        aal: session.session?.aal,
        amr: session.session?.amr, // Authentication Method Reference
        mfaRequired: session.session?.aal === 'aal1' && factors?.all?.some(f => f.status === 'verified')
      }

      // Test 4: Simulate MFA challenge if factors exist
      if (factors?.all?.some(f => f.status === 'verified')) {
        try {
          const verifiedFactor = factors.all.find(f => f.status === 'verified')
          const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: verifiedFactor.id
          })
          
          results.tests.mfaChallenge = {
            success: !challengeError,
            error: challengeError?.message,
            challengeId: challenge?.id,
            factorType: verifiedFactor.factor_type
          }
        } catch (challengeErr) {
          results.tests.mfaChallenge = {
            success: false,
            error: challengeErr.message
          }
        }
      }

      // Test 5: Check if Supabase enforces MFA
      const enforcementCheck = {
        hasVerifiedMFA: factors?.all?.some(f => f.status === 'verified'),
        sessionAAL: session.session?.aal,
        shouldRequireMFA: false
      }

      if (enforcementCheck.hasVerifiedMFA && enforcementCheck.sessionAAL === 'aal1') {
        enforcementCheck.shouldRequireMFA = true
        enforcementCheck.enforcement = 'WEAK - User can access with AAL1 despite having MFA'
      } else if (enforcementCheck.hasVerifiedMFA && enforcementCheck.sessionAAL === 'aal2') {
        enforcementCheck.enforcement = 'STRONG - User completed MFA (AAL2)'
      } else {
        enforcementCheck.enforcement = 'NO MFA - User has no verified factors'
      }

      results.tests.enforcementCheck = enforcementCheck

    } catch (error) {
      results.error = error.message
      results.errorStack = error.stack
    }

    setTestResults(results)
    setLoading(false)
  }

  const getEnforcementStatus = () => {
    if (!testResults?.tests?.enforcementCheck) return null
    
    const check = testResults.tests.enforcementCheck
    if (check.shouldRequireMFA && check.sessionAAL === 'aal1') {
      return { status: 'VULNERABLE', color: 'red', message: 'MFA can be bypassed!' }
    } else if (check.hasVerifiedMFA && check.sessionAAL === 'aal2') {
      return { status: 'SECURE', color: 'green', message: 'MFA properly enforced' }
    } else {
      return { status: 'NO MFA', color: 'yellow', message: 'No MFA factors enrolled' }
    }
  }

  const enforcementStatus = getEnforcementStatus()

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Supabase MFA Enforcement Test</h3>
      
      <button
        onClick={testMFAEnforcement}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing MFA Enforcement...' : 'Test Supabase MFA Configuration'}
      </button>

      {enforcementStatus && (
        <div className={`mt-4 p-4 rounded-lg border-2 ${
          enforcementStatus.color === 'red' ? 'bg-red-50 border-red-200 text-red-800' :
          enforcementStatus.color === 'green' ? 'bg-green-50 border-green-200 text-green-800' :
          'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="font-semibold text-lg">{enforcementStatus.status}</div>
          <div>{enforcementStatus.message}</div>
        </div>
      )}

      {testResults && (
        <div className="mt-6">
          <h4 className="font-semibold text-green-700 mb-2">Detailed Test Results:</h4>
          <pre className="bg-white p-4 rounded border text-xs overflow-auto max-h-96">
            {JSON.stringify(testResults, null, 2)}
          </pre>

          {testResults.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {testResults.error}
            </div>
          )}

          {/* Configuration Recommendations */}
          {testResults.tests?.enforcementCheck?.shouldRequireMFA && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h5 className="font-semibold text-blue-800 mb-2">⚙️ Configuration Required:</h5>
              <div className="text-blue-700 text-sm space-y-1">
                <div>1. Enable "Require MFA for password sign-ins" in Supabase Auth settings</div>
                <div>2. Set up Auth Hooks to enforce AAL2 for users with MFA factors</div>
                <div>3. Configure session policies to block AAL1 when MFA is available</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
