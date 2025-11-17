import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getDashboardPath, getStoredSession } from '../api'

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation()
  const session = getStoredSession()
  const token = session?.token
  const role = session?.role
  const wantsAdmin = allowedRoles?.includes('admin')
  const loginPath = wantsAdmin ? '/login-admin' : '/login-student'

  if (!token) {
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      const fallback = role ? getDashboardPath(role) : loginPath
      return <Navigate to={fallback} replace />
    }
  }

  return <Outlet />
}
