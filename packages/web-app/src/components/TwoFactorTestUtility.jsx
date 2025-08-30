import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Shield, CheckCircle, XCircle, AlertCircle, Refresh, Monitor } from 'lucide-react'
import {
  checkSecureMFAHealth,
  userRequires2FA,
  userHas2FAEnabled,
  getCurrentUserProfile
} from '../lib/supabase'
import {
  getUserMFAFactors,
  enrollTOTPFactor,
  verifyTOTPEnrollment,
  unenrollMFAFactor
} from '../lib/supabase-mfa'
import { supabase } from '../lib/supabase'

export function TwoFactorTestUtility() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)

  const runHealthCheck = async () => {
    setLoading(true)
    try {
      const health = await checkSecureMFAHealth()
      setHealthStatus(health)
    } catch (error) {
      console.error('Secure MFA health check failed:', error)
      setHealthStatus({ status: 'error', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const runMFAFactorsCheck = async () => {
    setLoading(true)
    try {
      const { factors, error } = await getUserMFAFactors()
      if (error) throw new Error(error.message)

      setUserStats({
        totalFactors: factors.length,
        totpFactors: factors.filter(f => f.factor_type === 'totp').length,
        phoneFactors: factors.filter(f => f.factor_type === 'phone').length,
        verifiedFactors: factors.filter(f => f.status === 'verified').length,
        factors: factors
      })
    } catch (error) {
      console.error('MFA factors check failed:', error)
      setUserStats({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const runSecurityInfoTest = async () => {
    setLoading(true)
    try {
      const userProfile = await getCurrentUserProfile()
      const requires2FA = await userRequires2FA(userProfile)
      const { data: { user } } = await supabase.auth.getUser()
      const has2FA = await userHas2FAEnabled(user)

      setTestResults(prev => ({
        ...prev,
        securityInfo: {
          success: true,
          userRole: userProfile?.role,
          requires2FA,
          has2FA,
          note: 'Device trust is now handled securely by Supabase MFA'
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        securityInfo: {
          success: false,
          error: error.message
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const runRoleCheck = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const profile = await getCurrentUserProfile()
      const requires2FA = await userRequires2FA(profile)
      const has2FA = await userHas2FAEnabled(user)

      setTestResults(prev => ({
        ...prev,
        roleCheck: {
          success: true,
          userEmail: user.email,
          userRole: profile.role || profile.roles?.name,
          requires2FA,
          has2FA,
          deviceTrustNote: 'Device trust handled by Supabase MFA system'
        }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        roleCheck: {
          success: false,
          error: error.message
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const runAllTests = async () => {
    await runHealthCheck()
    await runMFAFactorsCheck()
    await runSecurityInfoTest()
    await runRoleCheck()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'degraded': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Only show in development mode or for admin users
  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 max-h-96 overflow-y-auto shadow-lg border-2 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            2FA System Test Utility
            <Badge variant="outline" className="text-xs">DEV</Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 text-sm">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={runAllTests} 
              disabled={loading}
              size="sm"
              className="flex-1"
            >
              <Refresh className="h-3 w-3 mr-1" />
              Run All Tests
            </Button>
          </div>

          {/* Individual Test Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={runHealthCheck} 
              disabled={loading}
              variant="outline" 
              size="sm"
            >
              Health Check
            </Button>
            <Button 
              onClick={runUserStatsCheck} 
              disabled={loading}
              variant="outline" 
              size="sm"
            >
              User Stats
            </Button>
            <Button 
              onClick={runDeviceFingerprintTest} 
              disabled={loading}
              variant="outline" 
              size="sm"
            >
              Device Test
            </Button>
            <Button 
              onClick={runRoleCheck} 
              disabled={loading}
              variant="outline" 
              size="sm"
            >
              Role Check
            </Button>
          </div>

          {/* Health Status */}
          {healthStatus && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">System Health</span>
                <div className="flex items-center gap-1">
                  {getStatusIcon(healthStatus.status)}
                  <Badge className={getStatusColor(healthStatus.status)}>
                    {healthStatus.status}
                  </Badge>
                </div>
              </div>
              
              {healthStatus.components && (
                <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
                  {Object.entries(healthStatus.components).map(([component, data]) => (
                    <div key={component} className="flex justify-between">
                      <span>{component.replace('_', ' ')}</span>
                      <span className={data.status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                        {data.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {healthStatus.issues?.length > 0 && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  Issues: {healthStatus.issues.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* User Stats */}
          {userStats && !userStats.error && (
            <div className="space-y-2">
              <span className="font-medium">Current User Stats</span>
              <div className="text-xs space-y-1 bg-blue-50 p-2 rounded">
                <div>Email: {userStats.user_email}</div>
                <div>2FA Enabled: {userStats.has_2fa_enabled ? '✓' : '✗'}</div>
                <div>Trusted Devices: {userStats.trusted_devices_count}</div>
                <div>Active: {userStats.active_devices} | Expired: {userStats.expired_devices}</div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="space-y-2">
              <span className="font-medium">Test Results</span>
              
              {testResults.deviceFingerprint && (
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-1 mb-1">
                    <Monitor className="h-3 w-3" />
                    <span className="font-medium">Device Fingerprint</span>
                    {testResults.deviceFingerprint.success ? 
                      <CheckCircle className="h-3 w-3 text-green-600" /> : 
                      <XCircle className="h-3 w-3 text-red-600" />
                    }
                  </div>
                  {testResults.deviceFingerprint.success ? (
                    <div>
                      <div>Device: {testResults.deviceFingerprint.deviceName}</div>
                      <div>Length: {testResults.deviceFingerprint.length} chars</div>
                    </div>
                  ) : (
                    <div className="text-red-600">Error: {testResults.deviceFingerprint.error}</div>
                  )}
                </div>
              )}

              {testResults.roleCheck && (
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-1 mb-1">
                    <Shield className="h-3 w-3" />
                    <span className="font-medium">Role & 2FA Check</span>
                    {testResults.roleCheck.success ? 
                      <CheckCircle className="h-3 w-3 text-green-600" /> : 
                      <XCircle className="h-3 w-3 text-red-600" />
                    }
                  </div>
                  {testResults.roleCheck.success ? (
                    <div>
                      <div>Role: {testResults.roleCheck.userRole}</div>
                      <div>Requires 2FA: {testResults.roleCheck.requires2FA ? '✓' : '✗'}</div>
                      <div>Has 2FA: {testResults.roleCheck.has2FA ? '✓' : '✗'}</div>
                      <div>Device Trusted: {testResults.roleCheck.deviceTrusted ? '✓' : '✗'}</div>
                    </div>
                  ) : (
                    <div className="text-red-600">Error: {testResults.roleCheck.error}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-xs">Running tests...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
