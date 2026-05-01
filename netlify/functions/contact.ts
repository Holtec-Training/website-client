import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET

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
