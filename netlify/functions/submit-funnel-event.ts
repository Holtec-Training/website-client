import type { Handler } from '@netlify/functions'
import { withSecurity } from './_lib/security'

const rawHandler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  const url = process.env.N8N_FUNNEL_EVENT_URL
  const secret = process.env.N8N_FUNNEL_EVENT_SECRET
  if (!url) return { statusCode: 500, body: 'Webhook not configured' }
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-Program-Portal-Secret': secret } : {}),
      },
      body: event.body ?? '',
    })
    return { statusCode: 200, body: 'ok' }
  } catch {
    return { statusCode: 200, body: 'ok' } // fire-and-forget — don't error the browser
  }
}

// Generous rate limit — the normal quiz flow fires 8-12 funnel events per
// visitor per session. 300/hr per IP allows multi-session testing without
// tripping the limit while still stopping a flood.
// No Turnstile — too much friction for a fire-and-forget signal.
export const handler = withSecurity({
  endpointKey: 'funnel-event',
  rateLimit: { requests: 300, windowSeconds: 3600 },
  requireTurnstile: false,
}, rawHandler)
