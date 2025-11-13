import { useState, useEffect, useRef } from 'react'

export default function CollapsibleSection({ id, title, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const innerRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(0)

  const toggle = () => {
    setIsOpen((prev) => !prev)
  }

  const contentId = id ? `${id}-content` : undefined

  // 🔁 aggiorna l'altezza del contenuto quando cambia o quando si apre
  useEffect(() => {
    if (!innerRef.current) return
    setContentHeight(innerRef.current.scrollHeight)
  }, [children, isOpen])

  // 🪟 aggiorna l'altezza al resize (per evitare tagli strani)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => {
      if (!innerRef.current) return
      setContentHeight(innerRef.current.scrollHeight)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 🔗 APRI AUTOMATICAMENTE LA SEZIONE SE L'URL MATCHA L'ANCORA (#id)
  useEffect(() => {
    if (!id || typeof window === 'undefined') return

    const handleHashChange = () => {
      if (window.location.hash === `#${id}`) {
        setIsOpen(true)
      }
    }

    // controllo immediato al mount (es. arrivo diretto con #my-results)
    handleHashChange()

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [id])

  return (
    <section id={id} className="card rounded-3xl scroll-mt-24">
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

      {/* wrapper animato */}
      <div
        id={contentId}
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? contentHeight || 9999 : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={innerRef} className="border-t border-border-strong px-6 py-6">
          {children}
        </div>
      </div>
    </section>
  )
}
