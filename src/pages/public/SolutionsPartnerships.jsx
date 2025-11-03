import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

const copy = marketingContent.pages.partnerships

export default function SolutionsPartnerships() {
  return (
    <PublicPageLayout
      title={copy.title}
      description={copy.intro}
      eyebrow="Solutions"
      path="/solutions/partnerships"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-3">
        {copy.initiatives.map((initiative) => (
          <div key={initiative.title} className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
            <span className="text-2xl" aria-hidden>
              🤝
            </span>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{initiative.title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{initiative.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Co-design your programme</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            We craft bespoke proposals with impact metrics, funding models, and communications kits so stakeholders can approve projects with confidence.
          </p>
        </div>
      </section>
    </PublicPageLayout>
  )
}
