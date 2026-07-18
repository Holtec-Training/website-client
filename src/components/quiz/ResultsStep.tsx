import { useState } from 'react'
import type { Program } from '../../types/program'

interface PriorClaim {
  program_title: string
  claimed_at: string
}

interface Props {
  matched: Program[]
  priorClaim: PriorClaim | null
  onSubmit: (out: {
    program_ids: string[]
    path: 'free' | 'subscription'
  }) => void
}

const PROGRAM_PRICE_CENTS = 3000

export default function ResultsStep({ matched, priorClaim, onSubmit }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const hasPriorClaim = priorClaim !== null

  const toggle = (slug: string) => {
    setSelectedIds(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug],
    )
  }

  // With prior claim → ALL selections are paid subscriptions, no free slot, no discount.
  // Without prior claim → 1 program = free PDF; 2+ programs = subscription with first free.
  const path: 'free' | 'subscription' = hasPriorClaim
    ? 'subscription'
    : selectedIds.length >= 2 ? 'subscription' : 'free'

  const chargedProgramCount = hasPriorClaim
    ? selectedIds.length
    : Math.max(0, selectedIds.length - 1)
  const monthlyTotalCents = chargedProgramCount * PROGRAM_PRICE_CENTS
  const canContinue = selectedIds.length >= 1

  if (matched.length === 0) {
    return (
      <section className="qp-container">
        <div className="qp-eyebrow">No matches</div>
        <h2 className="qp-question">Nothing matched your answers yet.</h2>
        <p className="qp-landing-sub">
          Try the quiz again with different answers, or reach out to Milan directly for a personalised recommendation.
        </p>
      </section>
    )
  }

  return (
    <section className="qp-container">
      {priorClaim && (
        <div className="qp-prior-claim">
          <strong>You've already had a free program.</strong> We sent <strong>{priorClaim.program_title}</strong> to your inbox on {priorClaim.claimed_at}. Any selections below are paid subscriptions at $30/month each — the first-program-free offer doesn't apply again. Need another copy of your original PDF? Email Milan directly.
        </div>
      )}

      <div className="qp-results-eyebrow">{matched.length} matches · sorted by fit</div>
      <h1 className="qp-results-h2">Programs matched to your answers.</h1>
      <p className="qp-results-sub">
        {hasPriorClaim
          ? 'Pick one or more — each is $30/mo. Milan onboards you into Everfit for every selected program.'
          : 'Pick one — we\'ll email the PDF. Pick two or more — subscription, first program free forever, Milan onboards you into Everfit.'}
      </p>

      <div className="qp-program-list">
        {matched.map((p, idx) => {
          const selectedIdx = selectedIds.indexOf(p.slug.current)
          const isSelected = selectedIdx !== -1
          const isFirstSelected = selectedIdx === 0
          const showFreePill = !hasPriorClaim && isFirstSelected
          return (
            <label
              key={p._id}
              className={`qp-program-card${isSelected ? ' selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(p.slug.current)}
                aria-label={p.title}
              />
              <div className="qp-program-info">
                <div className="qp-program-title">{p.title}</div>
                {p.summary && <div className="qp-program-sub">{p.summary}</div>}
              </div>
              <div
                className={`qp-program-price${showFreePill ? ' free' : ''}`}
                data-testid={`price-${idx}`}
              >
                {showFreePill ? 'FREE' : '$30/mo'}
              </div>
            </label>
          )
        })}
      </div>

      <div className="qp-cart">
        <div className="qp-cart-row">
          <span className="qp-cart-label">Monthly total</span>
          <span className="qp-cart-amount" data-testid="monthly-total">
            ${(monthlyTotalCents / 100).toFixed(0)}<span className="qp-mo">/mo</span>
          </span>
        </div>
        <p className="qp-cart-note">
          {selectedIds.length === 0 && 'Pick at least one program to continue.'}
          {hasPriorClaim && selectedIds.length >= 1 &&
            `${selectedIds.length} program${selectedIds.length > 1 ? 's' : ''} · $30/mo each · Milan personally onboards you into Everfit within 24 hours.`}
          {!hasPriorClaim && selectedIds.length === 1 && 'One program — we\'ll email it as a PDF. No Everfit access.'}
          {!hasPriorClaim && selectedIds.length >= 2 &&
            `${selectedIds.length} programs · first free forever · Milan personally onboards you into Everfit within 24 hours.`}
        </p>
        <button
          disabled={!canContinue}
          onClick={() => onSubmit({ program_ids: selectedIds, path })}
          className="qp-cta"
        >
          {path === 'free' ? 'Get my free program' : 'Continue to payment'}
        </button>
        <div className="qp-cart-disclaimer">
          Non-refundable. Cancel anytime via the Stripe Portal — access continues to the end of the current billing period.
        </div>
      </div>
    </section>
  )
}
