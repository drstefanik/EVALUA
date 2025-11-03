import React from 'react'
import { Link } from 'react-router-dom'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

const copy = marketingContent.pages.solutions

export default function Solutions() {
  return (
    <PublicPageLayout
      title={copy.title}
      description={copy.intro}
      eyebrow="Solutions"
      path="/solutions"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-3">
        {copy.cards.map((card) => (
          <article key={card.title} className="flex h-full flex-col justify-between rounded-2xl bg-[var(--surface-alt)] p-6">
            <div className="space-y-3">
              <span className="text-2xl" aria-hidden>
                💡
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{card.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{card.description}</p>
            </div>
            <Link
              to={card.href}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80"
            >
              Explore
              <span aria-hidden>→</span>
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Integrated operations</h2>
        <div className="mt-4 grid gap-4 text-sm text-[var(--text-secondary)] md:grid-cols-2">
          <p>
            Schools onboard students once, assign them to classes, and access both QuAET benchmarks and certification roadmaps without switching tools.
          </p>
          <p>
            Families receive clear communications and digital materials, while administrators monitor compliance and billing from a single dashboard.
          </p>
        </div>
      </section>
    </PublicPageLayout>
  )
}
