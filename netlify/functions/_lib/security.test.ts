import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withSecurity } from './security'

// Test helper — a trivial handler that returns 200 with the raw event body so
// we can assert whether or not the security wrapper let the request through.
const passthrough = async (event: any) => ({
  statusCode: 200,
  body: JSON.stringify({ received: event.body }),
})

const invoke = (
  handler: any,
  {
    origin = 'https://holtectraining.co.nz',
    turnstileToken,
    body = '{}',
    ip = '203.0.113.42',
  }: { origin?: string | null; turnstileToken?: string; body?: string; ip?: string } = {},
) => {
  const headers: Record<string, string> = { 'x-nf-client-connection-ip': ip }
  if (origin) headers['origin'] = origin
  if (turnstileToken) headers['x-turnstile-token'] = turnstileToken
  return handler({ httpMethod: 'POST', headers, body }, {} as any)
}

const clearSecurityEnv = () => {
  delete process.env.NETLIFY_ALLOWED_ORIGINS
  delete process.env.NETLIFY_DEV
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  delete process.env.TURNSTILE_SECRET_KEY
}

describe('withSecurity — permissive fallbacks (no env vars set)', () => {
  beforeEach(() => clearSecurityEnv())

  it('lets requests through when no origin allow-list is configured', async () => {
    const handler = withSecurity({ endpointKey: 'test' }, passthrough)
    const res = await invoke(handler, { origin: 'https://random-attacker.example' })
    expect(res.statusCode).toBe(200)
  })

  it('skips rate limit when Upstash env not set (even if config declared)', async () => {
    const handler = withSecurity(
      { endpointKey: 'test', rateLimit: { requests: 1, windowSeconds: 60 } },
      passthrough,
    )
    // Fire 5 requests — none should be blocked because Upstash isn't configured.
    for (let i = 0; i < 5; i++) {
      const res = await invoke(handler)
      expect(res.statusCode).toBe(200)
    }
  })

  it('skips Turnstile when secret env not set (even if config declared)', async () => {
    const handler = withSecurity(
      { endpointKey: 'test', requireTurnstile: true },
      passthrough,
    )
    // No token supplied on the request — should still pass because Turnstile
    // isn't configured on this environment.
    const res = await invoke(handler, { turnstileToken: undefined })
    expect(res.statusCode).toBe(200)
  })
})

describe('withSecurity — origin check', () => {
  beforeEach(() => {
    clearSecurityEnv()
    process.env.NETLIFY_ALLOWED_ORIGINS = 'https://holtectraining.co.nz,https://deploy-preview-*.netlify.app'
  })

  it('allows requests from the exact production origin', async () => {
    const handler = withSecurity({ endpointKey: 'test' }, passthrough)
    const res = await invoke(handler, { origin: 'https://holtectraining.co.nz' })
    expect(res.statusCode).toBe(200)
  })

  it('allows requests from a matching wildcard preview origin', async () => {
    const handler = withSecurity({ endpointKey: 'test' }, passthrough)
    const res = await invoke(handler, { origin: 'https://deploy-preview-42.netlify.app' })
    expect(res.statusCode).toBe(200)
  })

  it('rejects requests from an off-list origin with 403', async () => {
    const handler = withSecurity({ endpointKey: 'test' }, passthrough)
    const res = await invoke(handler, { origin: 'https://random-attacker.example' })
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).error).toBe('origin_not_allowed')
  })

  it('rejects requests missing an Origin header with 403', async () => {
    const handler = withSecurity({ endpointKey: 'test' }, passthrough)
    const res = await invoke(handler, { origin: null })
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).error).toBe('origin_required')
  })

  it('skips the origin check when serverOnly: true is set', async () => {
    const handler = withSecurity({ endpointKey: 'test', serverOnly: true }, passthrough)
    // No Origin header, still passes because serverOnly bypasses the check.
    const res = await invoke(handler, { origin: null })
    expect(res.statusCode).toBe(200)
  })

  it('skips the origin check when NETLIFY_DEV is true (local dev)', async () => {
    process.env.NETLIFY_DEV = 'true'
    const handler = withSecurity({ endpointKey: 'test' }, passthrough)
    const res = await invoke(handler, { origin: 'https://random-attacker.example' })
    expect(res.statusCode).toBe(200)
  })
})

