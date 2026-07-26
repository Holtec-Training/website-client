import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const secret = process.env.STRIPE_SECRET_KEY
  const signingSecret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET
  if (!secret || !signingSecret) return { statusCode: 500, body: 'Stripe not configured' }

  const signature = event.headers['stripe-signature'] ?? ''
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
    : (event.body ?? '')

  const stripe = new Stripe(secret)
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, signingSecret)
  } catch {
    return { statusCode: 400, body: 'Bad signature' }
  }

  // Pass 6: only checkout.session.completed for mode:subscription is handled.
  // Renewals, cancellations, failed payments are Milan's territory via the Stripe dashboard.
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'ok' }
  }

  const s = stripeEvent.data.object as Stripe.Checkout.Session
  if (s.mode !== 'subscription') {
    return { statusCode: 200, body: 'ok' }
  }

  const m = s.metadata ?? {}
  const programIds = (m.program_ids ?? '').split(',').filter(Boolean)
  const hasPriorClaim = m.has_prior_claim === 'true'
  // Path B (fresh customer): first program is the one the promo code discounts to $0.
  // Path B (prior-claim customer): no promo applied — all programs are paid.
  const freeProgramId = hasPriorClaim ? '' : (programIds[0] ?? '')
  const paidProgramIds = hasPriorClaim ? programIds : programIds.slice(1)

  const dossier = {
    first_name: m.first_name ?? '',
    last_name: m.last_name ?? '',
    email: s.customer_email ?? '',
    phone: m.phone ?? '',
    program_ids: programIds,
    free_program_id: freeProgramId,
    paid_program_ids: paidProgramIds,
    program_count: programIds.length,
    currency: s.currency ?? 'nzd',
    // Stripe-authoritative amount — what Stripe actually billed on the first invoice,
    // net of any discount code. Same value hits Milan's Stripe account.
    // For our monthly billing case with no proration + coupon duration: forever,
    // this ALSO equals the recurring monthly amount.
    amount_cents: s.amount_total ?? 0,
    has_prior_claim: hasPriorClaim,
    stripe_checkout_session_id: s.id,
    stripe_customer_id: typeof s.customer === 'string' ? s.customer : s.customer?.id ?? '',
    stripe_subscription_id: typeof s.subscription === 'string' ? s.subscription : s.subscription?.id ?? '',
    promotion_code: m.promotion_code ?? '',
    session_id: m.session_id ?? '',
    src: m.src ?? '',
    location: m.location ?? '',
    subscribed_at: new Date((s.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
  }

  const url = process.env.N8N_SUBSCRIPTION_CREATED_URL
  const n8nSecret = process.env.N8N_SUBSCRIPTION_CREATED_SECRET
  if (url) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(n8nSecret ? { 'X-Program-Portal-Secret': n8nSecret } : {}),
        },
        body: JSON.stringify(dossier),
      })
    } catch {
      return { statusCode: 500, body: 'Forward failed' }
    }
  }

  return { statusCode: 200, body: 'ok' }
}
