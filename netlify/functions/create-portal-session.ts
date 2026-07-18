import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'

interface Body {
  stripe_customer_id: string
  return_url?: string
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  const sharedSecret = process.env.PORTAL_SESSION_SHARED_SECRET
  if (!sharedSecret) return { statusCode: 500, body: 'Not configured' }

  const provided = event.headers?.['x-webhook-secret'] ?? event.headers?.['X-Webhook-Secret']
  if (provided !== sharedSecret) return { statusCode: 401, body: 'Unauthorized' }

  if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 500, body: 'Stripe not configured' }

  let body: Body
  try { body = JSON.parse(event.body ?? '{}') } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  if (!body.stripe_customer_id) return { statusCode: 400, body: 'Missing stripe_customer_id' }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const portal = await stripe.billingPortal.sessions.create({
    customer: body.stripe_customer_id,
    return_url: body.return_url ?? process.env.PROGRAM_PORTAL_RETURN_URL ?? 'https://holtectraining.co.nz/programs',
  })

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: portal.url }),
  }
}
