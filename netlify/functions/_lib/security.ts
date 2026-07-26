// Shared security wrapper for Netlify Functions.
//
// Composes three independent layers behind a single higher-order function so
// each Function only needs one line to declare its posture. Each layer is
// gated by env vars — if the env isn't set, the layer skips. This means:
//   - Local dev + tests: nothing set → checks skip → business logic runs
//     unchanged.
//   - Production: env vars set on Netlify → checks enforced.
//
// Layers:
//   1. Origin check — reject requests whose `Origin` header isn't in the
//      allow-list. Blocks browser-originated abuse from other websites.
//   2. Rate limit — per-IP counter via Upstash Redis, namespaced per endpoint.
//      Blocks volumetric abuse from a single source.
//   3. Turnstile — verify a Cloudflare Turnstile token from the request.
//      Blocks automated (non-human) abuse.
//
// Usage:
//   export const handler = withSecurity({
//     endpointKey: 'free-selection',
//     rateLimit: { requests: 5, windowSeconds: 3600 },
//     requireTurnstile: true,
//   }, rawHandler)

import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions'

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

export interface SecurityConfig {
  /**
   * Namespace for rate-limit counters and log lines. Should match the
   * Function's route (e.g. 'free-selection' for /api/free-selection).
   */
  endpointKey: string

  /**
   * Skip the origin check. Set true for server-to-server Functions where
   * the caller isn't a browser (Stripe webhooks, n8n calls). Default false.
   */
  serverOnly?: boolean

  /**
   * Per-IP rate limit for this endpoint. Skipped if undefined OR if Upstash
   * env vars aren't configured.
   */
  rateLimit?: {
    requests: number
    windowSeconds: number
  }

  /**
   * Require a valid Cloudflare Turnstile token on the request (header
   * `X-Turnstile-Token`). Skipped if false/undefined OR if
   * TURNSTILE_SECRET_KEY isn't configured.
   */
  requireTurnstile?: boolean
}

/**
 * Wrap a Netlify Function handler with security checks. Each check runs in
 * order — origin → rate limit → Turnstile → your handler. Any check that
 * fails short-circuits with a response; only if all pass does the handler run.
 */
export function withSecurity(config: SecurityConfig, handler: Handler): Handler {
  return (async (event: HandlerEvent, context) => {
    // 1. Origin check
    if (!config.serverOnly) {
      const originResp = checkOrigin(event)
      if (originResp) return originResp
    }

    // 2. Rate limit
    if (config.rateLimit) {
      const rlResp = await checkRateLimit(event, config)
      if (rlResp) return rlResp
    }

    // 3. Turnstile
    if (config.requireTurnstile) {
      const tsResp = await checkTurnstile(event)
      if (tsResp) return tsResp
    }

    return handler(event, context)
  }) as Handler
}

// ────────────────────────────────────────────────────────────────────────────
// Layer 1 — Origin check
// ────────────────────────────────────────────────────────────────────────────

function checkOrigin(event: HandlerEvent): HandlerResponse | null {
  // Skip in local dev
  if (process.env.NETLIFY_DEV === 'true') return null

  const rawAllowed = process.env.NETLIFY_ALLOWED_ORIGINS
  // If no allow-list configured, skip (permissive fallback for staging /
  // pre-launch). Configure the env var to activate.
  if (!rawAllowed) return null

  const origin = (event.headers?.origin ?? event.headers?.Origin ?? '').toString()
  if (!origin) {
    // Non-browser requests (curl, server-to-server) have no Origin. Reject.
    return json(403, { error: 'origin_required', message: 'Origin header missing' })
  }

  const allowedList = rawAllowed.split(',').map(s => s.trim()).filter(Boolean)
  if (!allowedList.some(pattern => originMatches(origin, pattern))) {
    return json(403, { error: 'origin_not_allowed', message: `Origin ${origin} not in allow-list` })
  }

  return null
}

