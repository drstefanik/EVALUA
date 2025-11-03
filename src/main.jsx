import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles.css'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './screens/Home.jsx'
import Login from './screens/Login.jsx'
import SignupSchool from './screens/SignupSchool.jsx'
import SignupStudent from './screens/SignupStudent.jsx'
import AdminDashboard from './screens/AdminDashboard.jsx'
import SchoolDashboard from './screens/SchoolDashboard.jsx'
import StudentDashboard from './screens/StudentDashboard.jsx'
import Logout from './screens/Logout.jsx'
import ForgotPassword from './screens/ForgotPassword.jsx'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/signup-school', element: <SignupSchool /> },
      { path: '/signup-student', element: <SignupStudent /> },
      { path: '/logout', element: <Logout /> },
      { path: '/forgot', element: <ForgotPassword /> },
      {
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [{ path: '/admin', element: <AdminDashboard /> }],
      },
      {
        element: <ProtectedRoute allowedRoles={['school']} />,
        children: [{ path: '/school', element: <SchoolDashboard /> }],
      },
      {
        element: <ProtectedRoute allowedRoles={['student']} />,
        children: [{ path: '/student', element: <StudentDashboard /> }],
      },
    ],
  },
])

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
