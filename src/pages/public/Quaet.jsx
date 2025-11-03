import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

const copy = marketingContent.pages.quaet

export default function Quaet() {
  return (
    <PublicPageLayout
      title={copy.title}
      description={copy.intro}
      eyebrow="QuAET"
      path="/quaet"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">What it measures</h2>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            {copy.pillars.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 text-lg">✅</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 rounded-2xl bg-[var(--surface-alt)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">How schools use QuAET</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Coordinators align lesson plans with the calendar of QuAET checks, while teachers review item analysis and plan catch-up clinics for learners who need extra practice.
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Leadership teams benchmark campuses in the same network and allocate resources to close performance gaps earlier.
          </p>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Outcomes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {copy.outcomes.map((item) => (
            <div key={item} className="space-y-2 rounded-2xl bg-[var(--surface-alt)] p-6">
              <span className="text-2xl" aria-hidden>
                📈
              </span>
              <p className="text-sm text-[var(--text-secondary)]">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicPageLayout>
  )
}
