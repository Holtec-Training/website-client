import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  const url = process.env.N8N_CHECK_EMAIL_URL
  const secret = process.env.N8N_CHECK_EMAIL_SECRET
  if (!url) return { statusCode: 500, body: 'Webhook not configured' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-Webhook-Secret': secret } : {}),
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
