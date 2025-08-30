import { useState } from 'react'
import {
  userRequires2FA,
  userHas2FAEnabled,
  getCurrentUserProfile,
  supabase
} from '../lib/supabase'
import { getUserMFAFactors } from '../lib/supabase-mfa'

export function TwoFactorDebug() {
  const [debugResults, setDebugResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const runDebugCheck = async () => {
    setLoading(true)
    const results = {
      timestamp: new Date().toISOString(),
      steps: {}
    }

    try {
      // Step 1: Check current user
      const { data: { user } } = await supabase.auth.getUser()
      results.steps.currentUser = {
        exists: !!user,
        email: user?.email,
        metadata: user?.user_metadata
      }

      if (!user) {
        results.error = 'No authenticated user found'
        setDebugResults(results)
        setLoading(false)
        return
      }

      // Step 2: Get user profile
      const userProfile = await getCurrentUserProfile()
      results.steps.userProfile = {
        exists: !!userProfile,
        id: userProfile?.id,
        role: userProfile?.role,
        directRole: userProfile?.roles?.name,
        firstName: userProfile?.first_name,
        lastName: userProfile?.last_name
      }

      if (!userProfile) {
        results.error = 'Failed to load user profile'
        setDebugResults(results)
        setLoading(false)
        return
      }

      // Step 3: Check if user requires 2FA
      const requires2FA = await userRequires2FA(userProfile)
      results.steps.requires2FA = {
        result: requires2FA,
        userRole: userProfile?.role,
        directRole: userProfile?.roles?.name
      }

      // Step 4: Check if user has 2FA enabled (if they require it)
      if (requires2FA) {
        const has2FA = await userHas2FAEnabled(user)
        results.steps.has2FA = {
          result: has2FA,
          userEmail: user.email,
          phone: user.phone,
          phoneConfirmed: user.phone_confirmed_at
        }

        // Get MFA factors for more detail
        try {
          const { data: factors, error: mfaError } = await supabase.auth.mfa.listFactors()
          results.steps.mfaFactors = {
            error: mfaError?.message,
            totpCount: factors?.totp?.length || 0,
            phoneCount: factors?.phone?.length || 0,
            totpFactors: factors?.totp?.map(f => ({
              id: f.id,
              status: f.status,
              friendlyName: f.friendly_name
            })),
            phoneFactors: factors?.phone?.map(f => ({
              id: f.id,
              status: f.status,
              phone: f.phone
            }))
          }
        } catch (mfaErr) {
          results.steps.mfaFactors = { error: mfaErr.message }
        }

        // Step 5: Check Supabase MFA factors (replaces custom device trust)
        if (has2FA) {
          try {
            const { factors, error: factorsError } = await getUserMFAFactors()
            results.steps.supabaseMFAFactors = {
              error: factorsError?.message,
              totalFactors: factors?.length || 0,
              totpFactors: factors?.filter(f => f.factor_type === 'totp')?.length || 0,
              phoneFactors: factors?.filter(f => f.factor_type === 'phone')?.length || 0,
              verifiedFactors: factors?.filter(f => f.status === 'verified')?.length || 0,
              factorDetails: factors?.map(f => ({
                id: f.id,
                type: f.factor_type,
                status: f.status,
                friendlyName: f.friendly_name,
                phone: f.phone
              }))
            }
          } catch (factorsErr) {
            results.steps.supabaseMFAFactors = { error: factorsErr.message }
          }

          // Note: Device trust is now handled server-side by Supabase
          results.steps.deviceTrustNote = {
            message: "Device trust is now handled securely by Supabase's built-in MFA system",
            security: "Server-side enforcement prevents client-side bypass"
          }
        }
      }

      // Step 6: Check user roles table for additional admin roles
      try {
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*, roles(name)')
          .eq('user_profile_id', userProfile.id)

        results.steps.userRolesQuery = {
          error: rolesError?.message,
          count: userRoles?.length || 0,
          roles: userRoles?.map(ur => ({
            roleName: ur.roles?.name,
            roleId: ur.role_id
          }))
        }
      } catch (rolesErr) {
        results.steps.userRolesQuery = { error: rolesErr.message }
      }

      // Step 7: Test table access
      try {
        const { data: tableTest, error: tableError } = await supabase
          .from('user_trusted_devices')
          .select('count(*)')
          .limit(1)

        results.steps.tableAccess = {
          accessible: !tableError,
          error: tableError?.message
        }
      } catch (tableErr) {
        results.steps.tableAccess = {
          accessible: false,
          error: tableErr.message
        }
      }

    } catch (error) {
      results.error = error.message
      results.errorStack = error.stack
    }

    setDebugResults(results)
    setLoading(false)
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">2FA Debug Information</h3>
      
      <button
        onClick={runDebugCheck}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running Debug Check...' : 'Run 2FA Debug Check'}
      </button>

      {debugResults && (
        <div className="mt-6">
          <h4 className="font-semibold text-green-700 mb-2">Debug Results:</h4>
          <pre className="bg-white p-4 rounded border text-xs overflow-auto max-h-96">
            {JSON.stringify(debugResults, null, 2)}
          </pre>

          {debugResults.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <strong>Error:</strong> {debugResults.error}
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 space-y-2">
            <h5 className="font-semibold">Quick Summary:</h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>User Authenticated: {debugResults.steps.currentUser?.exists ? '✅' : '❌'}</div>
              <div>Profile Loaded: {debugResults.steps.userProfile?.exists ? '✅' : '❌'}</div>
              <div>Requires 2FA: {debugResults.steps.requires2FA?.result ? '✅' : '❌'}</div>
              <div>Has 2FA Setup: {debugResults.steps.has2FA?.result ? '✅' : '❌'}</div>
              <div>MFA Factors: {debugResults.steps.supabaseMFAFactors?.totalFactors || 0}</div>
              <div>Secure Device Trust: ✅ Server-side</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
