import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getDashboardPath, getStoredSession } from '../api'

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation()
  const session = getStoredSession()
  const token = session?.token
  const role = session?.role

  if (!token) {
    return <Navigate to="/login-student" state={{ from: location }} replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      const fallback = role ? getDashboardPath(role) : '/login-student'
      return <Navigate to={fallback} replace />
    }
  }

  return <Outlet />
}
