import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, getDashboardPath, persistSession, signupSchool } from '../api'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
const otpRegex = /^\d{6,8}$/

export default function SignupSchool() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [schoolCode, setSchoolCode] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = useMemo(() => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedOtp = otp.trim()
    return (
      trimmedName.length > 1 &&
      emailRegex.test(trimmedEmail) &&
      passwordRegex.test(password) &&
      confirmPassword === password &&
      otpRegex.test(trimmedOtp)
    )
  }, [name, email, password, confirmPassword, otp])

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading || !isValid) return

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        otp_code: otp.trim(),
      }
      const data = await signupSchool(payload)
      persistSession(data)
      setPassword('')
      setConfirmPassword('')
      setOtp('')
      setSchoolCode(data?.schoolCode || '')
      const destination = getDashboardPath(data?.role) || '/school'
      const codeMessage = data?.schoolCode ? ` Il tuo Codice Scuola è ${data.schoolCode}.` : ''
      setSuccess(`Registrazione completata!${codeMessage} Ti reindirizzo…`)
      setTimeout(() => {
        navigate(destination, { replace: true })
      }, 1000)
    } catch (err) {
      setPassword('')
      setConfirmPassword('')
      const message = mapSchoolError(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-biwhite via-biwhite to-binavy/10 px-4 py-10 dark:from-[#0a0f1f] dark:via-[#0a0f1f] dark:to-[#001c5e]">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-soft backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <h1 className="text-3xl font-semibold text-center text-binavy dark:text-white">Registra la tua scuola</h1>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-300">
          Inserisci l’OTP ricevuto e crea l’account della sede BI.
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
            {schoolCode && (
              <div className="rounded-lg border border-binavy/20 bg-white px-3 py-2 text-center text-sm font-semibold text-binavy dark:border-white/10 dark:bg-[#152044] dark:text-white">
                Codice Scuola: {schoolCode}
              </div>
            )}
            <Link to="/school" className="font-medium text-emerald-700 underline">
              Vai alla dashboard scuola
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate aria-busy={loading} aria-live="polite">
          <div>
            <label htmlFor="school-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nome Scuola
            </label>
            <input
              id="school-name"
              type="text"
              autoComplete="organization"
              required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200 dark:focus:ring-[#6a87ff] dark:focus:ring-offset-[#0a0f1f]"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="school-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email istituzionale
            </label>
            <input
              id="school-email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200 dark:focus:ring-[#6a87ff] dark:focus:ring-offset-[#0a0f1f]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@istituto.it"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="school-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              id="school-password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200 dark:focus:ring-[#6a87ff] dark:focus:ring-offset-[#0a0f1f]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Minimo 8 caratteri, almeno una lettera e un numero.</p>
          </div>

          <div>
            <label htmlFor="school-confirm-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Conferma password
            </label>
            <input
              id="school-confirm-password"
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
            <label htmlFor="school-otp" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Codice OTP
            </label>
            <input
              id="school-otp"
              type="text"
              inputMode="numeric"
              pattern="\d{6,8}"
              maxLength={8}
              required
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm tracking-[0.4em] text-slate-700 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2 focus:ring-offset-white dark:border-white/10 dark:bg-[#111a33] dark:text-slate-200 dark:focus:ring-[#6a87ff] dark:focus:ring-offset-[#0a0f1f]"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/[^\d]/g, ''))}
              placeholder="000000"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Codice fornito dal supporto BI (6 cifre).</p>
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full rounded-full bg-binavy py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[#001c5e] focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#16348f] dark:focus-visible:ring-[#6a87ff] dark:focus-visible:ring-offset-[#0a0f1f]"
          >
            {loading ? 'Verifica…' : 'Crea account scuola'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          Hai già un account?{' '}
          <Link to="/login" className="font-semibold text-binavy hover:text-bireg focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white dark:hover:text-bireg dark:focus-visible:ring-white/20 dark:focus-visible:ring-offset-[#0a0f1f]">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}

function mapSchoolError(err) {
  if (err instanceof ApiError) {
    const serverMessage = err.payload?.error || err.message
    if (err.status === 400) {
      return serverMessage || 'OTP non valido o già usato.'
    }
    if (err.status === 409) {
      return serverMessage || 'Email scuola già registrata.'
    }
    if (err.status >= 500) {
      return 'Errore server, riprova più tardi.'
    }
    return serverMessage || 'Errore del server. Riprova più tardi.'
  }
  return err?.message || 'Connessione non disponibile.'
}
