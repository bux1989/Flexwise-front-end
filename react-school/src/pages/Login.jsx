import { useState } from 'react'
import { handleLogin } from '../lib/supabase'

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-6">
      <div className="bg-white rounded-2xl p-12 shadow-lg max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="text-2xl text-gray-600 mb-6 font-semibold">Herzlich willkommen bei</div>

          <div className="mb-8 flex justify-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F020295f4dae640e8b44edc48cd1c867a%2Fc537084d33954bda931d75d8c7afc864?format=webp&width=800"
              alt="FlexWise - Flexible Tools for Smart Schools"
              className="w-72 h-auto"
            />
          </div>

          <div className="text-xl font-medium text-gray-900">Ihr Konto</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="flex flex-col">
            <label htmlFor="email" className="text-xs font-normal text-gray-600 mb-2">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="password" className="text-xs font-normal text-gray-600 mb-2">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter your password"
              disabled={loading}
            />
            <div className="text-right mt-2">
              <a href="#" className="text-xs text-gray-500 hover:text-blue-500">Forgot password?</a>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <div className="text-xs text-red-600">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white border-none rounded-lg p-3.5 text-sm font-semibold cursor-pointer transition-colors mt-2 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <footer className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-8 sm:static sm:transform-none sm:mt-8 sm:justify-center">
        <a href="#" className="text-xs text-gray-500 hover:text-blue-500">Datenschutz</a>
        <a href="#" className="text-xs text-gray-500 hover:text-blue-500">Impressum</a>
      </footer>
    </div>
  )
}
