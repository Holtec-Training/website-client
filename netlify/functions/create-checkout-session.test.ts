import { describe, it, expect, vi, beforeEach } from 'vitest'

const { sessionsCreate, sanityFetch } = vi.hoisted(() => ({
  sessionsCreate: vi.fn(),
  sanityFetch: vi.fn(),
}))
vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: sessionsCreate } }
  },
}))
vi.mock('./_lib/sanityServer', () => ({
  sanityServer: { fetch: (...a: unknown[]) => sanityFetch(...a) },
}))

import { handler } from './create-checkout-session'

const invoke = (body: unknown, method = 'POST') =>
  (handler as unknown as (e: Record<string, unknown>) => Promise<{ statusCode: number; body: string }>)({
    httpMethod: method,
    body: JSON.stringify(body),
  })

describe('create-checkout-session', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
    sessionsCreate.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/cs_test' })
    sanityFetch.mockReset().mockResolvedValue(['price_abc', 'price_def'])
  })

  it('rejects non-POST', async () => {
    const res = await invoke({}, 'GET')
    expect(res.statusCode).toBe(405)
  })

  it('fetches stripePriceId(s) from Sanity by slug', async () => {
    await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com', phone: '+64 21 000',
      free_program_id: 'p-free', paid_program_ids: ['p-paid-1', 'p-paid-2'],
      session_id: 's', src: 'nav',
    })
    expect(sanityFetch).toHaveBeenCalled()
    const [groq, params] = sanityFetch.mock.calls[0]
    expect(groq).toMatch(/_type == "program"/)
    expect(groq).toMatch(/stripePriceId/)
    expect(params.ids).toEqual(['p-paid-1', 'p-paid-2'])
  })

  it('creates a Checkout Session with the fetched price IDs and metadata carrying attribution', async () => {
    await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com', phone: '+64 21 000',
      free_program_id: 'p-free', paid_program_ids: ['p-paid-1', 'p-paid-2'],
      session_id: 's-uuid', src: 'poster-newmarket',
    })
    const arg = sessionsCreate.mock.calls[0][0]
    expect(arg.mode).toBe('payment')
    expect(arg.line_items).toEqual([
      { price: 'price_abc', quantity: 1 },
      { price: 'price_def', quantity: 1 },
    ])
    expect(arg.customer_email).toBe('j@x.com')
    expect(arg.metadata).toEqual({
      session_id: 's-uuid',
      src: 'poster-newmarket',
      free_program_id: 'p-free',
      paid_program_ids: 'p-paid-1,p-paid-2',
      first_name: 'Jane',
      last_name: 'Doe',
      phone: '+64 21 000',
    })
  })

  it('returns the checkout session URL', async () => {
    const res = await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com', phone: '+64 21 000',
      free_program_id: '', paid_program_ids: ['p'], session_id: 's', src: 'nav',
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ checkout_session_url: 'https://checkout.stripe.com/c/pay/cs_test' })
  })

  it('400 if no paid_program_ids', async () => {
    const res = await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      paid_program_ids: [], session_id: 's', src: 'nav',
    })
    expect(res.statusCode).toBe(400)
  })

  it('500 if STRIPE_SECRET_KEY unset', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const res = await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      paid_program_ids: ['p'], session_id: 's', src: 'nav',
    })
    expect(res.statusCode).toBe(500)
  })
})
