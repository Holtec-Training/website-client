import { useState, useEffect, FormEvent } from 'react'
import { useLocation } from 'react-router-dom'

interface LocationState {
  trainer?: string
}

interface Trainer {
  name: string
  spec: string
  location: string
}

const TRAINERS: Trainer[] = [
  { name: 'Jamie Holloway', spec: 'Strength & Fat Loss',   location: 'Manchester' },
  { name: 'Priya Nair',     spec: 'Cardio & Nutrition',    location: 'London'     },
  { name: 'Marcus Webb',    spec: 'Powerlifting & Rehab',  location: 'Birmingham' },
  { name: 'Ella Sutton',    spec: 'Body Composition',      location: 'Leeds'      },
  { name: 'Tom Chadwick',   spec: 'Functional Fitness',    location: 'Bristol'    },
  { name: 'Aisha Okonkwo',  spec: 'Mobility & Wellness',   location: 'London'     },
]

export default function Contact() {
  const location = useLocation()
  const state = location.state as LocationState | null
  const preSelectedTrainer = state?.trainer ?? ''

  const [contactType, setContactType] = useState<string>(
    preSelectedTrainer ? 'client' : ''
  )
  const [selectedTrainer, setSelectedTrainer] = useState<string>(preSelectedTrainer)
  const [submitted, setSubmitted] = useState(false)

  // If navigated with a trainer pre-selected, ensure type is set to client
  useEffect(() => {
    if (preSelectedTrainer) {
      setContactType('client')
      setSelectedTrainer(preSelectedTrainer)
    }
  }, [preSelectedTrainer])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
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
                placeholder="Your first name"
                required
                className="form-input"
              />
            </FormGroup>
            <FormGroup label="Last Name">
              <input
                type="text"
                placeholder="Your last name"
                required
                className="form-input"
              />
            </FormGroup>
          </div>

          {/* Email */}
          <FormGroup label="Email">
            <input
              type="email"
              placeholder="you@email.com"
              required
              className="form-input"
            />
          </FormGroup>

          {/* Contact type */}
          <FormGroup label="I am a…">
            <select
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
              className="rounded-[var(--radius)] p-5"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <span
                className="font-barlow-condensed font-bold text-[13px] uppercase tracking-[0.08em] block mb-3"
                style={{ color: 'var(--muted)' }}
              >
                Which trainer are you interested in?
              </span>
              <div className="flex flex-col gap-2">
                {TRAINERS.map((trainer) => (
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
                      onChange={() => setSelectedTrainer(trainer.name)}
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
              placeholder="Tell us a bit about your goals, availability, or anything else…"
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

      {/* Success state */}
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
