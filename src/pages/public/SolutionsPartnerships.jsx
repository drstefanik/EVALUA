import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'

export default function SolutionsPartnerships() {
  return (
    <PublicPageLayout
      title="Partnerships that shape the future of language certification"
      description="Evalua collaborates with ministries, universities, and international agencies to build systems of recognition and trust around modern English assessment. Together, we promote certification models that strengthen mobility, employability, and lifelong learning across the Arab world."
      eyebrow="Solutions"
      path="/solutions/partnerships"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-3">
        <div className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
          <span className="text-2xl" aria-hidden>🏛️</span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Institutional Cooperation</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Joint projects with ministries and universities to integrate QUAET and future Evalua qualifications into national frameworks of education and migration.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
          <span className="text-2xl" aria-hidden>🎓</span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Academic Alliances</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Research and validation partnerships supporting test development, psychometrics, and benchmarking aligned with global best practice.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
          <span className="text-2xl" aria-hidden>🤝</span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recognition Agreements</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Memoranda of understanding and cross-accreditation initiatives ensuring acceptance by universities, employers, and professional councils worldwide.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Co-designing impact</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Each partnership is co-created with measurable outcomes — from candidate mobility and teacher development to international recognition strategies. Evalua provides governance models, data analytics, and communication frameworks for successful policy implementation and long-term sustainability.
          </p>
        </div>
      </section>
    </PublicPageLayout>
  )
}
