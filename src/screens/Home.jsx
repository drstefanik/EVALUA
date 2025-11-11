import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Particles from '../components/Particles.jsx'
import SEO from '../components/SEO.jsx'
import evaluaDarkmodeLogo from '../assets/EVALUA DARKMODE.svg'

const cardAnimation = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: 'easeOut' },
  viewport: { once: true, amount: 0.35 }
})

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <SEO
        title="Home"
        description="Evalua Education advances English certification through QUAET adaptive testing and internationally benchmarked qualifications."
        path="/"
      />

      {/* --- Animated gradient background (premium UAE palette) --- */}
      <div className="absolute inset-0 -z-20 evalua-gradient" />
      {/* soft light sheen for depth */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_50%_-200px,rgba(255,255,255,.35),transparent_60%)]" />

      {/* very subtle decorative particles */}
      <Particles density={90} />

      {/* HERO */}
      <section className="relative z-10 mx-auto flex min-h-[82vh] max-w-6xl flex-col items-center justify-center gap-9 px-4 pt-28 text-center md:gap-12">
        {/* floating logo with breathing effect */}
        <motion.img
          src={evaluaDarkmodeLogo}
          alt="EVALUA Education"
          className="w-44 md:w-64 drop-shadow-xl"
          animate={{ y: [0, -10, 0], scale: [1, 1.02, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-base)]/80 backdrop-blur px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]"
        >
          Credibility • Innovation • Impact
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, delay: 0.05, ease: 'easeOut' }}
          className="max-w-4xl text-4xl font-semibold leading-tight text-[var(--text-primary)] md:text-6xl"
        >
          Advancing English certification across the world.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, delay: 0.12, ease: 'easeOut' }}
          className="max-w-2xl text-base text-[var(--text-secondary)] md:text-lg"
        >
          Evalua Education is an international awarding body based in the United Arab Emirates. Through
          <strong> QUAET — the Qualification UAE Adaptive English Test</strong> — and future assessments,
          we deliver solutions that combine innovation, credibility, and cultural relevance for learners
          and institutions across the region.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
          className="flex flex-wrap justify-center gap-4 pt-2"
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
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-32 pt-8">
        <motion.div
          {...cardAnimation(0.12)}
          className="grid gap-10 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)]/90 p-10 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-sm md:grid-cols-3"
        >
          <div className="space-y-3">
            <span className="text-3xl" aria-hidden>🧭</span>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">One ecosystem, multiple pathways</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Placement, formative assessment, and certification combine in a unified, data-driven
              experience for institutions, teachers, and learners.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-3xl" aria-hidden>🔐</span>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Secure and transparent certification</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Verified delivery, adaptive scoring, and authentic digital credentials ensure integrity
              from registration to recognition.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-3xl" aria-hidden>🌍</span>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Global standards, regional impact</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Aligned with CEFR, ACTFL, and GSE, Evalua pairs international quality with cultural
              relevance and accessibility.
            </p>
          </div>
        </motion.div>

        {/* SOLUTIONS GRID */}
        <div className="mt-20 grid gap-10 md:grid-cols-3">
          <motion.article
            {...cardAnimation(0.2)}
            className="flex h-full flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-base)]/95 p-8 shadow-soft hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              <span className="text-3xl" aria-hidden>🧪</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Adaptive Testing Platform</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Deliver secure, computer-based English tests through Evalua’s adaptive system, aligned
                with CEFR and major global frameworks.
              </p>
            </div>
            <Link to="/solutions/testing-platform" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80">
              Learn more <span aria-hidden>→</span>
            </Link>
          </motion.article>

          <motion.article
            {...cardAnimation(0.27)}
            className="flex h-full flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-base)]/95 p-8 shadow-soft hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              <span className="text-3xl" aria-hidden>🎓</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Certification and Recognition</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                QUAET – the Qualification UAE Adaptive English Test – provides internationally comparable
                results and authentic digital credentials.
              </p>
            </div>
            <Link to="/solutions/certification" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80">
              Learn more <span aria-hidden>→</span>
            </Link>
          </motion.article>

          <motion.article
            {...cardAnimation(0.34)}
            className="flex h-full flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-base)]/95 p-8 shadow-soft hover:shadow-md transition-shadow"
          >
            <div className="space-y-4">
              <span className="text-3xl" aria-hidden>🤝</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Institutional Partnerships</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Collaborations with ministries, universities, and educational bodies to integrate Evalua
                assessments into national and regional frameworks.
              </p>
            </div>
            <Link to="/solutions/partnerships" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] transition hover:opacity-80">
              Learn more <span aria-hidden>→</span>
            </Link>
          </motion.article>
        </div>
      </section>

      {/* local styles for the animated gradient (no external file needed) */}
      <style>{`
        :root{
          /* UAE-inspired premium palette */
          --evalua-g1:#004C46; /* deep emerald */
          --evalua-g2:#E03E36; /* UAE red */
          --evalua-g3:#D4AF37; /* satin gold */
        }
        @keyframes gradientMove{
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        .evalua-gradient{
          background-image: linear-gradient(135deg,var(--evalua-g1),var(--evalua-g2),var(--evalua-g3));
          background-size: 400% 400%;
          animation: gradientMove 18s ease-in-out infinite;
          opacity: .14; /* elegante, non invasivo */
        }
      `}</style>
    </main>
  )
}
