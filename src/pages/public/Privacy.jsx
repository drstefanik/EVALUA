import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

const copy = marketingContent.pages.privacy

export default function Privacy() {
  return (
    <PublicPageLayout
      title={copy.title}
      description={copy.intro}
      eyebrow="Policies"
      path="/privacy"
    >
      <section className="space-y-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        {copy.sections.map((section) => (
          <article key={section.title} className="space-y-2 rounded-2xl bg-[var(--surface-alt)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{section.title}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{section.description}</p>
          </article>
        ))}
        <p className="text-xs text-[var(--text-muted)]">
          This summary complements our full documentation shared with partner schools. Contact privacy@evalua.education for detailed agreements.
        </p>
      </section>
    </PublicPageLayout>
  )
}
