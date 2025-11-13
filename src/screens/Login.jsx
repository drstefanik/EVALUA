import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, getDashboardPath, login, persistSession, refreshCurrentUser } from '../api'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login(){
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = useMemo(() => {
    return emailRegex.test(email.trim()) && password.trim().length > 0
  }, [email, password])

  async function onSubmit(event) {
    event.preventDefault()
    if (loading || !isValid) return
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const data = await login({ email: normalizedEmail, password })
      persistSession({ ...data, email: normalizedEmail })
      try {
        await refreshCurrentUser()
      } catch (refreshError) {
        console.error('Unable to refresh current user', refreshError)
      }
      setPassword('')
      const destination = getDashboardPath(data?.role)
      setSuccess('Logged in successfully, redirecting…')
      setTimeout(() => {
        navigate(destination, { replace: true })
      }, 400)
    } catch (err) {
      setPassword('')
      const message = getErrorMessage(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-semibold mb-2 text-center">Log in</h1>
        <p className="text-sm text-slate-500 mb-6 text-center">Enter your credentials to continue.</p>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" aria-live="assertive">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" aria-live="polite">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate aria-busy={loading}>
          <div>
            <label htmlFor="login-email" className="text-sm font-medium text-slate-700">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-1"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</label>
              <Link to="/forgot" className="text-xs text-binavy hover:underline">Forgot password?</Link>
            </div>
            <input
              id="login-password"
              type="password"
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
            className="mt-6 w-full rounded-xl bg-[#0C3C4A] py-3 text-sm font-semibold text-white shadow-sm
             hover:bg-[#092c36] focus-visible:outline-none focus-visible:ring-2
             focus-visible:ring-offset-2 focus-visible:ring-[#0C3C4A]
             disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait…' : 'Log in'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm">
          <p className="text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/signup-school" className="font-medium text-binavy hover:underline">Create a school account</Link>
          </p>
          <p className="text-slate-500">
            Or{' '}
            <Link to="/signup-student" className="font-medium text-binavy hover:underline">create a student account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function getErrorMessage(err) {
  if (err instanceof ApiError) {
    const serverMessage = err.payload?.error || err.message
    if (err.status === 401) {
      return serverMessage || 'Invalid email or password.'
    }
    if (err.status === 423) {
      return serverMessage || 'User disabled. Contact support.'
    }
    return serverMessage || 'Server error. Please try again later.'
  }
  return err?.message || 'Connection unavailable.'
}
