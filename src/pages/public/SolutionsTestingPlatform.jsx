import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

const copy = marketingContent.pages.testingPlatform

export default function SolutionsTestingPlatform() {
  return (
    <PublicPageLayout
      title={copy.title}
      description={copy.intro}
      eyebrow="Solutions"
      path="/solutions/testing-platform"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-3">
        {copy.sections.map((section) => (
          <div key={section.title} className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
            <span className="text-2xl" aria-hidden>
              🛰️
            </span>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{section.title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{section.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Launch pilot testing in days</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Our onboarding specialists migrate existing data, customise rubrics, and train teachers so your first testing window ships smoothly.
            </p>
          </div>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-accent)] px-6 py-3 text-sm font-semibold text-[var(--brand-accent-contrast)] shadow-soft transition hover:opacity-90"
          >
            {copy.cta}
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </PublicPageLayout>
  )
}