/**
 * Match an origin against an allowed pattern. Supports exact match and single
 * wildcard in the leftmost subdomain (e.g. 'https://deploy-preview-*.netlify.app'
 * matches any 'https://deploy-preview-<anything>.netlify.app').
 */
function originMatches(origin: string, pattern: string): boolean {
  if (origin === pattern) return true
  if (!pattern.includes('*')) return false
  // Convert pattern to a regex — escape everything except '*' which becomes [^.]+
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+')
  return new RegExp(`^${escaped}$`).test(origin)
}

// ────────────────────────────────────────────────────────────────────────────
// Layer 2 — Rate limit (Upstash Redis)
// ────────────────────────────────────────────────────────────────────────────

async function checkRateLimit(
  event: HandlerEvent,
  config: SecurityConfig,
): Promise<HandlerResponse | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  // If Upstash isn't configured, skip (permissive fallback).
  if (!url || !token) return null

  const ip = extractClientIp(event)
  const key = `ratelimit:${config.endpointKey}:${ip}`
  const { requests, windowSeconds } = config.rateLimit!

  // Upstash REST API — INCR the key, if it was 1 (fresh), set an expiry equal
  // to the window. Reject when the counter exceeds `requests` within the
  // window. Uses pipelining for the atomic INCR + EXPIRE (2 round-trips
  // otherwise; pipeline is 1).
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(windowSeconds), 'NX'],
      ]),
    })
    if (!res.ok) {
      // Upstash outage — fail open. Better to let traffic through than to
      // hard-block all signup attempts when Redis has a hiccup. Log for
      // observability.
      console.warn(`[security] rate-limit backend error: ${res.status}`)
      return null
    }
    const results = (await res.json()) as Array<{ result: number | string }>
    const count = Number(results[0]?.result ?? 0)
    if (count > requests) {
      const retryAfter = String(windowSeconds)
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter,
        },
        body: JSON.stringify({
          error: 'rate_limit_exceeded',
          message: `Too many requests. Try again in ${retryAfter} seconds.`,
        }),
      }
    }
    return null
  } catch (e) {
    console.warn(`[security] rate-limit fetch failed:`, e)
    return null
  }
}

function extractClientIp(event: HandlerEvent): string {
  // Netlify passes the client IP in x-nf-client-connection-ip, but fall back
  // to standard headers just in case.
  const headers = event.headers ?? {}
  const nfIp = headers['x-nf-client-connection-ip']
  if (nfIp) return String(nfIp)
  const xff = headers['x-forwarded-for']
  if (xff) return String(xff).split(',')[0].trim()
  const real = headers['x-real-ip']
  if (real) return String(real)
  return 'unknown'
}

// ────────────────────────────────────────────────────────────────────────────
// Layer 3 — Cloudflare Turnstile
// ────────────────────────────────────────────────────────────────────────────

async function checkTurnstile(event: HandlerEvent): Promise<HandlerResponse | null> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  // If Turnstile isn't configured, skip (permissive fallback).
  if (!secret) return null

  const headers = event.headers ?? {}
  const token = headers['x-turnstile-token'] ?? headers['X-Turnstile-Token']
  if (!token || typeof token !== 'string') {
    return json(403, { error: 'turnstile_required', message: 'Turnstile token missing' })
  }

  const ip = extractClientIp(event)
  const form = new URLSearchParams()
  form.set('secret', secret)
  form.set('response', token)
  if (ip !== 'unknown') form.set('remoteip', ip)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    if (!res.ok) {
      // Turnstile API outage — fail open. Same rationale as rate-limit.
      console.warn(`[security] turnstile backend error: ${res.status}`)
      return null
    }
    const result = (await res.json()) as { success: boolean; 'error-codes'?: string[] }
    if (!result.success) {
      return json(403, {
        error: 'turnstile_failed',
        message: 'Turnstile verification failed',
        codes: result['error-codes'] ?? [],
      })
    }
    return null
  } catch (e) {
    console.warn(`[security] turnstile fetch failed:`, e)
    return null
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function json(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
