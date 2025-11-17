import React from 'react'
import { createRoot } from 'react-dom/client'
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles/tokens.css'
import './styles/utilities.css'
import './styles.css'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './screens/Home.jsx'
import LoginStudent from './screens/Login.jsx'
import SignupSchool from './screens/SignupSchool.jsx'
import SignupStudent from './screens/SignupStudent.jsx'
import AdminDashboard from './screens/AdminDashboard.jsx'
import SchoolDashboard from './screens/SchoolDashboard.jsx'
import StudentDashboard from './screens/StudentDashboard.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx'
import Schools from './pages/admin/Schools.jsx'
import Logout from './screens/Logout.jsx'
import ForgotPassword from './screens/ForgotPassword.jsx'
import About from './pages/public/About.jsx'
import Quaet from './pages/public/Quaet.jsx'
import Solutions from './pages/public/Solutions.jsx'
import SolutionsTestingPlatform from './pages/public/SolutionsTestingPlatform.jsx'
import SolutionsCertification from './pages/public/SolutionsCertification.jsx'
import SolutionsPartnerships from './pages/public/SolutionsPartnerships.jsx'
import Recognition from './pages/public/Recognition.jsx'
import Resources from './pages/public/Resources.jsx'
import Contact from './pages/public/Contact.jsx'
import Privacy from './pages/public/Privacy.jsx'
import Terms from './pages/public/Terms.jsx'
import Verify from './pages/Verify.jsx'
import AdaptiveTest from './components/AdaptiveTest.jsx'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/about', element: <About /> },
      { path: '/quaet', element: <Quaet /> },
      { path: '/solutions', element: <Solutions /> },
      { path: '/solutions/testing-platform', element: <SolutionsTestingPlatform /> },
      { path: '/solutions/certification', element: <SolutionsCertification /> },
      { path: '/solutions/partnerships', element: <SolutionsPartnerships /> },
      { path: '/recognition', element: <Recognition /> },
      { path: '/resources', element: <Resources /> },
      { path: '/contact', element: <Contact /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/terms', element: <Terms /> },
      { path: '/verify', element: <Verify /> },
      { path: '/login', element: <Navigate to="/login-student" replace /> },
      { path: '/login-student', element: <LoginStudent /> },
      { path: '/signup-school', element: <SignupSchool /> },
      { path: '/signup-student', element: <SignupStudent /> },
      { path: '/logout', element: <Logout /> },
      { path: '/forgot', element: <ForgotPassword /> },

      // ✅ Route pubblica per il test adattivo (Listening + Reading)
      {
        path: '/adaptive-test',
        element: <AdaptiveTest />,
      },

      // ✅ Aree protette
      {
        element: <ProtectedRoute allowedRoles={['admin']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/admin', element: <AdminDashboard /> },
              { path: '/admin/analytics', element: <AdminAnalytics /> },
              { path: '/admin/schools', element: <Schools /> },
            ],
          },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={['school']} />,
        children: [{ path: '/school', element: <SchoolDashboard /> }]
      },
      {
        element: <ProtectedRoute allowedRoles={['student']} />,
        children: [{ path: '/student', element: <StudentDashboard /> }]
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
