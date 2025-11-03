import React from 'react'
import SEO from './SEO.jsx'

export default function PublicPageLayout({ title, description, eyebrow, path, children }) {
  return (
    <div className="relative overflow-hidden">
      <SEO title={title} description={description} path={path} />
      <section className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pb-10 pt-16 text-left md:pt-20">
        {eyebrow && <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{eyebrow}</span>}
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">{title}</h1>
        {description && <p className="max-w-3xl text-base text-[var(--text-secondary)]">{description}</p>}
      </section>
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-10 md:gap-14">{children}</div>
      </div>
    </div>
  )
}
