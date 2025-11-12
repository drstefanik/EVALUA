// src/screens/SignupStudent.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, getDashboardPath, persistSession, signupStudent } from '../api'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

export default function SignupStudent() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preselectedSchoolId = params.get('schoolId') || ''

  const [schools, setSchools] = useState([])
  const [schoolId, setSchoolId] = useState(preselectedSchoolId)
  const [schoolName, setSchoolName] = useState('')
  const [resolving, setResolving] = useState(!!preselectedSchoolId)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dateOfBirth, setDob] = useState('')
  const [nationality, setNationality] = useState('')
  const [phone, setPhone] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // carica scuole per dropdown (se non c'è preselected)
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch('/api/schools')
        const j = await r.json()
        setSchools(j.items || [])
        if (preselectedSchoolId) {
          const s = (j.items || []).find(x => x.id === preselectedSchoolId)
          setSchoolName(s?.name || '')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setResolving(false)
      }
    }
    load()
  }, [preselectedSchoolId])

  const isValid = useMemo(() => {
    const baseOk =
      firstName.trim().length > 1 &&
      lastName.trim().length > 1 &&
      emailRegex.test(email.trim()) &&
      passwordRegex.test(password) &&
      confirmPassword === password

    const schoolOk = !!(schoolId || schoolName.trim().length > 1)

    const dobOk = !dateOfBirth || isoDateRegex.test(dateOfBirth) // opzionale ma se presente deve essere ISO
    const phoneOk = !phone || (phone.length >= 7 && phone.length <= 20)

    return baseOk && schoolOk && dobOk && phoneOk
  }, [firstName, lastName, email, password, confirmPassword, schoolId, schoolName, dateOfBirth, phone])

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading || !isValid) return

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        // uno dei due:
        schoolId: schoolId || undefined,
        schoolName: !schoolId ? schoolName.trim() : undefined,
        // nuovi campi
        date_of_birth: dateOfBirth || undefined, // "YYYY-MM-DD"
        nationality: nationality || undefined,
        phone: phone || undefined,
      }

      const data = await signupStudent(payload)
      persistSession(data)
      setPassword(''); setConfirmPassword('')

      const destination = getDashboardPath(data?.role) || '/student'
      const sName = data?.schoolName ? ` ${data.schoolName}` : ''
      setSuccess(`Registration completed for${sName}. Redirecting…`)
      setTimeout(() => navigate(destination, { replace: true }), 600)
    } catch (err) {
      setPassword(''); setConfirmPassword('')
      setError(mapStudentError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-biwhite via-biwhite to-binavy/10 px-4 py-10 dark:from-[#0a0f1f] dark:via-[#0a0f1f] dark:to-[#001c5e]">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-soft backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <h1 className="text-3xl font-semibold text-center text-binavy dark:text-white">Create your student account</h1>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
          Register with your email. Choose your school, then complete your profile.
        </p>

        {error && (
          <div role="alert" className="mt-6 rounded-xl border border-bireg/20 bg-bireg/10 px-4 py-3 text-sm text-bireg">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 flex flex-col gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
            <span>{success}</span>
            <Link to="/student" className="font-medium text-emerald-700 underline">Go to the student area</Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate aria-busy={loading} aria-live="polite">
          {/* School */}
          {preselectedSchoolId ? (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">School</label>
              <div className="mt-1 rounded-xl border border-binavy/30 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200">
                {resolving ? 'Loading…' : (schoolName || preselectedSchoolId)}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">School</label>
              <select
                className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                disabled={loading || !schools.length}
              >
                <option value="">Select your school…</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                If you can’t find your school, type its name here:
              </p>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="School name (optional)"
                disabled={loading}
              />
            </div>
          )}

          {/* Names */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First name</label>
              <input className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200"
                value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={loading}/>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last name</label>
              <input className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200"
                value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={loading}/>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" autoComplete="email" required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" disabled={loading}/>
          </div>

          {/* Passwords */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input type="password" autoComplete="new-password" required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={loading}/>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">At least 8 characters, including one letter and one number.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm password</label>
            <input type="password" autoComplete="new-password" required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={loading}/>
          </div>

          {/* Extra fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date of birth</label>
              <input type="date" value={dateOfBirth} onChange={(e)=>setDob(e.target.value)}
                className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200"
                placeholder="YYYY-MM-DD" disabled={loading}/>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nationality</label>
              <input type="text" value={nationality} onChange={(e)=>setNationality(e.target.value)}
                className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200"
                placeholder="e.g., Italy" disabled={loading}/>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
              <input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200"
                placeholder="+39 333 1234567" disabled={loading}/>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full rounded-full bg-binavy py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[#001c5e] focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#16348f] dark:focus-visible:ring-[#6a87ff] dark:focus-visible:ring-offset-[#0a0f1f]"
          >
            {loading ? 'Creating…' : 'Create student account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-binavy hover:text-bireg">Log in</Link>
        </p>
      </div>
    </div>
  )
}

function mapStudentError(err) {
  if (err instanceof ApiError) {
    const serverMessage = err.payload?.error || err.message
    if (err.status === 409) return serverMessage || 'Email already registered.'
    if (err.status === 400) return serverMessage || 'Missing or invalid fields.'
    if (err.status >= 500) return 'Server error, please try again later.'
    return serverMessage || 'Server error. Please try again later.'
  }
  return err?.message || 'Connection unavailable.'
}
