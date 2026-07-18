import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'

const PROGRAM_PRICE_CENTS = 3000

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
  const chargedCount = Math.max(0, programIds.length - 1)

  const dossier = {
    first_name: m.first_name ?? '',
    last_name: m.last_name ?? '',
    email: s.customer_email ?? '',
    phone: m.phone ?? '',
    program_ids: programIds,
    free_program_slug: programIds[0] ?? '',
    paid_program_slugs: programIds.slice(1),
    program_count: programIds.length,
    currency: s.currency ?? 'nzd',
    monthly_amount_cents: chargedCount * PROGRAM_PRICE_CENTS,
    stripe_checkout_session_id: s.id,
    stripe_customer_id: typeof s.customer === 'string' ? s.customer : s.customer?.id ?? '',
    stripe_subscription_id: typeof s.subscription === 'string' ? s.subscription : s.subscription?.id ?? '',
    promotion_code: m.promotion_code ?? '',
    session_id: m.session_id ?? '',
    src: m.src ?? '',
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
          ...(n8nSecret ? { 'X-Webhook-Secret': n8nSecret } : {}),
        },
        body: JSON.stringify(dossier),
      })
    } catch {
      return { statusCode: 500, body: 'Forward failed' }
    }
  }

  return { statusCode: 200, body: 'ok' }
}
