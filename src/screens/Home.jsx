import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Particles from '../components/Particles.jsx'
import SEO from '../components/SEO.jsx'
import { marketingContent } from '../lib/marketingContent.js'

const brand = marketingContent.brand
const solutions = marketingContent.pages.solutions.cards

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
        description="EVALUA Education partners with Italian schools to deliver QuAET benchmarks, digital assessments, and trusted certification pathways."
        path="/"
      />
      <div className="absolute inset-0 -z-20 bg-hero-sheen" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,var(--brand-muted),transparent_60%)]" />
      <Particles density={120} />

      <section className="relative z-10 mx-auto flex min-h-[75vh] max-w-6xl flex-col items-center justify-center gap-8 px-4 pt-24 text-center md:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-base)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]"
        >
          {brand.tagline}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="max-w-4xl text-4xl font-semibold leading-tight text-[var(--text-primary)] md:text-6xl"
        >
          Accelerate English programmes with evidence, empathy, and inclusive certification journeys.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-2xl text-base text-[var(--text-secondary)] md:text-lg"
        >
          {brand.mission}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Link
            to="/solutions/testing-platform"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-[var(--brand-primary-contrast)] shadow-soft transition hover:opacity-90"
          >
            Explore testing platform
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-base)] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
          >
            Talk with our team
          </Link>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20">
        <motion.div
          {...cardAnimation(0.15)}
          className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-3"
        >
          <div className="space-y-2">
            <span className="text-2xl" aria-hidden>
              🧭
            </span>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">One platform, three journeys</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Placement, formative assessment, and certification support working together for leadership teams, teachers, and families.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-2xl" aria-hidden>
              🔐
            </span>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Trusted access</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Dedicated dashboards for schools and students with secure sign-ins, role-based permissions, and downloadable resources.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-2xl" aria-hidden>
              📣
            </span>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Support that scales</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Implementation templates, stakeholder communication packs, and live coaching during the academic year.
            </p>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {solutions.map((solution, index) => (
            <motion.article
              key={solution.title}
              {...cardAnimation(0.2 + index * 0.05)}
              className="flex h-full flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-6 shadow-soft"
            >
              <div className="space-y-3">
                <span className="text-2xl" aria-hidden>
                  {index === 0 ? '🧪' : index === 1 ? '🎓' : '🤝'}
                </span>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{solution.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{solution.description}</p>
              </div>
              <Link
                to={solution.href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80"
              >
                Learn more
                <span aria-hidden>→</span>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  )
}
