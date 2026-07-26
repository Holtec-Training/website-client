import type { Handler } from '@netlify/functions'
import { withSecurity } from './_lib/security'

const rawHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const webhookUrl = process.env.N8N_CONTACT_URL
  const webhookSecret = process.env.N8N_CONTACT_SECRET

  if (!webhookUrl) {
    return { statusCode: 500, body: 'Webhook not configured' }
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (webhookSecret) {
      headers['X-Webhook-Secret'] = webhookSecret
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: event.body,
    })

    if (!res.ok) {
      return { statusCode: 500, body: 'Upstream error' }
    }

    return { statusCode: 200, body: 'ok' }
  } catch {
    return { statusCode: 500, body: 'Request failed' }
  }
}

// Contact form is a prime spam target. Tight defaults:
//   - Rate limit: 3/hr per IP — legitimate visitors submit once, retries are rare
//   - Turnstile: yes — contact forms are the classic bot magnet
// If a real visitor hits the rate limit, they can email Milan directly.
export const handler = withSecurity({
  endpointKey: 'contact',
  rateLimit: { requests: 3, windowSeconds: 3600 },
  requireTurnstile: true,
}, rawHandler)
