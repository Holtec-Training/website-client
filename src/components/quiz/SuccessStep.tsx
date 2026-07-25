import { useEffect, useMemo, useState } from 'react'

interface Props { email: string }

interface FreeReceipt {
  program_title: string
}

/** Free-only success screen shown at /programs after the customer picked
 * exactly 1 program and we emailed them the PDF. The paid subscription
 * confirmation is a separate route: /programs/thanks (see ProgramsThanks.tsx).
 * Both share the same receipt-style visual language. */
export default function SuccessStep({ email }: Props) {
  const [receipt, setReceipt] = useState<FreeReceipt | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('program_portal_free_receipt')
    if (raw) {
      try { setReceipt(JSON.parse(raw) as FreeReceipt) } catch { /* ignore */ }
    }
  }, [])

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }),
  [])

  return (
    <div className="qp-thanks-container">
      <div className="qp-thanks-check" aria-hidden="true">✓</div>
      <div className="qp-thanks-eyebrow">Check your inbox</div>
      <h1 className="qp-thanks-title">Your program is on its way.</h1>
      <p className="qp-thanks-sub">
        We just emailed <strong>{email}</strong>. Your program should arrive in about a minute.
      </p>

      {receipt && (
        <section className="qp-receipt" aria-labelledby="receipt-heading">
          <div className="qp-receipt-header">
            <span id="receipt-heading" className="qp-receipt-label">Program summary</span>
            <span className="qp-receipt-date">{today}</span>
          </div>
          <ul className="qp-receipt-lines">
            <li className="qp-receipt-line">
              <span className="qp-receipt-line-title">{receipt.program_title}</span>
              <span className="qp-receipt-line-price free">INCLUDED</span>
            </li>
          </ul>
          <div className="qp-receipt-total">
            <span className="qp-receipt-total-label">Delivery</span>
            <span className="qp-receipt-total-amount" style={{ fontSize: 16, color: 'var(--text)' }}>
              PDF · Email
            </span>
          </div>
        </section>
      )}

      <section className="qp-thanks-next" aria-labelledby="next-heading">
        <h2 id="next-heading" className="qp-thanks-next-title">What happens next</h2>
        <ol className="qp-thanks-next-list">
          <li>
            <strong>Check your inbox</strong> — your PDF arrives within a minute. If it's not there, check spam.
          </li>
          <li>
            <strong>Save it to your device</strong> — download or star it so it's easy to open at the gym.
          </li>
          <li>
            <strong>Start training</strong> — the program is yours to follow at your own pace.
          </li>
        </ol>
      </section>

      <p className="qp-thanks-disclaimer">
        Wondering if the full coached experience is worth it? Come back any time — your first program stays free forever when you subscribe.
      </p>
    </div>
  )
}
