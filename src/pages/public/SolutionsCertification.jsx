import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'

export default function SolutionsCertification() {
  return (
    <PublicPageLayout
      title="Certification that defines excellence"
      description="Evalua Education develops and administers high-quality English language assessments for institutions, ministries, and learners across the Arab region. Our flagship test, QUAET – the Qualification UAE Adaptive English Test – represents a new generation of adaptive certification: built in the UAE, internationally benchmarked, and designed for regional relevance."
      eyebrow="Solutions"
      path="/solutions/certification"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-3">
        <div className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
          <span className="text-2xl" aria-hidden>🎯</span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Adaptive by design</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            QUAET dynamically adjusts to each candidate’s level, delivering accurate, efficient measurement across CEFR bands from A1 to C2.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
          <span className="text-2xl" aria-hidden>🌐</span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Globally benchmarked</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Scores are calibrated against CEFR, ACTFL, TOEFL/TOEIC, and GSE frameworks to ensure international comparability and transparency.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
          <span className="text-2xl" aria-hidden>🔏</span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Authentic and accessible</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Localized content, fair pricing, and secure digital delivery make English certification inclusive, credible, and scalable.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">From diagnostic to recognition</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Evalua accompanies learners at every stage — from placement to formal certification — providing feedback dashboards, examiner-verified results, and digital credentials with built-in authenticity verification. Institutions benefit from structured reporting, quality assurance tools, and partnership pathways that enhance educational credibility at national and international level.
          </p>
        </div>
      </section>
    </PublicPageLayout>
  )
}
