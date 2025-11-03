import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

const copy = marketingContent.pages.resources

export default function Resources() {
  return (
    <PublicPageLayout
      title={copy.title}
      description={copy.intro}
      eyebrow="Resources"
      path="/resources"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-3">
        {copy.items.map((item) => (
          <article key={item.title} className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
            <span className="text-2xl" aria-hidden>
              📘
            </span>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{item.title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Need a specific template?</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Tell us what you are planning and we will share the most relevant resources for your context.
            </p>
          </div>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-[var(--brand-primary-contrast)] shadow-soft transition hover:opacity-90"
          >
            Contact us
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </PublicPageLayout>
  )
}
