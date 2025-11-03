import React from 'react'
import { Link } from 'react-router-dom'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import quaetLogo from '../../assets/quaet.svg'

export default function Quaet() {
  return (
    <PublicPageLayout
      title="QuAET"
      description="The Quality & Assessment Toolkit for schools: track student progress, align teaching, and deliver measurable results in external exams."
      eyebrow="QuAET"
      path="/quaet"
    >
      {/* HERO */}
      <section className="mb-6 grid items-center gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight text-[var(--text-primary)]">
            Measure. Understand. Improve.
          </h1>
          <p className="text-[var(--text-secondary)]">
            QuAET turns data into decisions for school leaders, coordinators, and teachers:
            CEFR-aligned periodic tests, item analysis, class comparisons, and targeted catch-up plans.
            From delivery to reporting in one simple flow.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              to="/contact"
              className="rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Request a demo
            </Link>
            <Link
              to="/docs/quaet"
              className="rounded-2xl border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-alt)]"
            >
              Learn more
            </Link>
          </div>
        </div>

        <div className="justify-self-center">
          <img
            src={quaetLogo}
            alt="QuAET logo"
            className="h-32 w-auto opacity-95 drop-shadow-sm md:h-40"
          />
        </div>
      </section>

      {/* WHAT IT MEASURES */}
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">What it measures</h2>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            {[
              'Language competence by skill (Listening, Reading, Use of English, Writing, Speaking) with CEFR rubrics.',
              'Progress by class, cohort, and ability group, with trend analysis.',
              'Teaching coherence and syllabus coverage against period objectives.',
              'Test reliability and item analysis (difficulty, discrimination, distractors).',
              'Engagement and attendance during test delivery.',
              'Internal benchmarks across campuses and comparison with external standards (CEFR / INVALSI where applicable).',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 text-lg">✅</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* HOW SCHOOLS USE IT */}
        <div className="space-y-4 rounded-2xl bg-[var(--surface-alt)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">How schools use it</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            <li><strong>Plan</strong>: build an assessment calendar by term and class.</li>
            <li><strong>Deliver</strong>: ready-made tests, clear instructions, standard timings.</li>
            <li><strong>Analyse</strong>: class and network reports; deep dive on items and micro-skills.</li>
            <li><strong>Intervene</strong>: targeted catch-up micro-units and clinics.</li>
            <li><strong>Monitor</strong>: campus comparisons and improvement trends over time.</li>
          </ol>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Expected outcomes</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            'Measurable gains in external exams thanks to targeted work on weak areas.',
            'Greater teaching coherence across classes and campuses with shared, trackable goals.',
            'Clear, role-based reporting for leaders, teachers, and families: understandable data, faster decisions.',
          ].map((item) => (
            <div key={item} className="space-y-2 rounded-2xl bg-[var(--surface-alt)] p-6">
              <span className="text-2xl" aria-hidden>📈</span>
              <p className="text-sm text-[var(--text-secondary)]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mt-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-6 text-center shadow-soft">
        <p className="mb-3 text-sm text-[var(--text-secondary)]">
          Want to preview sample reports and an item-analysis walkthrough?
        </p>
        <Link
          to="/contact"
          className="inline-block rounded-2xl bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Book a QuAET demo
        </Link>
      </section>
    </PublicPageLayout>
  )
}