describe('withSecurity — rate limit (Upstash)', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    clearSecurityEnv()
    process.env.UPSTASH_REDIS_REST_URL = 'https://upstash.example.test'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token'
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  const stubUpstash = (count: number) => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ result: count }, { result: 1 }],
    })
  }

  it('lets a request through when the counter is within the limit', async () => {
    stubUpstash(3) // 3 requests seen in the window, limit is 5
    const handler = withSecurity(
      { endpointKey: 'test', rateLimit: { requests: 5, windowSeconds: 60 } },
      passthrough,
    )
    const res = await invoke(handler)
    expect(res.statusCode).toBe(200)
  })

  it('rejects with 429 when the counter exceeds the limit', async () => {
    stubUpstash(6) // 6 requests seen, limit is 5
    const handler = withSecurity(
      { endpointKey: 'test', rateLimit: { requests: 5, windowSeconds: 60 } },
      passthrough,
    )
    const res = await invoke(handler)
    expect(res.statusCode).toBe(429)
    expect(res.headers?.['Retry-After']).toBe('60')
    expect(JSON.parse(res.body).error).toBe('rate_limit_exceeded')
  })

  it('fails open (allows the request) when Upstash returns non-ok', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 })
    const handler = withSecurity(
      { endpointKey: 'test', rateLimit: { requests: 5, windowSeconds: 60 } },
      passthrough,
    )
    const res = await invoke(handler)
    expect(res.statusCode).toBe(200)
  })

  it('fails open when the Upstash fetch throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'))
    const handler = withSecurity(
      { endpointKey: 'test', rateLimit: { requests: 5, windowSeconds: 60 } },
      passthrough,
    )
    const res = await invoke(handler)
    expect(res.statusCode).toBe(200)
  })

  it('uses per-IP counter keys (different IPs get independent limits)', async () => {
    stubUpstash(3)
    stubUpstash(3)
    const handler = withSecurity(
      { endpointKey: 'test', rateLimit: { requests: 5, windowSeconds: 60 } },
      passthrough,
    )
    await invoke(handler, { ip: '203.0.113.42' })
    await invoke(handler, { ip: '198.51.100.7' })
    const [call1, call2] = fetchMock.mock.calls
    const body1 = JSON.parse(call1[1].body as string)
    const body2 = JSON.parse(call2[1].body as string)
    expect(body1[0]).toEqual(['INCR', 'ratelimit:test:203.0.113.42'])
    expect(body2[0]).toEqual(['INCR', 'ratelimit:test:198.51.100.7'])
  })
})

describe('withSecurity — Turnstile', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    clearSecurityEnv()
    process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret'
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('lets a request through when Turnstile verify returns success', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    const handler = withSecurity(
      { endpointKey: 'test', requireTurnstile: true },
      passthrough,
    )
    const res = await invoke(handler, { turnstileToken: 'user-turnstile-token' })
    expect(res.statusCode).toBe(200)
    // Verify we called Cloudflare's siteverify endpoint correctly
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(init.body).toContain('secret=turnstile-secret')
    expect(init.body).toContain('response=user-turnstile-token')
  })

  it('rejects with 403 when the request has no Turnstile token', async () => {
    const handler = withSecurity(
      { endpointKey: 'test', requireTurnstile: true },
      passthrough,
    )
    const res = await invoke(handler, { turnstileToken: undefined })
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).error).toBe('turnstile_required')
  })

  it('rejects with 403 when Cloudflare returns success:false', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    })
    const handler = withSecurity(
      { endpointKey: 'test', requireTurnstile: true },
      passthrough,
    )
    const res = await invoke(handler, { turnstileToken: 'invalid-token' })
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).error).toBe('turnstile_failed')
    expect(JSON.parse(res.body).codes).toContain('invalid-input-response')
  })

  it('fails open when Cloudflare siteverify is unreachable', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'))
    const handler = withSecurity(
      { endpointKey: 'test', requireTurnstile: true },
      passthrough,
    )
    const res = await invoke(handler, { turnstileToken: 'user-token' })
    expect(res.statusCode).toBe(200)
  })
})

describe('withSecurity — layer ordering', () => {
  beforeEach(() => {
    clearSecurityEnv()
    process.env.NETLIFY_ALLOWED_ORIGINS = 'https://holtectraining.co.nz'
    process.env.TURNSTILE_SECRET_KEY = 'turnstile-secret'
  })

  it('rejects with origin error before checking Turnstile', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const handler = withSecurity(
      { endpointKey: 'test', requireTurnstile: true },
      passthrough,
    )
    const res = await invoke(handler, { origin: 'https://attacker.example', turnstileToken: 'x' })
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).error).toBe('origin_not_allowed')
    // Turnstile fetch was never called — origin rejected first
    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
