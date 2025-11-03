import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession } from '../api'

export default function Logout() {
  const navigate = useNavigate()

  useEffect(() => {
    clearSession()
    const timeout = setTimeout(() => {
      navigate('/', { replace: true })
    }, 200)
    return () => clearTimeout(timeout)
  }, [navigate])

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow">Signing you out…</p>
    </div>
  )
}
