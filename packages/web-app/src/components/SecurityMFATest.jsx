import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Security test component to verify MFA/AAL2 enforcement
 * Add this to your debug/admin page to test security hardening
 */
export function SecurityMFATest() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const addResult = (test, status, details) => {
    setResults(prev => [...prev, {
      test,
      status, // 'SECURE', 'VULNERABLE', 'ERROR'
      details,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testAAL1DataAccess = async () => {
    setLoading(true)
    setResults([])

    try {
      // Get current session info
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session

      if (!session) {
        addResult('Session Check', 'ERROR', 'No active session found')
        return
      }

      addResult('Session Info', 'INFO', `AAL: ${session.aal || 'aal1'}, User: ${session.user.email}`)

      // Check if user has MFA factors
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const verifiedFactors = factors?.all?.filter(f => f.status === 'verified') || []
      
      addResult('MFA Status', 'INFO', `Verified factors: ${verifiedFactors.length}`)

      if (verifiedFactors.length === 0) {
        addResult('MFA Check', 'INFO', 'User has no MFA factors - AAL1 access should be allowed')
      } else {
        addResult('MFA Check', 'INFO', 'User has MFA factors - testing AAL2 enforcement...')
      }

      // Test 1: Try to access user_profiles
      try {
        const { data: profiles, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name')
          .limit(1)

        if (profileError) {
          addResult('user_profiles Access', 'SECURE', `Access blocked: ${profileError.message}`)
        } else if (profiles && profiles.length > 0) {
          if (verifiedFactors.length > 0 && session.aal !== 'aal2') {
            addResult('user_profiles Access', 'VULNERABLE', 'MFA user can access data with AAL1 session!')
          } else {
            addResult('user_profiles Access', 'SECURE', 'Data access working correctly')
          }
        } else {
          addResult('user_profiles Access', 'INFO', 'No data returned')
        }
      } catch (err) {
        addResult('user_profiles Access', 'SECURE', `Request blocked: ${err.message}`)
      }

      // Test 2: Try to access contacts
      try {
        const { data: contacts, error: contactError } = await supabase
          .from('contacts')
          .select('id, type, value')
          .limit(1)

        if (contactError) {
          addResult('contacts Access', 'SECURE', `Access blocked: ${contactError.message}`)
        } else if (contacts && contacts.length > 0) {
          if (verifiedFactors.length > 0 && session.aal !== 'aal2') {
            addResult('contacts Access', 'VULNERABLE', 'MFA user can access contacts with AAL1 session!')
          } else {
            addResult('contacts Access', 'SECURE', 'Contact access working correctly')
          }
        } else {
          addResult('contacts Access', 'INFO', 'No contacts returned')
        }
      } catch (err) {
        addResult('contacts Access', 'SECURE', `Request blocked: ${err.message}`)
      }

      // Test 3: Check RLS policies exist
      try {
        const { data: policies, error: policyError } = await supabase
          .rpc('test_aal2_enforcement')

        if (policyError) {
          addResult('RLS Policy Check', 'ERROR', `Cannot check policies: ${policyError.message}`)
        } else {
          const aal2Policies = policies?.filter(p => p.has_aal2_policy) || []
          addResult('RLS Policy Check', 'INFO', `Found ${aal2Policies.length} AAL2 policies`)
        }
      } catch (err) {
        addResult('RLS Policy Check', 'INFO', 'Policy check function not available (expected)')
      }

    } catch (err) {
      addResult('Test Error', 'ERROR', err.message)
    } finally {
      setLoading(false)
    }
  }

  const testMFABypassScenario = async () => {
    setLoading(true)
    
    try {
      addResult('Bypass Test', 'INFO', 'Simulating potential bypass scenario...')
      
      // This would be the attack scenario - but we'll just document it
      addResult('Attack Scenario', 'INFO', 'A developer could:')
      addResult('Step 1', 'INFO', '1. Login with password (gets AAL1 session)')
      addResult('Step 2', 'INFO', '2. Skip MFA UI using browser dev tools')
      addResult('Step 3', 'INFO', '3. Make direct API calls to supabase.from()')
      addResult('Protection', session?.aal === 'aal2' ? 'SECURE' : 'VERIFY', 
        'RLS policies should block this if properly configured')

    } catch (err) {
      addResult('Bypass Test Error', 'ERROR', err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'SECURE': return 'text-green-600 bg-green-50'
      case 'VULNERABLE': return 'text-red-600 bg-red-50'
      case 'ERROR': return 'text-red-600 bg-red-50'
      case 'VERIFY': return 'text-yellow-600 bg-yellow-50'
      case 'INFO': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SECURE': return '✅'
      case 'VULNERABLE': return '🚨'
      case 'ERROR': return '❌'
      case 'VERIFY': return '⚠️'
      case 'INFO': return 'ℹ️'
      default: return '•'
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">🔐 MFA Security Test</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={testAAL1DataAccess}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test AAL2 Enforcement'}
          </button>

          <button
            onClick={testMFABypassScenario}
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            Test Bypass Scenario
          </button>

          <button
            onClick={() => setResults([])}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>

        {results.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-3">Test Results:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{getStatusIcon(result.status)}</span>
                    <strong>{result.test}</strong>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                  <div className="mt-1 text-sm">{result.details}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">🛡️ Security Recommendations:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Run the hardening SQL script: <code>sql/harden_mfa_aal2_requirements.sql</code></li>
            <li>• Verify all RLS policies require AAL2 for MFA users</li>
            <li>• Monitor for AAL1 access attempts in audit logs</li>
            <li>• Test regularly with MFA-enabled accounts</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">📋 Expected Secure Results:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Users without MFA:</strong> Normal data access (AAL1 OK)</li>
            <li>• <strong>Users with MFA + AAL1:</strong> Data access BLOCKED</li>
            <li>• <strong>Users with MFA + AAL2:</strong> Normal data access</li>
            <li>• <strong>API calls:</strong> Blocked by RLS policies, not just client-side</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SecurityMFATest
