import { useState } from 'react'

interface Contact { first_name: string; last_name: string; email: string; phone: string }
interface Props { onSubmit: (c: Contact) => void }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ContactStep({ onSubmit }: Props) {
  const [c, setC] = useState<Contact>({ first_name: '', last_name: '', email: '', phone: '' })
  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setC(prev => ({ ...prev, [k]: e.target.value }))

  const canSubmit =
    c.first_name.trim().length > 0 &&
    c.last_name.trim().length > 0 &&
    emailPattern.test(c.email.trim()) &&
    c.phone.trim().length > 0

  return (
    <section className="qp-container">
      <div className="qp-meta">Last step · 30 seconds</div>
      <h2 className="qp-question">Where should we send your results?</h2>

      <form className="qp-form" onSubmit={(e) => { e.preventDefault(); if (canSubmit) onSubmit(c) }}>
        <div className="qp-field">
          <label className="qp-label" htmlFor="first-name">First name</label>
          <input
            id="first-name"
            className="qp-input"
            required
            autoComplete="given-name"
            value={c.first_name}
            onChange={set('first_name')}
          />
        </div>
        <div className="qp-field">
          <label className="qp-label" htmlFor="last-name">Last name</label>
          <input
            id="last-name"
            className="qp-input"
            required
            autoComplete="family-name"
            value={c.last_name}
            onChange={set('last_name')}
          />
        </div>
        <div className="qp-field">
          <label className="qp-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="qp-input"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            value={c.email}
            onChange={set('email')}
          />
        </div>
        <div className="qp-field">
          <label className="qp-label" htmlFor="phone">Phone</label>
          <input
            id="phone"
            className="qp-input"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={c.phone}
            onChange={set('phone')}
          />
        </div>
        <button type="submit" className="qp-cta" disabled={!canSubmit} style={{ marginTop: 8 }}>
          Continue
        </button>
      </form>
    </section>
  )
}
