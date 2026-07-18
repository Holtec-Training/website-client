import { describe, it, expect, vi, beforeEach } from 'vitest'

const { portalCreate } = vi.hoisted(() => ({ portalCreate: vi.fn() }))
vi.mock('stripe', () => ({
  default: class {
    billingPortal = { sessions: { create: portalCreate } }
  },
}))

import { handler } from './create-portal-session'

const invoke = (
  body: unknown,
  headers: Record<string, string> = { 'x-webhook-secret': 'shared-test-secret' },
  method = 'POST',
) =>
  (handler as unknown as (e: Record<string, unknown>) => Promise<{ statusCode: number; body: string }>)({
    httpMethod: method,
    body: JSON.stringify(body),
    headers,
  })

describe('create-portal-session', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
    process.env.PORTAL_SESSION_SHARED_SECRET = 'shared-test-secret'
    process.env.PROGRAM_PORTAL_RETURN_URL = 'https://holtectraining.co.nz/programs'
    portalCreate.mockReset().mockResolvedValue({ url: 'https://billing.stripe.com/p/session/test123' })
  })

  it('rejects non-POST', async () => {
    const res = await invoke({ stripe_customer_id: 'cus_1' }, { 'x-webhook-secret': 'shared-test-secret' }, 'GET')
    expect(res.statusCode).toBe(405)
  })

  it('rejects when the shared-secret env is missing (misconfigured deployment)', async () => {
    delete process.env.PORTAL_SESSION_SHARED_SECRET
    const res = await invoke({ stripe_customer_id: 'cus_1' })
    expect(res.statusCode).toBe(500)
  })

  it('rejects requests with wrong X-Webhook-Secret (401)', async () => {
    const res = await invoke({ stripe_customer_id: 'cus_1' }, { 'x-webhook-secret': 'wrong' })
    expect(res.statusCode).toBe(401)
  })

  it('rejects when stripe_customer_id is missing (400)', async () => {
    const res = await invoke({})
    expect(res.statusCode).toBe(400)
  })

  it('creates a Stripe billing portal session and returns the URL', async () => {
    const res = await invoke({ stripe_customer_id: 'cus_abc' })
    expect(portalCreate).toHaveBeenCalledWith({
      customer: 'cus_abc',
      return_url: 'https://holtectraining.co.nz/programs',
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ url: 'https://billing.stripe.com/p/session/test123' })
  })

  it('honours a request-supplied return_url over the env default', async () => {
    await invoke({ stripe_customer_id: 'cus_abc', return_url: 'https://custom.example.test/back' })
    expect(portalCreate).toHaveBeenCalledWith({
      customer: 'cus_abc',
      return_url: 'https://custom.example.test/back',
    })
  })

  it('500 when STRIPE_SECRET_KEY is unset', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const res = await invoke({ stripe_customer_id: 'cus_1' })
    expect(res.statusCode).toBe(500)
  })
})
