import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'

interface Body {
  stripe_customer_id: string
  return_url?: string
}

// Compute the URL Stripe should send the customer back to after they finish
// managing their subscription in the Portal. Priority:
//   1. Request-supplied return_url (workflow can override per-call)
//   2. PROGRAM_PORTAL_RETURN_URL env var (explicit override for this Function)
//   3. `${HOLTEC_ENDPOINT}/programs` — derived from the site's base URL
// If none resolve, we return 500. No hardcoded fallback.
function resolveReturnUrl(bodyReturnUrl?: string): string | null {
  if (bodyReturnUrl) return bodyReturnUrl
  if (process.env.PROGRAM_PORTAL_RETURN_URL) return process.env.PROGRAM_PORTAL_RETURN_URL
  if (process.env.HOLTEC_ENDPOINT) return `${process.env.HOLTEC_ENDPOINT}/programs`
  return null
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  const sharedSecret = process.env.PORTAL_SESSION_SHARED_SECRET
  if (!sharedSecret) return { statusCode: 500, body: 'Not configured' }

  // Netlify normalises header names to lowercase, but be defensive and accept
  // either case in case that changes.
  const provided = event.headers?.['x-program-portal-secret'] ?? event.headers?.['X-Program-Portal-Secret']
  if (provided !== sharedSecret) return { statusCode: 401, body: 'Unauthorized' }

  if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 500, body: 'Stripe not configured' }

  let body: Body
  try { body = JSON.parse(event.body ?? '{}') } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  if (!body.stripe_customer_id) return { statusCode: 400, body: 'Missing stripe_customer_id' }

  const returnUrl = resolveReturnUrl(body.return_url)
  if (!returnUrl) {
    return { statusCode: 500, body: 'No return URL configured (set HOLTEC_ENDPOINT or PROGRAM_PORTAL_RETURN_URL)' }
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const portal = await stripe.billingPortal.sessions.create({
    customer: body.stripe_customer_id,
    return_url: returnUrl,
  })

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: portal.url }),
  }
}
