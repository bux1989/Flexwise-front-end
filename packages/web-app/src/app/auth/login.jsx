// Push test comment - verifying branch sync functionality
import { useState } from 'react'
import { handleLogin } from '../../lib/supabase'
import { BookOpen, GraduationCap, PenTool, Backpack, Apple, Calculator, Globe, Palette } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { user } = await handleLogin(email, password)

      // Success - profile/role loading and navigation handled by App.jsx
      console.log('Login successful:', { user: user.email })

    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle school-themed background icons */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top left area */}
        <BookOpen className="absolute top-16 left-16 w-16 h-16 text-gray-300/60 rotate-12" />
        <PenTool className="absolute top-32 left-32 w-12 h-12 text-gray-400/50 -rotate-6" />
        <Calculator className="absolute top-24 left-64 w-14 h-14 text-gray-300/60 rotate-45" />

        {/* Top right area */}
        <GraduationCap className="absolute top-20 right-20 w-20 h-20 text-gray-300/70 -rotate-12" />
        <Globe className="absolute top-40 right-32 w-16 h-16 text-gray-400/60 rotate-30" />
        <Apple className="absolute top-60 right-16 w-12 h-12 text-gray-400/50 rotate-15" />

        {/* Bottom left area */}
        <Backpack className="absolute bottom-32 left-20 w-18 h-18 text-gray-300/60 rotate-6" />
        <Palette className="absolute bottom-16 left-40 w-14 h-14 text-gray-400/50 -rotate-20" />

        {/* Bottom right area */}
        <BookOpen className="absolute bottom-28 right-28 w-16 h-16 text-gray-300/60 -rotate-30" />
        <PenTool className="absolute bottom-12 right-12 w-12 h-12 text-gray-400/50 rotate-45" />

        {/* Center scattered - very subtle */}
        <Calculator className="absolute top-1/3 left-8 w-10 h-10 text-gray-400/40 rotate-12" />
        <Globe className="absolute bottom-1/3 right-8 w-12 h-12 text-gray-400/40 -rotate-12" />
        <Apple className="absolute top-2/3 left-12 w-8 h-8 text-gray-400/40 rotate-30" />
        <GraduationCap className="absolute bottom-2/3 right-6 w-10 h-10 text-gray-400/40 -rotate-15" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-lg text-gray-600 mb-6">Herzlich willkommen bei</div>

            <div className="mb-6 flex justify-center">
              <img
                src="/logo.png"
                alt="FlexWise - Flexible Tools for Smart Schools"
                className="h-16 w-auto"
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
  )
}
