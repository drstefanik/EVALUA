import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-alt)] text-[var(--text-primary)]">
      <Navbar />
      <main className="flex-1 bg-hero-sheen">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
