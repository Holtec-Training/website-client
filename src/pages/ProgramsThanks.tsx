import { useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { fireFunnelEvent } from '../lib/funnelEvents'

interface Receipt {
  program_titles: string[]
  free_program_title: string | null
  monthly_amount_cents: number
  charged_count: number
  has_prior_claim: boolean
}

export default function ProgramsThanks() {
  const [email, setEmail] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  // StrictMode double-mounts effects in dev. Guard the fire so `thanks_displayed`
  // only lands in the Funnel Log once per real page load.
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    const storedEmail = sessionStorage.getItem('program_portal_email')
    if (storedEmail) setEmail(storedEmail)
    const raw = sessionStorage.getItem('program_portal_receipt')
    if (raw) {
      try { setReceipt(JSON.parse(raw) as Receipt) } catch { /* ignore */ }
    }
    const src = sessionStorage.getItem('program_portal_src') || 'unknown'
    const location = sessionStorage.getItem('program_portal_location') || ''
    fireFunnelEvent('thanks_displayed', { src, location })
  }, [])

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }),
  [])

  const monthlyDollars = receipt ? (receipt.monthly_amount_cents / 100).toFixed(0) : null

  return (
    <>
      <Helmet>
        <title>Payment confirmed — Holtec Training</title>
      </Helmet>
      <div className="qp-page qp-page-thanks">
        <div className="qp-thanks-container">
          <div className="qp-thanks-check" aria-hidden="true">✓</div>
          <div className="qp-thanks-eyebrow">Payment confirmed</div>
          <h1 className="qp-thanks-title">Your subscription is active.</h1>
          <p className="qp-thanks-sub">
            {email
              ? <>A confirmation and welcome email is on its way to <strong>{email}</strong>.</>
              : <>A confirmation and welcome email is on its way.</>}
          </p>

          {receipt && (
            <section className="qp-receipt" aria-labelledby="receipt-heading">
              <div className="qp-receipt-header">
                <span id="receipt-heading" className="qp-receipt-label">Subscription summary</span>
                <span className="qp-receipt-date">{today}</span>
              </div>

              <ul className="qp-receipt-lines">
                {receipt.program_titles.map((title, i) => {
                  const isFree = !receipt.has_prior_claim && title === receipt.free_program_title && i === 0
                  return (
                    <li key={`${title}-${i}`} className="qp-receipt-line">
                      <span className="qp-receipt-line-title">{title}</span>
                      <span className={`qp-receipt-line-price${isFree ? ' free' : ''}`}>
                        {isFree ? 'INCLUDED' : '$30/mo'}
                      </span>
                    </li>
                  )
                })}
              </ul>

              <div className="qp-receipt-total">
                <span className="qp-receipt-total-label">Monthly total</span>
                <span className="qp-receipt-total-amount">
                  ${monthlyDollars}<span className="qp-mo">/mo</span>
                </span>
              </div>
              {!receipt.has_prior_claim && receipt.free_program_title && (
                <div className="qp-receipt-note">
                  First program included free forever — you're only billed for the additional {receipt.charged_count} program{receipt.charged_count === 1 ? '' : 's'}.
                </div>
              )}
            </section>
          )}

          <section className="qp-thanks-next" aria-labelledby="next-heading">
            <h2 id="next-heading" className="qp-thanks-next-title">What happens next</h2>
            <ol className="qp-thanks-next-list">
              <li>
                <strong>Within 24 hours</strong> — we'll set up your Everfit account and load your programs.
              </li>
              <li>
                <strong>An email lands in your inbox</strong> — check {email ? <strong>{email}</strong> : 'your inbox'} for the Everfit login. From there you start training.
              </li>
              <li>
                <strong>Manage anytime</strong> — the confirmation email includes a link to your Stripe Customer Portal where you can update card details or cancel.
              </li>
            </ol>
          </section>

          <p className="qp-thanks-disclaimer">
            Non-refundable. Cancel anytime via the Stripe Customer Portal — access continues until the end of the current billing period.
          </p>
        </div>
      </div>
    </>
  )
}
