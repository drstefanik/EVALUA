import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Particles from '../components/Particles.jsx'
import SEO from '../components/SEO.jsx'
import { marketingContent } from '../lib/marketingContent.js'

const cardAnimation = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
  viewport: { once: true, amount: 0.4 }
})

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <SEO
        title="Home"
        description="Evalua Education advances English certification across the Arab world through QUAET benchmarking, adaptive testing, and trusted qualification frameworks for institutions and learners."
        path="/"
      />
      <div className="absolute inset-0 -z-20 bg-hero-sheen" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,var(--brand-muted),transparent_60%)]" />
      <Particles density={120} />

      {/* HERO */}
      <section className="relative z-10 mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center justify-center gap-10 px-4 pt-28 text-center md:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-base)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]"
        >
          Credibility • Innovation • Impact
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="max-w-4xl text-4xl font-semibold leading-tight text-[var(--text-primary)] md:text-6xl"
        >
          Advancing English certification across the Arab world.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-2xl text-base text-[var(--text-secondary)] md:text-lg"
        >
          Evalua Education is an international awarding body based in the United Arab Emirates. Through
          <strong> QUAET — the Qualification UAE Adaptive English Test</strong> — and future assessments,
          we deliver solutions that combine innovation, credibility, and cultural relevance for learners
          and institutions across the region.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 pt-4"
        >
          <Link
            to="/solutions/testing-platform"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-8 py-3 text-sm font-semibold text-[var(--brand-primary-contrast)] shadow-soft transition hover:opacity-90"
          >
            Explore testing platform
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-base)] px-8 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
          >
            Talk with our team
          </Link>
        </motion.div>
      </section>

      {/* FEATURE CARDS */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-32 pt-10">
        <motion.div
          {...cardAnimation(0.15)}
          className="grid gap-10 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-10 shadow-soft md:grid-cols-3"
        >
          <div className="space-y-3">
            <span className="text-3xl" aria-hidden>🧭</span>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              One ecosystem, multiple pathways
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Placement, formative assessment, and certification combine in a unified, data-driven
              experience for institutions, teachers, and learners.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-3xl" aria-hidden>🔐</span>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Secure and transparent certification
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Verified delivery, adaptive scoring, and authentic digital credentials ensure integrity
              from registration to recognition.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-3xl" aria-hidden>🌍</span>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Global standards, regional impact
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Aligned with CEFR, ACTFL, and GSE, Evalua pairs international quality with cultural
              relevance and accessibility.
            </p>
          </div>
        </motion.div>

        {/* SOLUTIONS GRID */}
        <div className="mt-20 grid gap-10 md:grid-cols-3">
          <motion.article
            {...cardAnimation(0.25)}
            className="flex h-full flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              <span className="text-3xl" aria-hidden>🧪</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Adaptive Testing Platform</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Deliver secure, computer-based English tests through Evalua’s adaptive system, aligned
                with CEFR and major global frameworks.
              </p>
            </div>
            <Link
              to="/solutions/testing-platform"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80"
            >
              Learn more <span aria-hidden>→</span>
            </Link>
          </motion.article>

          <motion.article
            {...cardAnimation(0.3)}
            className="flex h-full flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              <span className="text-3xl" aria-hidden>🎓</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Certification and Recognition</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                QUAET – the Qualification UAE Adaptive English Test – provides internationally comparable
                results and authentic digital credentials.
              </p>
            </div>
            <Link
              to="/solutions/certification"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80"
            >
              Learn more <span aria-hidden>→</span>
            </Link>
          </motion.article>

          <motion.article
            {...cardAnimation(0.35)}
            className="flex h-full flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              <span className="text-3xl" aria-hidden>🤝</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Institutional Partnerships</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Collaborations with ministries, universities, and educational bodies to integrate Evalua
                assessments into national and regional frameworks.
              </p>
            </div>
            <Link
              to="/solutions/partnerships"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80"
            >
              Learn more <span aria-hidden>→</span>
            </Link>
          </motion.article>
        </div>
      </section>
    </main>
  )
}
