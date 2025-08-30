// Push test comment - verifying branch sync functionality
import { useState } from 'react'
import { secureLoginWithMFA } from '../../lib/supabase-mfa'
import { BookOpen, GraduationCap, PenTool, Backpack, Apple, Calculator, Globe, Palette } from 'lucide-react'
import { PWAInstallBannerWithInstructions } from '../../components/PWAInstallBanner'
import { SecureTwoFactorVerification } from '../../components/SecureTwoFactorVerification'
import { TwoFactorDebug } from '../../components/TwoFactorDebug'
import { SupabaseMFATest } from '../../components/SupabaseMFATest'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [loginData, setLoginData] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await secureLoginWithMFA(email, password)

      if (result.loginComplete) {
        // Login successful - session established by Supabase
        console.log('✅ Secure login successful:', {
          user: result.user.email,
          sessionId: result.session?.access_token?.substring(0, 20) + '...'
        })

        if (result.needsSetup) {
          // User should set up MFA
          console.log('⚠️ User should set up MFA for enhanced security')
          // Could show a notification or redirect to MFA setup
        }

        // Success - profile/role loading and navigation handled by App.jsx
      } else if (result.needsVerification) {
        // Show MFA verification form with available factors
        console.log('🔒 MFA verification required - available factors:', result.factors.length)
        setLoginData(result)
        setShowTwoFactor(true)
      }

    } catch (err) {
      console.error('💥 Secure login error:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handle2FASuccess = (verificationResult) => {
    console.log('2FA verification successful:', verificationResult)
    setShowTwoFactor(false)
    setLoginData(null)
    // Login complete - App.jsx will handle navigation
  }

  const handle2FABack = () => {
    setShowTwoFactor(false)
    setLoginData(null)
    setError('')
  }

  // Show secure 2FA verification screen if needed
  if (showTwoFactor && loginData) {
    return (
      <SecureTwoFactorVerification
        user={loginData.user}
        factors={loginData.factors}
        onSuccess={handle2FASuccess}
        onBack={handle2FABack}
      />
    )
  }

  return (
    <>
      <PWAInstallBannerWithInstructions />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-fade-in">
      {/* Subtle school-themed background icons */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top left area */}
        <BookOpen className="absolute top-16 left-16 w-16 h-16 text-gray-300/60 rotate-12 animate-float-slow" />
        <PenTool className="absolute top-32 left-32 w-12 h-12 text-gray-400/50 -rotate-6 animate-fall-gentle" />
        <Calculator className="absolute top-24 left-64 w-14 h-14 text-gray-300/60 rotate-45 animate-float-medium" />

        {/* Top right area */}
        <GraduationCap className="absolute top-20 right-20 w-20 h-20 text-gray-300/70 -rotate-12 animate-fall-slow" />
        <Globe className="absolute top-40 right-32 w-16 h-16 text-gray-400/60 rotate-30 animate-float-gentle" />
        <Apple className="absolute top-60 right-16 w-12 h-12 text-gray-400/50 rotate-15 animate-fall-medium" />

        {/* Bottom left area */}
        <Backpack className="absolute bottom-32 left-20 w-18 h-18 text-gray-300/60 rotate-6 animate-float-slow" />
        <Palette className="absolute bottom-16 left-40 w-14 h-14 text-gray-400/50 -rotate-20 animate-fall-gentle" />

        {/* Bottom right area */}
        <BookOpen className="absolute bottom-28 right-28 w-16 h-16 text-gray-300/60 -rotate-30 animate-float-medium" />
        <PenTool className="absolute bottom-12 right-12 w-12 h-12 text-gray-400/50 rotate-45 animate-fall-slow" />

        {/* Center scattered - very subtle */}
        <Calculator className="absolute top-1/3 left-8 w-10 h-10 text-gray-400/40 rotate-12 animate-float-gentle" />
        <Globe className="absolute bottom-1/3 right-8 w-12 h-12 text-gray-400/40 -rotate-12 animate-fall-medium" />
        <Apple className="absolute top-2/3 left-12 w-8 h-8 text-gray-400/40 rotate-30 animate-float-slow" />
        <GraduationCap className="absolute bottom-2/3 right-6 w-10 h-10 text-gray-400/40 -rotate-15 animate-fall-gentle" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-lg text-gray-600 mb-6">Herzlich willkommen bei</div>

            <div className="mb-6 flex justify-center">
              <img
                src="/flexwise-logo-with-tagline.png"
                alt="FlexWise - Flexible Tools for Smart Schools"
                className="w-auto"
                style={{ height: '114px' }}
              />
            </div>

            <div className="text-lg font-medium text-gray-900">Ihr Konto</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                disabled={loading}
              />
              <div className="text-right mt-2">
                <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        {/* Debug component for development */}
        {import.meta.env.DEV && (
          <div className="mt-6 space-y-4">
            <TwoFactorDebug />
            <SupabaseMFATest />
          </div>
        )}

        <div className="text-center">
          <div className="flex justify-center space-x-4">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Datenschutz
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Impressum
            </a>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
