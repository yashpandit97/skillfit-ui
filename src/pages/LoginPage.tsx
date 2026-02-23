import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { HiLockClosed, HiUser, HiLogin } from 'react-icons/hi'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/authStore'
import './LoginPage.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setToken = useAuthStore((s) => s.setToken)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      setToken(data.access_token)
      navigate('/job')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="loginWrap animateFadeIn">
      <div className="loginCard card">
        <h1 className="loginTitle">AI Resume Intelligence</h1>
        <p className="loginSubtitle">Sign in to build your career diagnostic and ATS resume.</p>
        <form onSubmit={handleLogin}>
          <div className="formGroup">
            <label htmlFor="email">
              <HiUser className="inputIcon" aria-hidden />
              Email or username
            </label>
            <input
              id="email"
              type="text"
              autoComplete="username"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. admin or you@example.com"
            />
          </div>
          <div className="formGroup">
            <label htmlFor="password">
              <HiLockClosed className="inputIcon" aria-hidden />
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error loginError">{error}</p>}
          <button type="submit" className="btn btnPrimary loginSubmit" disabled={loading}>
            <HiLogin className="btnIcon" aria-hidden />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="loginFooter">
          <Link to="/job">Continue as guest</Link> — use API with token for full flow.
        </p>
      </div>
    </div>
  )
}
