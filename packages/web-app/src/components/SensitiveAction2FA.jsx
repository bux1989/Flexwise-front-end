import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Shield, AlertTriangle, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function SensitiveAction2FA({ 
  actionTitle,
  actionDescription,
  onSuccess, 
  onCancel,
  user
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerification = async (e) => {
    e.preventDefault()
    
    if (!code || code.length !== 6) {
      setError('Bitte geben Sie einen gültigen 6-stelligen Code ein.')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔒 Verifying 2FA for sensitive action:', actionTitle)

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
            console.log('✅ SMS 2FA verification successful for sensitive action')
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
              console.log('✅ TOTP 2FA verification successful for sensitive action')
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
        console.error('❌ 2FA verification failed for sensitive action:', verificationError)
        
        if (verificationError?.message?.includes('expired')) {
          setError('Der Code ist abgelaufen. Bitte fordern Sie einen neuen Code an.')
        } else if (verificationError?.message?.includes('invalid') || verificationError?.message?.includes('Invalid')) {
          setError('Ungültiger Code. Bitte überprüfen Sie den Code und versuchen Sie es erneut.')
        } else {
          setError('Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.')
        }
        return
      }

      console.log('🎉 Sensitive action 2FA verification complete')
      onSuccess()

    } catch (error) {
      console.error('💥 Sensitive action 2FA verification error:', error)
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <span className="text-lg font-semibold">Sicherheitsverifizierung erforderlich</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="font-medium text-gray-900">{actionTitle}</h3>
            <p className="text-sm text-gray-600">{actionDescription}</p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Aus Sicherheitsgründen ist eine Zwei-Faktor-Authentifizierung erforderlich, 
                  um diese sensible Aktion durchzuführen.
                </span>
              </p>
            </div>
          </div>

          <form onSubmit={handleVerification} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">2FA-Verifizierungscode</Label>
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
              <p className="text-xs text-gray-500 text-center">
                Geben Sie den Code aus Ihrer Authenticator-App oder SMS ein
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {loading ? 'Verifizieren...' : 'Aktion bestätigen'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
