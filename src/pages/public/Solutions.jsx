import React from 'react'
import { Link } from 'react-router-dom'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

export default function Solutions() {
  return (
    <PublicPageLayout
      title="Comprehensive Certification Solutions"
      description="Evalua Education designs, manages, and delivers high-quality assessment and certification systems that empower institutions, ministries, and learners across the Arab region."
      eyebrow="Solutions"
      path="/solutions"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-3">
        <article className="flex h-full flex-col justify-between rounded-2xl bg-[var(--surface-alt)] p-6">
          <div className="space-y-3">
            <span className="text-2xl" aria-hidden>🧪</span>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Adaptive Testing Platform</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Deliver secure, computer-based testing through Evalua’s proprietary adaptive system, aligned with CEFR and global benchmarks.
            </p>
          </div>
          <Link to="/solutions/testing-platform" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80">
            Explore <span aria-hidden>→</span>
          </Link>
        </article>

        <article className="flex h-full flex-col justify-between rounded-2xl bg-[var(--surface-alt)] p-6">
          <div className="space-y-3">
            <span className="text-2xl" aria-hidden>🎓</span>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Certification and Recognition</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              QUAET – the Qualification UAE Adaptive English Test – provides internationally comparable results and authentic digital credentials.
            </p>
          </div>
          <Link to="/solutions/certification" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80">
            Explore <span aria-hidden>→</span>
          </Link>
        </article>

        <article className="flex h-full flex-col justify-between rounded-2xl bg-[var(--surface-alt)] p-6">
          <div className="space-y-3">
            <span className="text-2xl" aria-hidden>🤝</span>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Institutional Partnerships</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Collaborations with ministries, universities, and educational bodies to integrate Evalua assessments into national and regional frameworks.
            </p>
          </div>
          <Link to="/solutions/partnerships" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80">
            Explore <span aria-hidden>→</span>
          </Link>
        </article>
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Integrated operations</h2>
        <div className="mt-4 grid gap-4 text-sm text-[var(--text-secondary)] md:grid-cols-2">
          <p>
            Schools and institutions onboard candidates once and manage placement, formative, and summative assessments within a unified platform.
          </p>
          <p>
            Administrators monitor performance, compliance, and reporting from a single dashboard — ensuring transparent communication and data integrity.
          </p>
        </div>
      </section>
    </PublicPageLayout>
  )
}
