import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
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
