import React from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'

export default function Recognition() {
  const timeline = [
    {
      year: '2025',
      description:
        'Launch of Evalua Education in Dubai with a focus on high-quality assessment, teacher development, and school partnerships across the GCC.'
    },
    {
      year: '2024',
      description:
        'Strategic partnership formalised with DOMAX Ltd (accredited by MFHEA, Malta) to strengthen awarding-body governance and QA expertise.'
    },
    {
      year: '2013–today',
      description:
        'Proven track record delivering ESOL programmes and services through British Institutes and affiliated centres across Europe.'
    }
  ]

  const qaPoints = [
    'Assessment design aligned with international best practice (construct validity, reliability, fairness, security).',
    'Documented quality cycle (plan → design → pilot → analyse → improve) with version control and audit trails.',
    'Standardisation & moderation for examiners and markers; ongoing CPD with annual refresh.',
    'Secure exam administration (invigilation protocols, incident logs, malpractice handling).',
    'Data protection by design (GDPR-compliant policies; role-based access and retention schedules).'
  ]

  const partners = [
    {
      name: 'DOMAX Ltd — MFHEA accredited awarding body (Malta)',
      note: 'Strategic QA & governance partner'
    },
    {
      name: 'British Institutes (Italy)',
      note: 'Network and ESOL delivery experience'
    }
    // Add others if needed:
    // { name: 'KHDA-aligned schools in Dubai', note: 'School partnerships (MoUs)' },
    // { name: 'University / Education partners', note: 'Academic collaboration' },
  ]

  return (
    <PublicPageLayout
      title="Recognition & Quality Assurance"
      description="How Evalua Education ensures academic integrity, compliance and international alignment."
      eyebrow="Recognition"
      path="/recognition"
    >
      {/* Timeline / Milestones */}
      <section className="space-y-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Milestones</h2>
        <ol className="mt-4 space-y-6 border-l border-[var(--border-subtle)] pl-6">
          {timeline.map((item) => (
            <li key={item.year} className="relative pl-6">
              <span
                className="absolute -left-3 top-1 h-5 w-5 rounded-full border-2 border-[var(--brand-primary)] bg-[var(--surface-base)]"
                aria-hidden
              />
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {item.year}
                </p>
                <p className="text-base text-[var(--text-secondary)]">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Compliance & QA */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Compliance & QA framework</h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Our quality system is designed to be auditable and scalable. It takes inspiration from ISO 9001
          principles and the governance models used by recognised awarding bodies.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-[var(--text-secondary)]">
          {qaPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </section>

      {/* Partners / Recognition */}
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Partners & recognition</h2>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          We work with established organisations to ensure our programmes are aligned with international standards
          and local requirements.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {partners.map((p) => (
            <div
              key={p.name}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5"
            >
              <p className="text-base font-medium text-[var(--text-primary)]">{p.name}</p>
              {p.note && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {p.note}
                </p>
              )}
              {/* Optional: insert partner logo here
                  <img src="/src/assets/partners/domax.svg" alt="DOMAX" className="mt-3 h-8 opacity-80" />
              */}
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-[var(--text-muted)]">
          Notes: “Aligned with” does not imply formal accreditation unless explicitly stated. All third-party names and
          marks remain the property of their respective owners.
        </p>
      </section>
    </PublicPageLayout>
  )
}
