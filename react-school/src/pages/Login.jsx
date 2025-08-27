import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="geometric-pattern"></div>
        <div className="geometric-pattern-2"></div>
      </div>
      
      <div className="login-card">
        <div className="welcome-section">
          <h1 className="welcome-text">Herzlich willkommen bei</h1>
          
          <div className="logo-section">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F020295f4dae640e8b44edc48cd1c867a%2Fc537084d33954bda931d75d8c7afc864?format=webp&width=800"
              alt="FlexWise - Flexible Tools for Smart Schools"
              className="logo-image"
            />
          </div>
          
          <h2 className="account-heading">Ihr Konto</h2>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your password"
            />
            <div className="forgot-password">
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <div className="error-text">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="signin-button"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <footer className="login-footer">
        <a href="#" className="footer-link">Datenschutz</a>
        <a href="#" className="footer-link">Impressum</a>
      </footer>
    </div>
  )
}
