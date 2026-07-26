import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handler } from '../check-email'

const invoke = (body: unknown, method = 'POST') =>
  (handler as unknown as (e: Record<string, unknown>) => Promise<{ statusCode: number; body: string }>)({
    httpMethod: method,
    body: JSON.stringify(body),
  })

describe('check-email', () => {
  beforeEach(() => {
    process.env.N8N_CHECK_EMAIL_URL = 'https://mock-n8n.example.test/webhook/check-email'
    process.env.N8N_CHECK_EMAIL_SECRET = 'test-secret'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ status: 'available' }),
    }))
  })

  it('rejects non-POST', async () => {
    const res = await invoke({}, 'GET')
    expect(res.statusCode).toBe(405)
  })

  it('forwards body + secret to n8n', async () => {
    await invoke({ email: 'jane@example.com', session_id: 's', src: 'nav' })
    const [url, init] = (fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0]
    expect(url).toBe('https://mock-n8n.example.test/webhook/check-email')
    expect((init.headers as Record<string, string>)['X-Program-Portal-Secret']).toBe('test-secret')
    expect(JSON.parse(init.body as string)).toEqual({ email: 'jane@example.com', session_id: 's', src: 'nav' })
  })

  it('RELAYS available response verbatim', async () => {
    const res = await invoke({ email: 'jane@example.com', session_id: 's', src: 'nav' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ status: 'available' })
  })

  it('RELAYS claimed response verbatim', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ status: 'claimed', program_title: 'Fat Loss Blueprint', claimed_at: '2026-07-15' }),
    })
    const res = await invoke({ email: 'jane@example.com', session_id: 's', src: 'nav' })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ status: 'claimed', program_title: 'Fat Loss Blueprint', claimed_at: '2026-07-15' })
  })

  it('returns 500 on upstream failure', async () => {
    ;(fetch as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce({ ok: false, text: async () => 'boom' })
    const res = await invoke({ email: 'jane@example.com', session_id: 's', src: 'nav' })
    expect(res.statusCode).toBe(500)
  })

  it('returns 500 when env vars missing', async () => {
    delete process.env.N8N_CHECK_EMAIL_URL
    const res = await invoke({ email: 'jane@example.com', session_id: 's', src: 'nav' })
    expect(res.statusCode).toBe(500)
  })
})
