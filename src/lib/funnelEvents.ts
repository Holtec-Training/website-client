import { getOrCreateSessionId } from './sessionId'

/**
 * Anonymous funnel-event payload. **No PII by design** — session_id + src + location
 * is enough to trace a customer's journey and slice by attribution.
 *
 * Program participation is captured via role-specific fields:
 *   - matched_program_ids  → on `results_displayed`: every program the scorer surfaced
 *   - free_program_id      → on `free_selected` / `subscription_created`: the one program
 *                            the customer received / receives free
 *   - paid_program_ids     → on `checkout_initiated` / `subscription_created`: additional
 *                            programs the customer added (each billed $30/mo)
 *
 * `extras` is a free-form object for event-specific data (prior-claim details, etc.).
 * **Never put email / first_name / last_name / phone into `extras`** — PII belongs in
 * the Fulfilment Log, not the Funnel Log.
 */
export interface FunnelEventExtras {
  src: string
  /** Physical location where the QR / link originated — e.g. 'ellerslie', 'newmarket'.
   * Independent of `src`. Absent for organic / no-location traffic. */
  location?: string
  /** For `free_selected` and `subscription_created` — the promo'd / free program slug.
   * Blank on all other events. */
  free_program_id?: string
  /** For `checkout_initiated` and `subscription_created` — programs billed at $30/mo.
   * Blank on all other events. */
  paid_program_ids?: string[]
  /** For `results_displayed` — every program the scorer showed. Blank elsewhere. */
  matched_program_ids?: string[]
  stripe_checkout_session_id?: string
  /** For `subscription_created` — the exact amount Stripe billed on the first invoice,
   * in cents. Populated from `session.amount_total` on the webhook, not our own math. */
  amount_cents?: number
  extras?: Record<string, unknown>
}

export async function fireFunnelEvent(event: string, ex: FunnelEventExtras): Promise<void> {
  const body = {
    event,
    session_id: getOrCreateSessionId(),
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent,
    ...ex,
  }
  try {
    await fetch('/api/funnel-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // fire-and-forget
  }
}
