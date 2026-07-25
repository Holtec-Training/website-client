import { describe, it, expect, vi, beforeEach } from 'vitest'

const { sessionsCreate, promoList, sanityFetch } = vi.hoisted(() => ({
  sessionsCreate: vi.fn(),
  promoList: vi.fn(),
  sanityFetch: vi.fn(),
}))

vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { create: sessionsCreate } }
    promotionCodes = { list: promoList }
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

describe('create-checkout-session (pass 6 — subscription)', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
    sessionsCreate.mockReset().mockResolvedValue({ client_secret: 'cs_test_secret_123' })
    promoList.mockReset().mockResolvedValue({ data: [{ id: 'promo_1AbC' }] })
    sanityFetch.mockReset()
      .mockResolvedValueOnce(['price_a', 'price_b'])  // first call — program price IDs
      .mockResolvedValueOnce({                          // second call — siteConfig
        defaultPromotionCode: 'HOLTEC',
        couponMappings: [{ src: 'poster-ellerslie', promotionCode: 'ELLERSLIE' }],
      })
  })

  it('rejects non-POST', async () => {
    const res = await invoke({}, 'GET')
    expect(res.statusCode).toBe(405)
  })

  it('rejects Path A (< 2 programs)', async () => {
    const res = await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      program_ids: ['solo'], session_id: 's', src: 'nav',
    })
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatch(/2\+ program/)
  })

  it('creates a Stripe subscription with recurring line-items in embedded ui_mode', async () => {
    await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com', phone: '+64 21 000',
      program_ids: ['program-fat-loss', 'program-strength'],
      session_id: 's-uuid', src: 'poster-ellerslie',
    })
    const arg = sessionsCreate.mock.calls[0][0]
    expect(arg.mode).toBe('subscription')
    expect(arg.ui_mode).toBe('embedded_page')
    expect(arg.return_url).toMatch(/programs\/thanks/)
    expect(arg.line_items).toEqual([
      { price: 'price_a', quantity: 1 },
      { price: 'price_b', quantity: 1 },
    ])
    expect(arg.customer_email).toBe('j@x.com')
    // Embedded checkout must NOT use success_url / cancel_url (Stripe rejects that combo)
    expect(arg.success_url).toBeUndefined()
    expect(arg.cancel_url).toBeUndefined()
  })

  it('resolves the src-specific promotion code and applies it as discounts', async () => {
    await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      program_ids: ['a', 'b'], session_id: 's', src: 'poster-ellerslie',
    })
    expect(promoList).toHaveBeenCalledWith({ code: 'ELLERSLIE', active: true, limit: 1 })
    const arg = sessionsCreate.mock.calls[0][0]
    expect(arg.discounts).toEqual([{ promotion_code: 'promo_1AbC' }])
  })

  it('falls back to defaultPromotionCode when src has no mapping', async () => {
    await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      program_ids: ['a', 'b'], session_id: 's', src: 'unmatched-source',
    })
    expect(promoList).toHaveBeenCalledWith({ code: 'HOLTEC', active: true, limit: 1 })
  })

  it('metadata carries program_ids csv + promotion_code + attribution', async () => {
    await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com', phone: '+64 21 000',
      program_ids: ['a', 'b'], session_id: 's-uuid', src: 'poster-ellerslie',
    })
    const arg = sessionsCreate.mock.calls[0][0]
    expect(arg.metadata).toEqual({
      session_id: 's-uuid',
      src: 'poster-ellerslie',
      location: '',
      program_ids: 'a,b',
      first_name: 'Jane',
      last_name: 'Doe',
      phone: '+64 21 000',
      promotion_code: 'ELLERSLIE',
      has_prior_claim: 'false',
    })
    expect(arg.subscription_data?.metadata).toMatchObject({
      session_id: 's-uuid', src: 'poster-ellerslie', program_ids: 'a,b', has_prior_claim: 'false',
    })
  })

  it('returns the client_secret for embedded checkout initialisation', async () => {
    const res = await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      program_ids: ['a', 'b'], session_id: 's', src: 'nav',
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ client_secret: 'cs_test_secret_123' })
  })

  it('500 when defaultPromotionCode is missing in siteConfig', async () => {
    sanityFetch.mockReset()
      .mockResolvedValueOnce(['price_a', 'price_b'])
      .mockResolvedValueOnce({ defaultPromotionCode: '', couponMappings: [] })
    const res = await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      program_ids: ['a', 'b'], session_id: 's', src: 'nav',
    })
    expect(res.statusCode).toBe(500)
  })

  it('500 when promotion code is not found in Stripe', async () => {
    promoList.mockResolvedValueOnce({ data: [] })
    const res = await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      program_ids: ['a', 'b'], session_id: 's', src: 'nav',
    })
    expect(res.statusCode).toBe(500)
    expect(res.body).toMatch(/HOLTEC/)
  })

  it('400 when a program is missing a stripePriceId in Sanity', async () => {
    sanityFetch.mockReset()
      .mockResolvedValueOnce(['price_a'])  // only 1 returned for 2 requested
      .mockResolvedValueOnce({ defaultPromotionCode: 'HOLTEC', couponMappings: [] })
    const res = await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      program_ids: ['a', 'b'], session_id: 's', src: 'nav',
    })
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatch(/missing stripePriceId/)
  })

  it('500 if STRIPE_SECRET_KEY unset', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const res = await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      program_ids: ['a', 'b'], session_id: 's', src: 'nav',
    })
    expect(res.statusCode).toBe(500)
  })

  describe('has_prior_claim: true (customer already claimed free program)', () => {
    beforeEach(() => {
      sanityFetch.mockReset()
        .mockResolvedValueOnce(['price_a'])  // program price IDs (1 program)
      // NOTE: no siteConfig fetch expected — prior-claim skips promo lookup entirely
    })

    it('allows a single-program subscription (min drops from 2 to 1)', async () => {
      const res = await invoke({
        first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
        program_ids: ['a'], session_id: 's', src: 'nav',
        has_prior_claim: true,
      })
      expect(res.statusCode).toBe(200)
      expect(sessionsCreate).toHaveBeenCalled()
    })

    it('does NOT fetch siteConfig or call promotionCodes.list', async () => {
      await invoke({
        first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
        program_ids: ['a'], session_id: 's', src: 'nav',
        has_prior_claim: true,
      })
      expect(sanityFetch).toHaveBeenCalledTimes(1)  // only the price lookup
      expect(promoList).not.toHaveBeenCalled()
    })

    it('does NOT apply a discount to the Checkout Session', async () => {
      await invoke({
        first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
        program_ids: ['a'], session_id: 's', src: 'nav',
        has_prior_claim: true,
      })
      const arg = sessionsCreate.mock.calls[0][0]
      expect(arg.discounts).toBeUndefined()
    })

    it('metadata.has_prior_claim is "true" and promotion_code is empty', async () => {
      await invoke({
        first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
        program_ids: ['a'], session_id: 's', src: 'nav',
        has_prior_claim: true,
      })
      const arg = sessionsCreate.mock.calls[0][0]
      expect(arg.metadata.has_prior_claim).toBe('true')
      expect(arg.metadata.promotion_code).toBe('')
      expect(arg.subscription_data.metadata.has_prior_claim).toBe('true')
    })

    it('still rejects 0 programs', async () => {
      const res = await invoke({
        first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
        program_ids: [], session_id: 's', src: 'nav',
        has_prior_claim: true,
      })
      expect(res.statusCode).toBe(400)
    })
  })

  it('fresh customer submission still requires 2+ programs (unchanged)', async () => {
    sanityFetch.mockReset()
    const res = await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      program_ids: ['solo'], session_id: 's', src: 'nav',
      // no has_prior_claim — defaults to false
    })
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatch(/2\+ program/)
  })

  it('metadata.has_prior_claim is "false" for fresh customers', async () => {
    await invoke({
      first_name: 'Jane', last_name: 'Doe', email: 'j@x.com',
      program_ids: ['a', 'b'], session_id: 's', src: 'nav',
    })
    const arg = sessionsCreate.mock.calls[0][0]
    expect(arg.metadata.has_prior_claim).toBe('false')
  })
})
