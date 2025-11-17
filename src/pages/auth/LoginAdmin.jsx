import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, loginAdmin, persistSession } from '../../api.js'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginAdmin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = useMemo(() => {
    return emailRegex.test(email.trim()) && password.trim().length > 0
  }, [email, password])

  async function onSubmit(event) {
    event.preventDefault()
    if (loading || !isValid) return
    setError('')
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const data = await loginAdmin({ email: normalizedEmail, password })

      persistSession({
        token: data?.token,
        role: data?.user?.role || 'admin',
        id: data?.user?.id,
        name: data?.user?.name,
        email: data?.user?.email || normalizedEmail,
      })

      if (data?.user) {
        localStorage.setItem('binext_user', JSON.stringify(data.user))
        localStorage.setItem('binext_role', data.user.role || 'admin')
      }

      setPassword('')
      navigate('/admin', { replace: true })
    } catch (err) {
      setPassword('')
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-semibold mb-2 text-center">Admin login</h1>
        <p className="text-sm text-slate-500 mb-6 text-center">
          Access the admin dashboard to manage Evalua.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate aria-busy={loading}>
          <div>
            <label htmlFor="login-admin-email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="login-admin-email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-1"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="login-admin-password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-xs text-binavy hover:underline"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="login-admin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-1"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="mt-6 w-full rounded-xl bg-[#0C3C4A] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#092c36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0C3C4A] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

function getErrorMessage(err) {
  if (err instanceof ApiError) {
    const message = err.payload?.error || err.message
    if (err.status === 401 || err.status === 400) {
      return message || 'Invalid email or password.'
    }
    if (err.status === 403) {
      return message || 'Admin account is not active.'
    }
    return message || 'Server error. Please try again later.'
  }
  return err?.message || 'Connection unavailable.'
}
