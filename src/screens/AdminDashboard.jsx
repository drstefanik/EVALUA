import React from 'react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Admin dashboard</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          This area is reserved for EVALUA Education administrators. Here you can manage schools and students.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--brand-primary)]">
          <span>Need to leave?</span>
          <Link to="/logout" className="font-semibold underline">
            Logout
          </Link>
        </div>
      </div>
    </div>
  )
}
