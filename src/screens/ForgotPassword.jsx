import React from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-[var(--surface-alt)] px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 text-center shadow-soft">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Forgot your password?</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          You'll soon be able to recover your access directly from here. In the meantime, contact the EVALUA Education support team.
        </p>
        <Link
          to="/login-student"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary-contrast)] transition hover:opacity-90"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
