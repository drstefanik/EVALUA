import React, { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface-alt)] text-[var(--text-primary)]">
      <Navbar />
      <main className="flex-1">
        {/* fallback leggero mentre carichi le pagine (o il test) */}
        <Suspense fallback={<div className="p-6">Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
