import React from 'react'
import { Link } from 'react-router-dom'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import quaetLogo from '../../assets/quaet.svg'

export default function Quaet() {
  return (
    <PublicPageLayout
      title="QuAET"
      description="Adaptive English assessment and clear reporting for schools: placement, progress checks and end-of-course tests, all aligned to the CEFR."
      eyebrow="QuAET"
      path="/quaet"
    >
      {/* HERO */}
      <section className="mb-6 grid items-center gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight text-[var(--text-primary)]">
            A clear English level for every student.
          </h1>
          <p className="text-[var(--text-secondary)]">
            QuAET is an adaptive English test and reporting toolkit for schools.
            Use it for placement, mid-year checks and end-of-course exams, with
            CEFR-linked results that teachers, leaders and families can actually
            understand.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/contact"
              className="rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand)]"
            >
              Book a demo
            </Link>
            <Link
              to="/docs/quaet"
              className="rounded-2xl border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-alt)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--border-strong)]"
            >
              View sample reports
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

      {/* WHAT IT DOES */}
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">What QuAET does</h2>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            {[
              'Places students on the right CEFR level (A1–C1) before starting a course.',
              'Checks progress during the year with comparable results over time.',
              'Shows strengths and weaknesses by skill (Listening, Reading, Writing, Speaking).',
              'Highlights students and classes that need support before final exams.',
              'Gives coordinators a simple overview of classes, levels and test history.',
              'Exports data that can be shared with families and school owners in a clear way.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 text-lg" aria-hidden>
                  ✅
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* HOW SCHOOLS USE IT */}
        <div className="space-y-4 rounded-2xl bg-[var(--surface-alt)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            How schools use QuAET
          </h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            <li>
              <strong>Placement:</strong> test new students and create groups with consistent CEFR levels.
            </li>
            <li>
              <strong>Mid-year check:</strong> verify if classes are on track and identify who needs extra help.
            </li>
            <li>
              <strong>End-of-course:</strong> confirm the final level and prepare students for external exams.
            </li>
            <li>
              <strong>Reporting:</strong> share simple, visual reports with teachers, families and school owners.
            </li>
          </ol>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Why it matters</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            'Correct groups from day one, thanks to objective CEFR placement.',
            'Less guesswork for teachers and clearer expectations for families.',
            'Concrete evidence for school leaders when planning courses and staffing.',
          ].map((item) => (
            <div key={item} className="space-y-2 rounded-2xl bg-[var(--surface-alt)] p-6">
              <span className="text-2xl" aria-hidden>
                📊
              </span>
              <p className="text-sm text-[var(--text-secondary)]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mt-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-6 text-center shadow-soft">
        <p className="mb-3 text-sm text-[var(--text-secondary)]">
          Want to see the adaptive test and the reports as your teachers would use them?
        </p>
        <Link
          to="/contact"
          className="inline-block rounded-2xl border border-[var(--brand)] px-5 py-2 text-sm font-medium text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand)]"
        >
          Book a QuAET demo
        </Link>
      </section>
    </PublicPageLayout>
  )
}
