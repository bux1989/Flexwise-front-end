import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function MFAPolicyTester() {
  const [testResults, setTestResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const testMFAPolicies = async () => {
    setLoading(true)
    const results = {
      timestamp: new Date().toISOString(),
      sessionInfo: {},
      policyTests: {},
      summary: {
        totalTests: 0,
        blocked: 0,
        allowed: 0
      }
    }

    try {
      // Check current session state
      const { data: { user } } = await supabase.auth.getUser()
      const { data: session } = await supabase.auth.getSession()
      
      results.sessionInfo = {
        authenticated: !!user,
        userEmail: user?.email,
        currentAAL: session.session?.aal || 'none',
        amr: session.session?.amr || [],
        hasSession: !!session.session,
        effectiveAAL: session.session?.aal || (!!user ? 'aal1' : 'none') // Fallback logic
      }

      // Check MFA factors
      try {
        const { data: factors } = await supabase.auth.mfa.listFactors()
        results.sessionInfo.mfaFactors = {
          total: factors?.all?.length || 0,
          verified: factors?.all?.filter(f => f.status === 'verified')?.length || 0,
          hasMFA: factors?.all?.some(f => f.status === 'verified') || false
        }
      } catch (mfaErr) {
        results.sessionInfo.mfaFactors = { error: mfaErr.message }
      }

      if (!user) {
        results.error = 'Please log in first to test MFA policies'
        setTestResults(results)
        setLoading(false)
        return
      }

      // Test ALL MFA-Protected Tables (45 total from comprehensive implementation)
      const criticalTables = [
        'user_profiles', 'contacts', 'profile_info_staff', 'profile_info_student',
        'profile_info_family_member', 'families', 'family_members', 'family_member_child_links',
        'student_absence_notes', 'student_daily_log', 'student_emergency_information',
        'staff_absences', 'staff_documents', 'staff_contracts', 'staff_work_contracts',
        'user_roles', 'protected_roles', 'user_codes',
        'student_pickup_arrangement_overrides', 'student_weekly_pickup_arrangements'
      ]

      // Test Operational Protected Tables
      const operationalTables = [
        'student_attendance_logs', 'lesson_diary_entries', 'bulletin_posts', 'bulletin_post_users',
        'course_notes', 'staff_absence_comments', 'staff_class_links', 'staff_subjects',
        'staff_duty_plan', 'staff_yearly_preferences', 'student_course_wish_choices',
        'student_course_wish_submissions', 'student_presence_events', 'change_log',
        'user_groups', 'user_group_members'
      ]

      // Test Selected Low Priority Protected Tables
      const selectedOperationalTables = [
        'course_applications', 'course_enrollments', 'course_lessons', 'course_list',
        'course_offers', 'course_possible_times', 'course_registration_windows',
        'course_schedules', 'schedule_drafts', 'substitutions'
      ]

      // Test Unprotected Reference Tables (should always work)
      const referenceTables = [
        'structure_schools',
        'roles',
        'subjects',
        'structure_classes'
      ]

      const testTable = async (tableName, category) => {
        try {
          let data, error

          // Special handling for user_profiles - use secure function
          if (tableName === 'user_profiles') {
            const result = await supabase.rpc('get_user_profile', {
              profile_id: user.user_metadata?.profile_id
            })
            data = result.data
            error = result.error
          } else {
            // Regular table access test
            const result = await supabase
              .from(tableName)
              .select('*')
              .limit(1)
            data = result.data
            error = result.error
          }

          const testResult = {
            accessible: !error,
            error: error?.message,
            category,
            expected: category === 'reference' ? 'ALLOWED' :
                     (results.sessionInfo.mfaFactors?.hasMFA &&
                      (results.sessionInfo.currentAAL === 'aal1' || results.sessionInfo.effectiveAAL === 'aal1')) ? 'BLOCKED' : 'ALLOWED'
          }

          testResult.status = testResult.accessible ? 'ALLOWED' : 'BLOCKED'
          testResult.correct = testResult.status === testResult.expected

          results.summary.totalTests++
          if (testResult.status === 'BLOCKED') results.summary.blocked++
          if (testResult.status === 'ALLOWED') results.summary.allowed++

          return testResult
        } catch (err) {
          return {
            accessible: false,
            error: err.message,
            category,
            status: 'ERROR'
          }
        }
      }

      // Run tests on critical tables
      for (const table of criticalTables) {
        results.policyTests[table] = await testTable(table, 'critical')
      }

      // Run tests on operational tables
      for (const table of operationalTables) {
        results.policyTests[table] = await testTable(table, 'operational')
      }

      // Run tests on selected operational tables
      for (const table of selectedOperationalTables) {
        results.policyTests[table] = await testTable(table, 'operational')
      }

      // Run tests on reference tables (should not be protected)
      for (const table of referenceTables) {
        results.policyTests[table] = await testTable(table, 'reference')
      }

      // Calculate policy effectiveness
      const protectedTableTests = Object.entries(results.policyTests)
        .filter(([_, test]) => test.category !== 'reference')

      const correctlyBlocked = protectedTableTests
        .filter(([_, test]) => test.expected === 'BLOCKED' && test.status === 'BLOCKED').length

      const shouldBeBlocked = protectedTableTests
        .filter(([_, test]) => test.expected === 'BLOCKED').length

      results.summary.policyEffectiveness = shouldBeBlocked > 0 ?
        `${correctlyBlocked}/${shouldBeBlocked} tables correctly blocked` :
        'No MFA enforcement expected (no MFA factors or already in AAL2 session)'

      results.summary.securityStatus =
        results.sessionInfo.mfaFactors?.hasMFA &&
        (results.sessionInfo.currentAAL === 'aal1' || results.sessionInfo.effectiveAAL === 'aal1') ?
          (correctlyBlocked === shouldBeBlocked ? 'SECURE' : 'VULNERABLE') :
          'NO_MFA_REQUIRED'

    } catch (error) {
      results.error = error.message
    }

    setTestResults(results)
    setLoading(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'SECURE': return 'bg-green-50 border-green-200 text-green-800'
      case 'VULNERABLE': return 'bg-red-50 border-red-200 text-red-800'
      case 'NO_MFA_REQUIRED': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🔒 MFA Policy Enforcement Tester</h3>
      <p className="text-sm text-gray-600 mb-4">
        Tests if RESTRICTIVE policies are blocking access to protected tables in AAL1 state
      </p>
      
      <button
        onClick={testMFAPolicies}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Testing MFA Policies...' : 'Test MFA Policy Enforcement'}
      </button>

      {testResults && (
        <div className="mt-6">
          {/* Security Status Summary */}
          {testResults.summary.securityStatus && (
            <div className={`p-4 rounded-lg border-2 mb-4 ${getStatusColor(testResults.summary.securityStatus)}`}>
              <div className="font-semibold text-lg mb-2">
                Security Status: {testResults.summary.securityStatus}
              </div>
              <div className="text-sm">
                Session: {testResults.sessionInfo.currentAAL?.toUpperCase()} | 
                MFA Factors: {testResults.sessionInfo.mfaFactors?.verified || 0} | 
                Policy Effectiveness: {testResults.summary.policyEffectiveness}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-600">Total Tests</div>
              <div className="text-xl font-bold">{testResults.summary.totalTests}</div>
            </div>
            <div className="bg-red-50 p-3 rounded border">
              <div className="text-sm text-red-600">Blocked (🔒)</div>
              <div className="text-xl font-bold text-red-800">{testResults.summary.blocked}</div>
            </div>
            <div className="bg-green-50 p-3 rounded border">
              <div className="text-sm text-green-600">Allowed (✅)</div>
              <div className="text-xl font-bold text-green-800">{testResults.summary.allowed}</div>
            </div>
          </div>

          {/* Table Test Results */}
          <div className="space-y-4">
            <h4 className="font-semibold">Table Access Results:</h4>
            
            {Object.entries(testResults.policyTests).map(([tableName, test]) => (
              <div key={tableName} className={`p-3 rounded border ${
                test.status === 'BLOCKED' ? 'bg-red-50 border-red-200' :
                test.status === 'ALLOWED' ? 'bg-green-50 border-green-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{tableName}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      test.category === 'critical' ? 'bg-red-100 text-red-700' :
                      test.category === 'operational' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {test.category}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      test.status === 'BLOCKED' ? 'bg-red-600 text-white' :
                      test.status === 'ALLOWED' ? 'bg-green-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {test.status}
                    </span>
                    {test.correct !== undefined && (
                      <span className="text-lg">
                        {test.correct ? '✅' : '❌'}
                      </span>
                    )}
                  </div>
                </div>
                {test.error && (
                  <div className="text-xs text-gray-600 mt-1">Error: {test.error}</div>
                )}
              </div>
            ))}
          </div>

          {/* Session Details */}
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
              Session Details & Raw Results
            </summary>
            <pre className="bg-white p-4 rounded border text-xs overflow-auto max-h-64 mt-2">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </details>

          {testResults.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {testResults.error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
