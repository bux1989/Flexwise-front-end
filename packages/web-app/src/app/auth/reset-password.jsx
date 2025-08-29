import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { BookOpen, GraduationCap, PenTool, Backpack, Apple, Calculator, Globe, Palette, Eye, EyeOff } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Check for access token in URL
  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (accessToken && refreshToken) {
      // Set the session with the tokens from the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
    }
  }, [searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login')
      }, 3000)

    } catch (err) {
      console.error('Password reset error:', err)
      setError(err.message || 'Fehler beim Zurücksetzen des Passworts.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Passwort erfolgreich geändert!</h2>
            <p className="text-gray-600 mb-6">
              Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden automatisch zur Anmeldung weitergeleitet.
            </p>
            <div className="text-sm text-gray-500">
              Weiterleitung in 3 Sekunden...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-fade-in">
      {/* Subtle school-themed background icons */}
      <div className="absolute inset-0 pointer-events-none">
        <BookOpen className="absolute top-16 left-16 w-16 h-16 text-gray-300/60 rotate-12 animate-float-slow" />
        <PenTool className="absolute top-32 left-32 w-12 h-12 text-gray-400/50 -rotate-6 animate-fall-gentle" />
        <Calculator className="absolute top-24 left-64 w-14 h-14 text-gray-300/60 rotate-45 animate-float-medium" />
        <GraduationCap className="absolute top-20 right-20 w-20 h-20 text-gray-300/70 -rotate-12 animate-fall-slow" />
        <Globe className="absolute top-40 right-32 w-16 h-16 text-gray-400/60 rotate-30 animate-float-gentle" />
        <Apple className="absolute top-60 right-16 w-12 h-12 text-gray-400/50 rotate-15 animate-fall-medium" />
        <Backpack className="absolute bottom-32 left-20 w-18 h-18 text-gray-300/60 rotate-6 animate-float-slow" />
        <Palette className="absolute bottom-16 left-40 w-14 h-14 text-gray-400/50 -rotate-20 animate-fall-gentle" />
        <BookOpen className="absolute bottom-28 right-28 w-16 h-16 text-gray-300/60 -rotate-30 animate-float-medium" />
        <PenTool className="absolute bottom-12 right-12 w-12 h-12 text-gray-400/50 rotate-45 animate-fall-slow" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mb-6 flex justify-center">
              <img
                src="/flexwise-logo-with-tagline.png"
                alt="FlexWise - Flexible Tools for Smart Schools"
                className="w-auto"
                style={{ height: '114px' }}
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Neues Passwort setzen</h2>
            <p className="text-gray-600 mt-2">Geben Sie Ihr neues Passwort ein</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Neues Passwort
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Mindestens 6 Zeichen"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort bestätigen
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Passwort wiederholen"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
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
                disabled={loading || !password || !confirmPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Passwort wird geändert...' : 'Passwort ändern'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth/login')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Zurück zur Anmeldung
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
