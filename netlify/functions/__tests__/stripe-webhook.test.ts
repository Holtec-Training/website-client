import { describe, it, expect, vi, beforeEach } from 'vitest'

const { constructEvent } = vi.hoisted(() => ({ constructEvent: vi.fn() }))
vi.mock('stripe', () => {
  class StripeMock {
    webhooks = { constructEvent }
    static webhooks = { constructEvent }
  }
  return { default: StripeMock }
})

import { handler } from '../stripe-webhook'

const invoke = (body: string, signature: string, method = 'POST', isBase64 = false) =>
  (handler as unknown as (e: Record<string, unknown>) => Promise<{ statusCode: number; body: string }>)({
    httpMethod: method,
    body: isBase64 ? Buffer.from(body).toString('base64') : body,
    isBase64Encoded: isBase64,
    headers: { 'stripe-signature': signature },
  })

describe('stripe-webhook (pass 6 — subscription)', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
    process.env.STRIPE_WEBHOOK_SIGNING_SECRET = 'whsec_xxx'
    process.env.N8N_SUBSCRIPTION_CREATED_URL = 'https://mock-n8n.example.test/webhook/subscription-created'
    process.env.N8N_SUBSCRIPTION_CREATED_SECRET = 'n8n-secret'
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

  it('ignores non-checkout.session.completed events with 200', async () => {
    constructEvent.mockReturnValue({ type: 'invoice.payment_succeeded' })
    const res = await invoke('{}', 'sig')
    expect(res.statusCode).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('ignores checkout.session.completed events with mode: payment (one-time)', async () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { mode: 'payment', id: 'cs_1' } },
    })
    const res = await invoke('{}', 'sig')
    expect(res.statusCode).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('forwards a subscription dossier to n8n on checkout.session.completed (mode: subscription)', async () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          id: 'cs_test_1',
          customer_email: 'j@x.com',
          customer: 'cus_123',
          subscription: 'sub_456',
          currency: 'nzd',
          created: 1721001600,
          amount_total: 6000,
          metadata: {
            session_id: 's-uuid',
            src: 'poster-ellerslie',
            location: 'ellerslie',
            program_ids: 'p1,p2,p3',
            has_prior_claim: 'false',
            first_name: 'Jane',
            last_name: 'Doe',
            phone: '+64',
            promotion_code: 'ELLERSLIE',
          },
        },
      },
    })
    await invoke('{}', 'sig')
    const [url, init] = (fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0]
    expect(url).toBe('https://mock-n8n.example.test/webhook/subscription-created')
    expect((init.headers as Record<string, string>)['X-Program-Portal-Secret']).toBe('n8n-secret')
    const body = JSON.parse(init.body as string)
    expect(body).toEqual({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com', phone: '+64',
      program_ids: ['p1', 'p2', 'p3'],
      free_program_id: 'p1',
      paid_program_ids: ['p2', 'p3'],
      program_count: 3,
      currency: 'nzd',
      amount_cents: 6000,
      has_prior_claim: false,
      stripe_checkout_session_id: 'cs_test_1',
      stripe_customer_id: 'cus_123',
      stripe_subscription_id: 'sub_456',
      promotion_code: 'ELLERSLIE',
      session_id: 's-uuid',
      src: 'poster-ellerslie',
      location: 'ellerslie',
      subscribed_at: new Date(1721001600 * 1000).toISOString(),
    })
  })

  it('prior-claim path: all programs are paid, none free', async () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          id: 'cs_pc',
          customer_email: 'p@c.com',
          customer: 'cus_pc',
          subscription: 'sub_pc',
          currency: 'nzd',
          created: 1721001600,
          amount_total: 6000,
          metadata: {
            session_id: 's-pc',
            src: 'nav',
            location: '',
            program_ids: 'x,y',
            has_prior_claim: 'true',
            first_name: '', last_name: '', phone: '', promotion_code: '',
          },
        },
      },
    })
    await invoke('{}', 'sig')
    const body = JSON.parse((fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0][1].body as string)
    expect(body.free_program_id).toBe('')
    expect(body.paid_program_ids).toEqual(['x', 'y'])
    expect(body.has_prior_claim).toBe(true)
    expect(body.amount_cents).toBe(6000)
  })

  it('handles customer/subscription as objects (not just string IDs)', async () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          id: 'cs_2',
          customer_email: 'x@y.com',
          customer: { id: 'cus_obj_1' },
          subscription: { id: 'sub_obj_1' },
          currency: 'nzd',
          created: 1721000000,
          amount_total: 3000,
          metadata: { program_ids: 'a,b', has_prior_claim: 'false', first_name: '', last_name: '', phone: '', promotion_code: 'HOLTEC', session_id: '', src: '', location: '' },
        },
      },
    })
    await invoke('{}', 'sig')
    const body = JSON.parse((fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0][1].body as string)
    expect(body.stripe_customer_id).toBe('cus_obj_1')
    expect(body.stripe_subscription_id).toBe('sub_obj_1')
  })
})
