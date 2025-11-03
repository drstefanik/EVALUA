import React, { useState } from 'react'
import PublicPageLayout from '../../components/PublicPageLayout.jsx'
import { marketingContent } from '../../lib/marketingContent.js'

const copy = marketingContent.pages.contact

const initialState = {
  name: '',
  email: '',
  organisation: '',
  message: ''
}

const validators = {
  name: (value) => value.trim().length > 2,
  email: (value) => /.+@.+\..+/.test(value),
  organisation: (value) => value.trim().length > 1,
  message: (value) => value.trim().length > 10
}

export default function Contact() {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')

  const webhook = import.meta.env.VITE_CONTACT_INCOMING_WEBHOOK_URL

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: false }))
  }

  const validate = () => {
    const nextErrors = {}
    for (const key of Object.keys(form)) {
      if (!validators[key](form[key])) {
        nextErrors[key] = true
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) {
      return
    }

    setStatus('submitting')
    setFeedback('')

    try {
      if (webhook) {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            submittedAt: new Date().toISOString(),
            source: 'evalua-education-contact'
          })
        })
      }

      setStatus('success')
      setFeedback(copy.success)
      setForm(initialState)
    } catch (error) {
      console.error('Contact form error', error)
      setStatus('error')
      setFeedback(copy.error)
    }
  }

  return (
    <PublicPageLayout
      title={copy.title}
      description={copy.intro}
      eyebrow="Contact"
      path="/contact"
    >
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 shadow-soft">
        <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-semibold text-[var(--text-primary)]">
              {copy.fields.name}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className={`rounded-xl border px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${errors.name ? 'border-red-400' : 'border-[var(--border-subtle)]'}`}
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-xs text-red-500">
                Please share your full name.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-[var(--text-primary)]">
              {copy.fields.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={`rounded-xl border px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${errors.email ? 'border-red-400' : 'border-[var(--border-subtle)]'}`}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-red-500">
                Enter a valid work email.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="organisation" className="text-sm font-semibold text-[var(--text-primary)]">
              {copy.fields.organisation}
            </label>
            <input
              id="organisation"
              name="organisation"
              type="text"
              value={form.organisation}
              onChange={handleChange}
              className={`rounded-xl border px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${errors.organisation ? 'border-red-400' : 'border-[var(--border-subtle)]'}`}
              aria-invalid={errors.organisation ? 'true' : 'false'}
              aria-describedby={errors.organisation ? 'organisation-error' : undefined}
            />
            {errors.organisation && (
              <p id="organisation-error" className="text-xs text-red-500">
                Tell us where you work or study.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="message" className="text-sm font-semibold text-[var(--text-primary)]">
              {copy.fields.message}
            </label>
            <textarea
              id="message"
              name="message"
              rows="5"
              value={form.message}
              onChange={handleChange}
              className={`rounded-xl border px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] ${errors.message ? 'border-red-400' : 'border-[var(--border-subtle)]'}`}
              aria-invalid={errors.message ? 'true' : 'false'}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
            {errors.message && (
              <p id="message-error" className="text-xs text-red-500">
                Share a short summary of your request.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--text-muted)]">
              By submitting you consent to be contacted about EVALUA Education programmes.
            </p>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-[var(--brand-primary-contrast)] shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'submitting' ? 'Sending…' : 'Send message'}
            </button>
          </div>

          {feedback && (
            <p className={`text-sm ${status === 'error' ? 'text-red-500' : 'text-[var(--brand-primary)]'}`} aria-live="polite">
              {feedback}
            </p>
          )}
        </form>
      </section>
    </PublicPageLayout>
  )
}
