import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Shield, Smartphone, MessageSquare, ArrowLeft } from 'lucide-react'
import { supabase, addTrustedDevice, logSecurityEvent } from '../lib/supabase'

export function TwoFactorVerification({ 
  user, 
  profile, 
  onSuccess, 
  onBack,
  showRememberDevice = true 
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastAttemptTime, setLastAttemptTime] = useState(null)
  const [isRateLimited, setIsRateLimited] = useState(false)

  const handleVerification = async (e) => {
    e.preventDefault()

    if (!code || code.length !== 6) {
      setError('Bitte geben Sie einen gültigen 6-stelligen Code ein.')
      return
    }

    // Rate limiting check
    const now = Date.now()
    if (lastAttemptTime && (now - lastAttemptTime) < 3000) { // 3 second cooldown
      setError('Bitte warten Sie einen Moment bevor Sie es erneut versuchen.')
      return
    }

    if (retryCount >= 5) {
      setIsRateLimited(true)
      setError('Zu viele Versuche. Bitte warten Sie 5 Minuten oder kontaktieren Sie den Support.')
      return
    }

    setLoading(true)
    setError('')
    setLastAttemptTime(now)

    try {
      console.log('🔒 Verifying 2FA code for user:', user.email)

      // Try SMS verification first (most common)
      let verificationResult = null
      let verificationError = null

      // Check if user has phone number for SMS
      if (user.phone) {
        try {
          const { error: smsError } = await supabase.auth.verifyOtp({
            phone: user.phone,
            token: code,
            type: 'sms'
          })
          
          if (!smsError) {
            console.log('✅ SMS 2FA verification successful')
            await logSecurityEvent('2fa_verification_success', {
              method: 'sms',
              user_email: user.email
            })
            verificationResult = 'sms'
          } else {
            verificationError = smsError
          }
        } catch (err) {
          verificationError = err
        }
      }

      // If SMS failed or not available, try TOTP
      if (!verificationResult) {
        try {
          const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
          
          if (factorsError) {
            throw factorsError
          }

          const totpFactor = factors.totp.find(factor => factor.status === 'verified')
          
          if (totpFactor) {
            const { error: totpError } = await supabase.auth.mfa.verify({
              factorId: totpFactor.id,
              code: code
            })

            if (!totpError) {
              console.log('✅ TOTP 2FA verification successful')
              await logSecurityEvent('2fa_verification_success', {
                method: 'totp',
                user_email: user.email
              })
              verificationResult = 'totp'
            } else {
              verificationError = totpError
            }
          }
        } catch (err) {
          verificationError = err
        }
      }

      // If neither SMS nor TOTP worked, show error
      if (!verificationResult) {
        console.error('❌ 2FA verification failed:', verificationError)
        setRetryCount(prev => prev + 1)

        // Log the failure for security monitoring
        await logSecurityEvent('2fa_verification_failed', {
          user_email: user.email,
          error_message: verificationError?.message || 'Unknown error',
          retry_count: retryCount + 1,
          code_length: code.length
        })

        // Categorize errors for better user guidance
        const errorMessage = verificationError?.message?.toLowerCase() || ''

        if (errorMessage.includes('expired')) {
          setError('⏰ Der Code ist abgelaufen. Bitte fordern Sie einen neuen Code an.')
        } else if (errorMessage.includes('invalid') || errorMessage.includes('wrong')) {
          setError(`❌ Ungültiger Code. Bitte überprüfen Sie den Code und versuchen Sie es erneut. (Versuch ${retryCount + 1}/5)`)
        } else if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
          setError('⚠️ Zu viele Versuche. Bitte warten Sie einen Moment.')
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          setError('🌐 Netzwerkfehler. Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.')
        } else {
          setError(`⚠️ Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut. (Versuch ${retryCount + 1}/5)`)
        }
        return
      }

      // Add device to trusted devices if user chose to remember
      if (rememberDevice && showRememberDevice) {
        try {
          const deviceData = await addTrustedDevice(
            profile.id,
            profile.role || profile.roles?.name,
            profile.school_id
          )
          console.log('✅ Device added to trusted devices')

          // Log device trust event
          await logSecurityEvent('device_trusted', {
            user_email: user.email,
            device_name: deviceData?.device_name || 'Unknown Device',
            trust_duration_days: profile.role?.includes('Admin') ? 30 : 90
          })
        } catch (trustError) {
          console.warn('⚠️ Failed to add device to trusted devices:', trustError)
          await logSecurityEvent('device_trust_failed', {
            user_email: user.email,
            error: trustError?.message || 'Unknown error'
          })
          // Don't fail the login for this
        }
      }

      console.log('🎉 2FA verification complete')

      // Reset retry count on success
      setRetryCount(0)
      setIsRateLimited(false)

      onSuccess({
        method: verificationResult,
        deviceTrusted: rememberDevice
      })

    } catch (error) {
      console.error('💥 2FA verification error:', error)
      setRetryCount(prev => prev + 1)

      // Check if it's a network error for retry suggestion
      if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('fetch')) {
        setError('🌐 Netzwerkfehler. Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.')
      } else {
        setError(`⚠️ Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut. (Versuch ${retryCount + 1}/5)`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Reset rate limiting after 5 minutes
  React.useEffect(() => {
    if (isRateLimited) {
      const timer = setTimeout(() => {
        setIsRateLimited(false)
        setRetryCount(0)
        setError('')
      }, 5 * 60 * 1000) // 5 minutes

      return () => clearTimeout(timer)
    }
  }, [isRateLimited])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex flex-col items-center gap-3">
              <Shield className="h-12 w-12 text-blue-600" />
              <span className="text-xl font-semibold">Zwei-Faktor-Authentifizierung</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App oder SMS ein
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-700">
                Angemeldet als: <strong>{user.email}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {profile.first_name} {profile.last_name} - {profile.role || profile.roles?.name}
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verifizierungscode</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {showRememberDevice && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Checkbox
                    id="remember-device"
                    checked={rememberDevice}
                    onCheckedChange={setRememberDevice}
                    disabled={loading}
                  />
                  <Label htmlFor="remember-device" className="text-sm">
                    Dieses Gerät für 30 Tage vertrauen
                  </Label>
                </div>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Verifizieren...' : 'Verifizieren'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={loading}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zur Anmeldung
                </Button>
              </div>
            </form>

            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">
                Probleme mit der Verifizierung?
              </p>
              <div className="flex justify-center space-x-4 text-xs">
                <span className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  Authenticator-App
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  SMS-Code
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
