import { useEffect } from 'react'

const SITE_NAME = 'EVALUA Education'
const DEFAULT_DESCRIPTION =
  'EVALUA Education accelerates language proficiency with data-driven preparation, digital assessments, and certifications tailored for Italian schools.'

const getMeta = (selector) => document.head.querySelector(selector)

const ensureMeta = (selector, createFn) => {
  let element = getMeta(selector)
  if (!element) {
    element = createFn()
    document.head.appendChild(element)
  }
  return element
}

export default function SEO({ title, description = DEFAULT_DESCRIPTION, path }) {
  useEffect(() => {
    const computedTitle = title ? `${title} • ${SITE_NAME}` : SITE_NAME
    document.title = computedTitle

    ensureMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      return meta
    }).setAttribute('content', description)

    ensureMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:title')
      return meta
    }).setAttribute('content', computedTitle)

    ensureMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:description')
      return meta
    }).setAttribute('content', description)

    ensureMeta('meta[name="twitter:title"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:title')
      return meta
    }).setAttribute('content', computedTitle)

    ensureMeta('meta[name="twitter:description"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:description')
      return meta
    }).setAttribute('content', description)

    ensureMeta('meta[name="twitter:card"]', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'twitter:card')
      return meta
    }).setAttribute('content', 'summary')

    if (path) {
      const url = `${window.location.origin}${path}`
      ensureMeta('meta[property="og:url"]', () => {
        const meta = document.createElement('meta')
        meta.setAttribute('property', 'og:url')
        return meta
      }).setAttribute('content', url)
      ensureMeta('link[rel="canonical"]', () => {
        const link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        return link
      }).setAttribute('href', url)
    }
  }, [description, path, title])

  return null
}
