import type { Handler } from '@netlify/functions'
import { withSecurity } from './_lib/security'

const rawHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  const url = process.env.N8N_CHECK_EMAIL_URL
  const secret = process.env.N8N_CHECK_EMAIL_SECRET
  if (!url) return { statusCode: 500, body: 'Webhook not configured' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-Program-Portal-Secret': secret } : {}),
      },
      body: event.body ?? '',
    })
    const body = await res.text()
    if (!res.ok) return { statusCode: 500, body: 'Upstream error' }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body,
    }
  } catch {
    return { statusCode: 500, body: 'Request failed' }
  }
}

// No Turnstile — fires as part of ContactStep flow where a challenge would add
// friction to the normal quiz journey. Rate limit is generous because power
// users may retry after mistyping their email.
export const handler = withSecurity({
  endpointKey: 'check-email',
  rateLimit: { requests: 20, windowSeconds: 3600 },
  requireTurnstile: false,
}, rawHandler)
