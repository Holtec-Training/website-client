import { useState, useEffect, FormEvent } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { sanityClient } from '../lib/sanity'

interface LocationState {
  trainer?: string
}

interface Trainer {
  name: string
  spec: string
  location: string
  slug: { current: string }
}

const TRAINERS_QUERY = `
  *[_type == "trainer"] | order(name asc) {
    name, spec, location, slug { current }
  }
`

export default function Contact() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = location.state as LocationState | null
  const preSelectedTrainer = state?.trainer ?? ''
  const trainerSlugParam = searchParams.get('trainer') ?? ''

  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [contactType, setContactType] = useState<string>(
    preSelectedTrainer ? 'client' : ''
  )
  const [selectedTrainer, setSelectedTrainer] = useState<string>(preSelectedTrainer)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)
  const [trainerError, setTrainerError] = useState(false)

  useEffect(() => {
    sanityClient.fetch<Trainer[]>(TRAINERS_QUERY).then((data) => {
      setTrainers(data)
      if (trainerSlugParam) {
        const match = data.find(t => t.slug.current === trainerSlugParam)
        if (match) {
          setSelectedTrainer(match.name)
          setContactType('client')
        }
      }
    })
  }, [trainerSlugParam])

  useEffect(() => {
    if (preSelectedTrainer) {
      setContactType('client')
      setSelectedTrainer(preSelectedTrainer)
    }
  }, [preSelectedTrainer])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(false)

    if (contactType === 'client' && !selectedTrainer) {
      setTrainerError(true)
      return
    }
    setTrainerError(false)

    fetch('/.netlify/functions/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'Holtec Training Website',
        firstName,
        lastName,
        email,
        contactType,
        trainer: selectedTrainer,
        message,
        submittedAt: new Date().toISOString(),
      }),
    })
      .then(() => setSubmitted(true))
      .catch(() => setError(true))
  }

  return (
    <div className="max-w-[700px] mx-auto px-12 pt-[72px] pb-[100px] max-[768px]:px-5 max-[768px]:pt-10 max-[768px]:pb-[60px]">
      {/* Header */}
      <h2
        className="font-barlow-condensed font-black italic uppercase leading-none mb-3"
        style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}
      >
        Let's <span style={{ color: 'var(--blue-light)' }}>Connect</span>
      </h2>
      <p className="text-[16px] mb-12" style={{ color: 'var(--muted)' }}>
        Whether you're a client looking for the right trainer, or a PT ready to
        grow your career — reach out and we'll get back to you within 24 hours.
      </p>

      {/* Form */}
      {!submitted && (
        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
          aria-label="Contact form"
        >
          {/* Name row */}
          <div className="grid grid-cols-2 gap-5 max-[768px]:grid-cols-1">
            <FormGroup label="First Name">
              <input
                type="text"
                name="firstName"
                placeholder="Your first name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="form-input"
              />
            </FormGroup>
            <FormGroup label="Last Name">
              <input
                type="text"
                name="lastName"
                placeholder="Your last name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="form-input"
              />
            </FormGroup>
          </div>

          {/* Email */}
          <FormGroup label="Email">
            <input
              type="email"
              name="email"
              placeholder="you@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </FormGroup>

          {/* Contact type */}
          <FormGroup label="I am a…">
            <select
              name="contactType"
              value={contactType}
              onChange={(e) => {
                setContactType(e.target.value)
                if (e.target.value !== 'client') setSelectedTrainer('')
              }}
              required
              className="form-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="">Select one</option>
              <option value="client">Client — looking for a PT</option>
              <option value="pt">Personal Trainer — looking to join</option>
            </select>
          </FormGroup>

          {/* Conditional trainer selection */}
          {contactType === 'client' && (
            <div
              className="rounded-[var(--radius)] p-5 transition-colors duration-150"
              style={{
                background: 'var(--surface)',
                border: trainerError ? '1px solid #ef4444' : '1px solid var(--border)',
              }}
            >
              <div className="flex flex-col gap-1 mb-3 sm:flex-row sm:items-center sm:justify-between">
                <span
                  className="font-barlow-condensed font-bold text-[13px] uppercase tracking-[0.08em]"
                  style={{ color: 'var(--muted)' }}
                >
                  Which trainer are you interested in?
                </span>
                {trainerError && (
                  <span className="font-barlow-condensed font-semibold text-[12px] uppercase tracking-[0.06em]" style={{ color: '#ef4444' }}>
                    Please select a trainer
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {trainers.map((trainer) => (
                  <label
                    key={trainer.name}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 border border-transparent"
                    style={{
                      background:
                        selectedTrainer === trainer.name
                          ? 'var(--surface2)'
                          : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="trainer-choice"
                      value={trainer.name}
                      checked={selectedTrainer === trainer.name}
                      onChange={() => { setSelectedTrainer(trainer.name); setTrainerError(false) }}
                      style={{ accentColor: 'var(--blue)', width: '16px', height: '16px' }}
                    />
                    <div>
                      <div
                        className="font-barlow-condensed font-bold italic uppercase text-[16px]"
                        style={{ color: 'var(--text)' }}
                      >
                        {trainer.name}
                      </div>
                      <div className="text-[13px]" style={{ color: 'var(--muted)' }}>
                        {trainer.spec} · {trainer.location}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <FormGroup
            label={
              <>
                Message{' '}
                <span
                  className="font-normal tracking-normal"
                  style={{ textTransform: 'none', letterSpacing: 0 }}
                >
                  (optional)
                </span>
              </>
            }
          >
            <textarea
              name="message"
              placeholder="Tell us a bit about your goals, availability, or anything else…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="form-input"
              style={{ resize: 'vertical', minHeight: '120px' }}
            />
          </FormGroup>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

          {/* Submit */}
          <button
            type="submit"
            className="w-full font-barlow-condensed font-bold text-[18px] uppercase tracking-[0.05em] text-white py-4 rounded-[var(--radius)] cursor-pointer transition-all duration-200"
            style={{ background: 'var(--blue)', border: 'none' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = '#1a75f0'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)'
            }}
          >
            Send Message
          </button>
        </form>
      )}

      {submitted && (
        <div
          className="rounded-[var(--radius)] p-6 text-center mt-6"
          style={{
            background: 'rgba(21,101,216,0.15)',
            border: '1px solid rgba(91,200,245,0.3)',
          }}
        >
          <h4
            className="font-barlow-condensed font-black italic uppercase text-[22px] mb-1.5"
            style={{ color: 'var(--blue-light)' }}
          >
            Message Sent!
          </h4>
          <p className="text-[14px] m-0" style={{ color: 'var(--muted)' }}>
            Thanks for reaching out. We'll be in touch within 24 hours.
          </p>
        </div>
      )}

      {error && (
        <div
          className="rounded-[var(--radius)] p-4 mt-4"
          style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.25)',
          }}
        >
          <p className="text-[14px] m-0" style={{ color: '#ef4444' }}>
            Something went wrong sending your message. Please try again or email us directly.
          </p>
        </div>
      )}
    </div>
  )
}

interface FormGroupProps {
  label: React.ReactNode
  children: React.ReactNode
}

function FormGroup({ label, children }: FormGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="font-barlow-condensed font-bold text-[13px] uppercase tracking-[0.08em]"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
