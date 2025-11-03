import React from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-3xl font-semibold text-slate-900">Forgot your password?</h1>
        <p className="mt-3 text-sm text-slate-600">
          You'll soon be able to recover your access directly from here. In the meantime, contact the BI Next support team.
        </p>
        <Link to="/login" className="mt-6 inline-flex items-center justify-center rounded-xl bg-binavy px-4 py-2 text-sm font-semibold text-white">
          Back to login
        </Link>
      </div>
    </div>
  )
}
