import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, signupAdmin } from '../../api.js'

export default function AdminSignup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = useMemo(() => {
    return (
      fullName.trim().length > 1 &&
      validateEmail(email) &&
      password.trim().length >= 8 &&
      confirmPassword.trim().length >= 8 &&
      secret.trim().length > 0
    )
  }, [confirmPassword, email, fullName, password, secret])

  async function onSubmit(event) {
    event.preventDefault()
    if (loading || !isValid) return

    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        secret: secret.trim(),
      }

      await signupAdmin(payload)
      setSuccessMessage('Admin created. You can now log in.')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-semibold text-slate-900">Admin setup</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a new admin account for Evalua.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            <div className="flex items-center justify-between gap-4">
              <span>{successMessage}</span>
              <Link
                to="/login-admin"
                className="rounded-lg bg-binavy px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#092c36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-binavy"
              >
                Go to login
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate aria-busy={loading}>
          <div>
            <label htmlFor="admin-full-name" className="text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="admin-full-name"
              type="text"
              required
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-1"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Jane Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="admin-email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-1"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="admin-password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-1"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="admin-confirm-password" className="text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="admin-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-1"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-secret" className="text-sm font-medium text-slate-700">
              Secret code
            </label>
            <input
              id="admin-secret"
              type="text"
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-1"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Enter the setup code"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500">
              The owner-provided secret is required to create admin accounts.
            </p>
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full rounded-xl bg-[#0C3C4A] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#092c36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0C3C4A] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating admin…' : 'Create admin'}
          </button>
        </form>
      </div>
    </div>
  )
}

function validateEmail(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(String(value).trim())
}

function getErrorMessage(err) {
  if (err instanceof ApiError) {
    return err.payload?.error || err.message || 'Unable to create the admin.'
  }
  return err?.message || 'Unable to create the admin.'
}
