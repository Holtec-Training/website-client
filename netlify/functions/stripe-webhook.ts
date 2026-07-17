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

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'ok' }
  }

  const s = stripeEvent.data.object as Stripe.Checkout.Session
  const m = s.metadata ?? {}
  const dossier = {
    first_name: m.first_name ?? '',
    last_name: m.last_name ?? '',
    email: s.customer_email ?? '',
    phone: m.phone ?? '',
    free_program_id: m.free_program_id ?? '',
    paid_program_ids: (m.paid_program_ids ?? '').split(',').filter(Boolean),
    amount_cents: s.amount_total ?? 0,
    currency: s.currency ?? 'nzd',
    stripe_checkout_session_id: s.id,
    stripe_payment_intent_id: typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent?.id ?? '',
    session_id: m.session_id ?? '',
    src: m.src ?? '',
    paid_at: new Date((s.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
  }

  const url = process.env.N8N_PROGRAM_PURCHASED_URL
  const n8nSecret = process.env.N8N_PROGRAM_PURCHASED_SECRET
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
