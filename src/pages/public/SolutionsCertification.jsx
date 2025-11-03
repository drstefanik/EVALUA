import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

const copy = marketingContent.pages.certification

export default function SolutionsCertification() {
  return (
    <PublicPageLayout
      title={copy.title}
      description={copy.intro}
      eyebrow="Solutions"
      path="/solutions/certification"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-3">
        {copy.highlights.map((highlight) => (
          <div key={highlight} className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
            <span className="text-2xl" aria-hidden>
              🎯
            </span>
            <p className="text-sm text-[var(--text-secondary)]">{highlight}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">From diagnostic to celebration</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Students receive progress trackers and speaking feedback, while families access webinar replays and exam-day reminders. Our proctors coordinate venues, timetables, and reporting so school staff can focus on teaching.
          </p>
        </div>
      </section>
    </PublicPageLayout>
  )
}
