import React from 'react'
import { Link } from 'react-router-dom'
import { marketingContent } from '../lib/marketingContent'

const nav = marketingContent.navigation
const footer = marketingContent.footer

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--surface-base)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-base font-semibold text-[var(--text-primary)]">{footer.copyright}</p>
          <p>{footer.tagline}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Footer">
          <Link to="/privacy" className="transition hover:text-[var(--text-primary)]">
            {nav.privacy}
          </Link>
          <Link to="/terms" className="transition hover:text-[var(--text-primary)]">
            {nav.terms}
          </Link>
          <Link to="/resources" className="transition hover:text-[var(--text-primary)]">
            {nav.resources}
          </Link>
          <Link to="/contact" className="transition hover:text-[var(--text-primary)]">
            {nav.contact}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
