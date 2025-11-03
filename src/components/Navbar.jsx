import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LayoutDashboard, Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { getStoredSession, getDashboardPath } from '../api'
import { marketingContent } from '../lib/marketingContent'
import evaluaGlobe from '../assets/EVALUA globe.svg' // nuovo logo

const nav = marketingContent.navigation

const primaryLinks = [
  { label: nav.about, to: '/about' },
  { label: nav.quaet, to: '/quaet' },
  {
    label: nav.solutions,
    to: '/solutions',
    children: [
      { label: nav.solutionsTesting, to: '/solutions/testing-platform' },
      { label: nav.solutionsCertification, to: '/solutions/certification' },
      { label: nav.solutionsPartnerships, to: '/solutions/partnerships' }
    ]
  },
  { label: nav.recognition, to: '/recognition' },
  { label: nav.resources, to: '/resources' },
  { label: nav.contact, to: '/contact' }
]

export default function Navbar() {
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
  const [solutionsOpen, setSolutionsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [session, setSession] = useState(null)
  const authMenuRef = useRef(null)
  const solutionsRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const s = getStoredSession?.()
    setSession(s || null)
  }, [])

  useEffect(() => {
    setAuthMenuOpen(false)
    setSolutionsOpen(false)
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onClickOutside(event) {
      if (authMenuOpen && authMenuRef.current && !authMenuRef.current.contains(event.target)) {
        setAuthMenuOpen(false)
      }
      if (solutionsOpen && solutionsRef.current && !solutionsRef.current.contains(event.target)) {
        setSolutionsOpen(false)
      }
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [authMenuOpen, mobileMenuOpen, solutionsOpen])

  const handleDashboard = () => {
    try {
      const path = getDashboardPath?.(session?.role) || '/dashboard'
      navigate(path)
    } catch {
      navigate('/dashboard')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* --- LOGO + Brand --- */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="group flex items-center gap-3 text-lg font-semibold tracking-wide text-[var(--brand-primary)] transition-transform hover:scale-[1.02]"
          >
            <img
              src={evaluaGlobe}
              alt="EVALUA logo"
              className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
            />
            <span className="font-semibold tracking-wide text-[var(--text-primary)]">EVALUA Education</span>
          </Link>

          {/* --- MAIN NAVIGATION --- */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {primaryLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="relative" ref={solutionsRef}>
                  <button
                    type="button"
                    onClick={() => setSolutionsOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--text-primary)] focus-visible:outline-none"
                    aria-expanded={solutionsOpen}
                    aria-haspopup="menu"
                  >
                    {link.label}
                    <ChevronDown className={`h-4 w-4 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {solutionsOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 mt-2 min-w-[220px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-2 shadow-soft"
                    >
                      <Link
                        to={link.to}
                        role="menuitem"
                        className="block rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--brand-muted)]"
                      >
                        {link.label} overview
                      </Link>
                      {link.children.map((child) => (
                        <Link
                          key={child.to}
                          to={child.to}
                          role="menuitem"
                          className="block rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-full px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>

        {/* --- RIGHT MENU (LOGIN / DASHBOARD / THEME) --- */}
        <div className="flex items-center gap-2">
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-primary)]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {session ? (
            <button
              type="button"
              onClick={handleDashboard}
              className="hidden items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary-contrast)] shadow-soft transition hover:opacity-90 lg:inline-flex"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
          ) : (
            <div className="relative hidden lg:block" ref={authMenuRef}>
              <button
                type="button"
                onClick={() => setAuthMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={authMenuOpen}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              >
                Log in / Sign up
                <ChevronDown className={`h-4 w-4 transition-transform ${authMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {authMenuOpen && (
                <div
                  role="menu"
                  aria-label="Access menu"
                  className="absolute right-0 mt-2 w-60 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-2 shadow-soft"
                >
                  <Link to="/signup-school" className="block rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]">
                    School sign-up
                  </Link>
                  <Link to="/signup-student" className="block rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]">
                    Student sign-up
                  </Link>
                  <Link to="/login" className="block rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]">
                    Login
                  </Link>
                </div>
              )}
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div id="mobile-menu" ref={mobileMenuRef} className="lg:hidden">
          <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-base)] px-4 py-4">
            <nav className="space-y-3" aria-label="Mobile">
              {primaryLinks.map((link) => (
                <div key={link.label} className="space-y-2">
                  <Link
                    to={link.to}
                    className="flex items-center justify-between rounded-xl bg-[var(--surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                  >
                    <span>{link.label}</span>
                    {link.children && <ChevronDown className="h-4 w-4" />}
                  </Link>
                  {link.children && (
                    <div className="space-y-2 pl-3">
                      {link.children.map((child) => (
                        <Link
                          key={child.to}
                          to={child.to}
                          className="block rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--brand-muted)] hover:text-[var(--text-primary)]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-6 space-y-3">
              {session ? (
                <button
                  type="button"
                  onClick={handleDashboard}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-[var(--brand-primary-contrast)]"
                >
                  <LayoutDashboard size={18} /> Dashboard
                </button>
              ) : (
                <div className="space-y-2">
                  <Link to="/signup-school" className="block rounded-full border border-[var(--border-subtle)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-primary)]">
                    School sign-up
                  </Link>
                  <Link to="/signup-student" className="block rounded-full border border-[var(--border-subtle)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-primary)]">
                    Student sign-up
                  </Link>
                  <Link to="/login" className="block rounded-full bg-[var(--brand-primary)] px-4 py-3 text-center text-sm font-semibold text-[var(--brand-primary-contrast)]">
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
