import { useState, useEffect } from 'react'

export default function CollapsibleSection({ id, title, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const toggle = () => {
    setIsOpen((prev) => !prev)
  }

  const contentId = id ? `${id}-content` : undefined

  // APRI AUTOMATICAMENTE LA SEZIONE SE L'URL MATCHA L'ANCORA (#id)
  useEffect(() => {
    if (!id || typeof window === 'undefined') return

    const handleHashChange = () => {
      if (window.location.hash === `#${id}`) {
        setIsOpen(true)
      }
    }

    // controllo immediato al mount
    handleHashChange()

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [id])

  return (
    <section id={id} className="card rounded-3xl">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="text-xl font-semibold text-primary">{title}</span>
        <span className="text-sm font-medium text-brand">
          {isOpen ? 'Hide section' : 'Show section'}
        </span>
      </button>

      {isOpen && (
        <div id={contentId} className="border-t border-border-strong px-6 py-6">
          {children}
        </div>
      )}
    </section>
  )
}
