import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

const copy = marketingContent.pages.about
const brand = marketingContent.brand

export default function About() {
  return (
    <PublicPageLayout
      title={copy.title}
      description={copy.intro}
      eyebrow={brand.tagline}
      path="/about"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Our mission</h2>
          <p className="text-[var(--text-secondary)]">{brand.mission}</p>
        </div>
        <div className="grid gap-4 rounded-2xl bg-[var(--surface-alt)] p-6">
          <div className="flex items-start gap-3">
            <span className="mt-1 text-xl">📊</span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">350+ campuses supported</p>
              <p className="text-sm text-[var(--text-muted)]">From primary schools to vocational institutes across Italy.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 text-xl">🧪</span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">100K+ assessments delivered</p>
              <p className="text-sm text-[var(--text-muted)]">Digital placement, progress, and mock exams managed end-to-end.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1 text-xl">🎓</span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Thousands of certifications unlocked</p>
              <p className="text-sm text-[var(--text-muted)]">Cambridge and Trinity pathways delivered with personalised support.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Our pillars</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {copy.pillars.map((pillar) => (
            <div key={pillar.title} className="space-y-2 rounded-2xl bg-[var(--surface-alt)] p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{pillar.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{pillar.description}</p>
            </div>
          ))}
        </div>
        <div>
          <a
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-[var(--brand-primary-contrast)] shadow-soft transition hover:opacity-90"
            href="/solutions"
          >
            {copy.cta}
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </PublicPageLayout>
  )
}
