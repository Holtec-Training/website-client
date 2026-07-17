import { describe, it, expect, vi, beforeEach } from 'vitest'

const { constructEvent } = vi.hoisted(() => ({ constructEvent: vi.fn() }))
vi.mock('stripe', () => {
  class StripeMock {
    webhooks = { constructEvent }
    static webhooks = { constructEvent }
  }
  return { default: StripeMock }
})

import { handler } from './stripe-webhook'

const invoke = (body: string, signature: string, method = 'POST', isBase64 = false) =>
  (handler as unknown as (e: Record<string, unknown>) => Promise<{ statusCode: number; body: string }>)({
    httpMethod: method,
    body: isBase64 ? Buffer.from(body).toString('base64') : body,
    isBase64Encoded: isBase64,
    headers: { 'stripe-signature': signature },
  })

describe('stripe-webhook', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
    process.env.STRIPE_WEBHOOK_SIGNING_SECRET = 'whsec_xxx'
    process.env.N8N_PROGRAM_PURCHASED_URL = 'https://mock-n8n.example.test/webhook/program-purchased'
    process.env.N8N_PROGRAM_PURCHASED_SECRET = 'n8n-secret'
    constructEvent.mockReset()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'ok' }))
  })

  it('rejects non-POST', async () => {
    const res = await invoke('{}', 'sig', 'GET')
    expect(res.statusCode).toBe(405)
  })

  it('returns 400 on bad signature', async () => {
    constructEvent.mockImplementation(() => { throw new Error('bad sig') })
    const res = await invoke('{"raw":true}', 'bad')
    expect(res.statusCode).toBe(400)
  })

  it('verifies against exact raw body bytes', async () => {
    const raw = '{"raw":"bytes"}'
    constructEvent.mockReturnValue({ type: 'other' })
    await invoke(raw, 'sig')
    expect(constructEvent).toHaveBeenCalledWith(raw, 'sig', 'whsec_xxx')
  })

  it('decodes base64 body before verification', async () => {
    const raw = '{"raw":"bytes"}'
    constructEvent.mockReturnValue({ type: 'other' })
    await invoke(raw, 'sig', 'POST', true)
    expect(constructEvent).toHaveBeenCalledWith(raw, 'sig', 'whsec_xxx')
  })

  it('ignores non-checkout.session.completed events with 200', async () => {
    constructEvent.mockReturnValue({ type: 'payment_intent.succeeded' })
    const res = await invoke('{}', 'sig')
    expect(res.statusCode).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('forwards a dossier to n8n on checkout.session.completed', async () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          customer_email: 'j@x.com',
          amount_total: 3000,
          currency: 'nzd',
          payment_intent: 'pi_1',
          created: 1721001600,
          metadata: {
            session_id: 's-uuid',
            src: 'poster-newmarket',
            free_program_id: 'p-free',
            paid_program_ids: 'p1,p2',
            first_name: 'Jane',
            last_name: 'Doe',
            phone: '+64',
          },
        },
      },
    })
    await invoke('{}', 'sig')
    const [url, init] = (fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0]
    expect(url).toBe('https://mock-n8n.example.test/webhook/program-purchased')
    expect((init.headers as Record<string, string>)['X-Webhook-Secret']).toBe('n8n-secret')
    const body = JSON.parse(init.body as string)
    expect(body).toEqual({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com', phone: '+64',
      free_program_id: 'p-free', paid_program_ids: ['p1', 'p2'],
      amount_cents: 3000, currency: 'nzd',
      stripe_checkout_session_id: 'cs_test_1',
      stripe_payment_intent_id: 'pi_1',
      session_id: 's-uuid', src: 'poster-newmarket',
      paid_at: new Date(1721001600 * 1000).toISOString(),
    })
  })
})
