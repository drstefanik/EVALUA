import React, { useEffect, useMemo, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'evalua-theme'

export default function ThemeToggle() {
  const prefersDark = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [])

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark') return true
    if (stored === 'light') return false
    return prefersDark
  })
  const [hasUserPreference, setHasUserPreference] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' || stored === 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
    }

    if (hasUserPreference && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
    }
  }, [hasUserPreference, isDark])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const syncWithSystem = (event) => {
      if (!hasUserPreference) {
        setIsDark(event.matches)
      }
    }

    mediaQuery.addEventListener?.('change', syncWithSystem)
    return () => mediaQuery.removeEventListener?.('change', syncWithSystem)
  }, [hasUserPreference])

  const toggleTheme = () => {
    setIsDark((prev) => !prev)
    setHasUserPreference(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, !isDark ? 'dark' : 'light')
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-brand transition hover:border-border-strong hover:bg-surface-muted focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--ring)]"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span className="sr-only">{isDark ? 'Dark theme active' : 'Light theme active'}</span>
      {isDark ? <Moon className="h-5 w-5" strokeWidth={1.75} /> : <Sun className="h-5 w-5" strokeWidth={1.75} />}
    </button>
  )
}
