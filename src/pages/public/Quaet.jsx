import React from 'react'
import { Link } from 'react-router-dom'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import quaetLogo from '../../assets/quaet.svg'

export default function Quaet() {
  return (
    <PublicPageLayout
      title="QuAET"
      description="Il Quality & Assessment Toolkit pensato per le scuole: monitora i progressi degli studenti, migliora l’allineamento didattico e porta risultati misurabili agli esami esterni."
      eyebrow="QuAET"
      path="/quaet"
    >
      {/* HERO */}
      <section className="mb-6 grid items-center gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight text-[var(--text-primary)]">
            Misura. Comprendi. Migliora.
          </h1>
          <p className="text-[var(--text-secondary)]">
            QuAET aiuta dirigenti, coordinatori e docenti a trasformare i dati in decisioni: prove periodiche
            allineate al CEFR, analisi degli item, confronti tra classi e piani di recupero mirati. Tutto in un
            flusso semplice, dalla somministrazione al report.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              to="/contact"
              className="rounded-2xl bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Richiedi demo
            </Link>
            <Link
              to="/docs/quaet"
              className="rounded-2xl border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-alt)]"
            >
              Scopri di più
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

      {/* COSA MISURA */}
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Cosa misura</h2>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            {[
              'Competenza linguistica per abilità (Listening, Reading, Use of English, Writing, Speaking) con rubriche CEFR.',
              'Progressi per classe, parallelo e gruppo di livello con analisi delle tendenze.',
              'Coerenza didattica e copertura del syllabus rispetto agli obiettivi di periodo.',
              'Affidabilità delle prove e analisi degli item (difficoltà, discriminazione, distrattori).',
              'Engagement e attendance in fase di somministrazione.',
              'Benchmark interni tra plessi e confronto con standard esterni (CEFR/INVALSI dove applicabile).',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 text-lg">✅</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* COME LO USANO LE SCUOLE */}
        <div className="space-y-4 rounded-2xl bg-[var(--surface-alt)] p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Come lo usano le scuole</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
            <li><strong>Pianifica</strong>: calendario delle verifiche per periodo e classi.</li>
            <li><strong>Somministra</strong>: prove pronte, istruzioni chiare, tempi standard.</li>
            <li><strong>Analizza</strong>: report per classe e rete; focus su item e micro-abilità.</li>
            <li><strong>Intervieni</strong>: micro-unità di recupero e “catch-up clinics”.</li>
            <li><strong>Monitora</strong>: confronti tra plessi e trend di miglioramento.</li>
          </ol>
        </div>
      </section>

      {/* RISULTATI / OUTCOMES */}
      <section className="grid gap-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Risultati attesi</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            'Miglioramento misurabile ai test esterni grazie a interventi mirati sulle aree deboli.',
            'Maggiore coerenza didattica tra classi e plessi, con obiettivi condivisi e verificabili.',
            'Report chiari per leadership, docenti e famiglie: dati comprensibili, decisioni rapide.',
          ].map((item) => (
            <div key={item} className="space-y-2 rounded-2xl bg-[var(--surface-alt)] p-6">
              <span className="text-2xl" aria-hidden>📈</span>
              <p className="text-sm text-[var(--text-secondary)]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="mt-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-6 text-center shadow-soft">
        <p className="mb-3 text-sm text-[var(--text-secondary)]">
          Vuoi vedere i report di esempio e una simulazione di analisi item?
        </p>
        <Link
          to="/contact"
          className="inline-block rounded-2xl bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Prenota una demo di QuAET
        </Link>
      </section>
    </PublicPageLayout>
  )
}
