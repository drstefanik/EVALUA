import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, getDashboardPath, persistSession, refreshCurrentUser, signupStudent } from '../api'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
const schoolCodeRegex = /^[A-HJ-NP-Z2-9]{8}$/

export default function SignupStudent() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = useMemo(() => {
    const normalizedCode = schoolCode.trim().toUpperCase()
    return (
      fullName.trim().length > 1 &&
      emailRegex.test(email.trim()) &&
      passwordRegex.test(password) &&
      confirmPassword === password &&
      schoolCodeRegex.test(normalizedCode)
    )
  }, [fullName, email, password, confirmPassword, schoolCode])

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading || !isValid) return

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const normalizedCode = schoolCode.trim().toUpperCase()
      if (!schoolCodeRegex.test(normalizedCode)) {
        setError('Invalid School Code')
        setLoading(false)
        return
      }

      const payload = {
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        school_code: normalizedCode,
      }

      const data = await signupStudent(payload)
      persistSession({ ...data, email: email.trim().toLowerCase() })
      try {
        await refreshCurrentUser()
      } catch (refreshError) {
        console.error('Unable to refresh current user', refreshError)
      }
      setPassword('')
      setConfirmPassword('')
      setSchoolCode('')
      const destination = getDashboardPath(data?.role) || '/student'
      const schoolName = data?.schoolName ? ` ${data.schoolName}` : ''
      setSuccess(`Registration completed for school${schoolName}. Redirecting…`)
      setTimeout(() => {
        navigate(destination, { replace: true })
      }, 600)
    } catch (err) {
      setPassword('')
      setConfirmPassword('')
      const message = mapStudentError(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-biwhite via-biwhite to-binavy/10 px-4 py-10 dark:from-[#0a0f1f] dark:via-[#0a0f1f] dark:to-[#001c5e]">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-soft backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <h1 className="text-3xl font-semibold text-center text-binavy dark:text-white">Create your student account</h1>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
          Register with your email. Enter the School Code if you already have it.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-bireg/20 bg-bireg/10 px-4 py-3 text-sm text-bireg"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mt-6 flex flex-col gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
            aria-live="polite"
          >
            <span>{success}</span>
            <Link to="/student" className="font-medium text-emerald-700 underline">
              Go to the student area
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate aria-busy={loading} aria-live="polite">
          <div>
            <label htmlFor="student-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Full name
            </label>
            <input
              id="student-name"
              type="text"
              autoComplete="name"
              required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200 dark:focus:ring-[#6a87ff] dark:focus:ring-offset-[#0a0f1f]"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="student-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="student-email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200 dark:focus:ring-[#6a87ff] dark:focus:ring-offset-[#0a0f1f]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="student-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              id="student-password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200 dark:focus:ring-[#6a87ff] dark:focus:ring-offset-[#0a0f1f]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">At least 8 characters, including one letter and one number.</p>
          </div>

          <div>
            <label htmlFor="student-confirm-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm password
            </label>
            <input
              id="student-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200 dark:focus:ring-[#6a87ff] dark:focus:ring-offset-[#0a0f1f]"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="student-school" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              School Code
            </label>
            <input
              id="student-school"
              type="text"
              autoComplete="off"
              inputMode="text"
              pattern="[A-HJ-NP-Z2-9]{8}"
              maxLength={8}
              required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm uppercase text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200 dark:focus:ring-[#6a87ff] dark:focus:ring-offset-[#0a0f1f]"
              value={schoolCode}
              onChange={(event) =>
                setSchoolCode(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, ''))
              }
              placeholder="E.g. ABCD2345"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Enter the code provided by your school (8 characters, uppercase letters and numbers).
            </p>
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full rounded-full bg-binavy py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[#001c5e] focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#16348f] dark:focus-visible:ring-[#6a87ff] dark:focus-visible:ring-offset-[#0a0f1f]"
          >
            {loading ? 'Verifying…' : 'Create student account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-binavy hover:text-bireg focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white dark:hover:text-bireg dark:focus-visible:ring-white/20 dark:focus-visible:ring-offset-[#0a0f1f]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

function mapStudentError(err) {
  if (err instanceof ApiError) {
    const serverMessage = err.payload?.error || err.message
    if (err.status === 409) {
      return serverMessage || 'Email already registered.'
    }
    if (err.status === 400) {
      return serverMessage || 'Invalid School Code.'
    }
    if (err.status >= 500) {
      return 'Server error, please try again later.'
    }
    return serverMessage || 'Server error. Please try again later.'
  }
  return err?.message || 'Connection unavailable.'
}
