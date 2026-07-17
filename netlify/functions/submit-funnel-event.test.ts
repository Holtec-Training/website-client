import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from './submit-funnel-event'

const invoke = (body: unknown, method = 'POST') =>
  (handler as unknown as (e: Record<string, unknown>) => Promise<{ statusCode: number; body: string }>)({
    httpMethod: method,
    body: JSON.stringify(body),
  })

describe('submit-funnel-event', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'ok' }))
    process.env.N8N_FUNNEL_EVENT_URL = 'https://mock-n8n.example.test/webhook/funnel-event'
    process.env.N8N_FUNNEL_EVENT_SECRET = 'test-secret'
  })

  it('rejects non-POST', async () => {
    const res = await invoke({}, 'GET')
    expect(res.statusCode).toBe(405)
  })

  it('forwards body verbatim with X-Webhook-Secret', async () => {
    await invoke({ event: 'page_viewed' })
    const [url, init] = (fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0]
    expect(url).toBe('https://mock-n8n.example.test/webhook/funnel-event')
    expect((init.headers as Record<string, string>)['X-Webhook-Secret']).toBe('test-secret')
    expect(init.body).toBe(JSON.stringify({ event: 'page_viewed' }))
  })

  it('returns 200 ok even if upstream is slow (fire-and-forget)', async () => {
    const res = await invoke({ event: 'page_viewed' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toBe('ok')
  })

  it('returns 500 when env vars missing', async () => {
    delete process.env.N8N_FUNNEL_EVENT_URL
    const res = await invoke({ event: 'page_viewed' })
    expect(res.statusCode).toBe(500)
  })
})
