import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'

export default function SolutionsTestingPlatform() {
  return (
    <PublicPageLayout
      title="Adaptive Testing Platform"
      description="Evalua’s technology delivers secure, computer-based English assessments built for precision, scalability, and cultural alignment."
      eyebrow="Solutions"
      path="/solutions/testing-platform"
    >
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-3">
        <div className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
          <span className="text-2xl" aria-hidden>🧩</span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Adaptive Engine</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            QUAET’s adaptive algorithm adjusts question difficulty in real time, generating accurate results in fewer items while maintaining CEFR precision.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
          <span className="text-2xl" aria-hidden>🛰️</span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Secure Delivery</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Built on cloud infrastructure compliant with UAE and international data protection standards, guaranteeing fairness, reliability, and integrity.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl bg-[var(--surface-alt)] p-6">
          <span className="text-2xl" aria-hidden>📊</span>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Analytics and Insights</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Institutions gain access to dashboards tracking candidate performance, benchmarking data, and psychometric indicators for quality assurance.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Launch pilot testing in days</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Evalua’s technical and pedagogical teams support partner institutions in test migration, rubric calibration, and examiner training — enabling immediate deployment of pilot sessions and institutional validation.
            </p>
          </div>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-accent)] px-6 py-3 text-sm font-semibold text-[var(--brand-accent-contrast)] shadow-soft transition hover:opacity-90"
          >
            Get in touch <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </PublicPageLayout>
  )
}
