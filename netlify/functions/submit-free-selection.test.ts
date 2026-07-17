import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from './submit-free-selection'

const invoke = (body: unknown, method = 'POST') =>
  (handler as unknown as (e: Record<string, unknown>) => Promise<{ statusCode: number; body: string }>)({
    httpMethod: method,
    body: JSON.stringify(body),
  })

describe('submit-free-selection', () => {
  beforeEach(() => {
    process.env.N8N_FREE_SELECTION_URL = 'https://mock-n8n.example.test/webhook/free-selection'
    process.env.N8N_FREE_SELECTION_SECRET = 'test-secret'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ status: 'ok', message: 'sent' }),
    }))
  })

  it('rejects non-POST', async () => {
    const res = await invoke({}, 'GET')
    expect(res.statusCode).toBe(405)
  })

  it('forwards body + secret to n8n', async () => {
    await invoke({ email: 'jane@example.com', program_id: 'p1' })
    const [url, init] = (fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0]
    expect(url).toBe('https://mock-n8n.example.test/webhook/free-selection')
    expect((init.headers as Record<string, string>)['X-Webhook-Secret']).toBe('test-secret')
  })

  it('RELAYS upstream body verbatim (not hardcoded "ok")', async () => {
    const res = await invoke({ email: 'jane@example.com' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toBe(JSON.stringify({ status: 'ok', message: 'sent' }))
  })

  it('returns 500 on upstream failure', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce({ ok: false, text: async () => 'boom' })
    const res = await invoke({ email: 'jane@example.com' })
    expect(res.statusCode).toBe(500)
  })
})
