import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

const copy = marketingContent.pages.recognition

export default function Recognition() {
  return (
    <PublicPageLayout
      title={copy.title}
      description={copy.intro}
      eyebrow="Recognition"
      path="/recognition"
    >
      <section className="space-y-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <ol className="space-y-6 border-l border-[var(--border-subtle)] pl-6">
          {copy.timeline.map((item) => (
            <li key={item.year} className="relative pl-6">
              <span className="absolute -left-3 top-1 h-5 w-5 rounded-full border-2 border-[var(--brand-primary)] bg-[var(--surface-base)]" aria-hidden />
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">{item.year}</p>
                <p className="text-base text-[var(--text-secondary)]">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Quality partners</h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          We collaborate with British Institutes, Cambridge University Press & Assessment, and Trinity College London to align our programmes with internationally recognised standards.
        </p>
      </section>
    </PublicPageLayout>
  )
}
