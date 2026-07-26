import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireFunnelEvent } from './funnelEvents'

describe('fireFunnelEvent', () => {
  beforeEach(() => {
    sessionStorage.clear()
    sessionStorage.setItem('session_id', 'test-session-uuid')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'ok' }))
  })

  it('POSTs to /api/funnel-event with session_id, src, timestamp attached', async () => {
    await fireFunnelEvent('page_viewed', { src: 'poster-newmarket' })
    const [url, init] = (fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0]
    expect(url).toBe('/api/funnel-event')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body as string)
    expect(body.event).toBe('page_viewed')
    expect(body.session_id).toBe('test-session-uuid')
    expect(body.src).toBe('poster-newmarket')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('does not throw when fetch fails (fire-and-forget)', async () => {
    ;(fetch as unknown as { mockRejectedValueOnce: (v: unknown) => void }).mockRejectedValueOnce(new Error('network'))
    await expect(fireFunnelEvent('quiz_started', { src: 'nav' })).resolves.toBeUndefined()
  })

  it('includes user_agent from navigator', async () => {
    await fireFunnelEvent('page_viewed', { src: 'direct' })
    const body = JSON.parse((fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0][1].body as string)
    expect(body.user_agent).toBe(navigator.userAgent)
  })

  it('passes through role fields + extras (but not PII fields)', async () => {
    await fireFunnelEvent('results_displayed', {
      src: 'nav',
      matched_program_ids: ['fat-loss-blueprint', 'strength-5x5'],
      extras: { source: 'quiz' },
    })
    const body = JSON.parse((fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0][1].body as string)
    expect(body.matched_program_ids).toEqual(['fat-loss-blueprint', 'strength-5x5'])
    expect(body.extras).toEqual({ source: 'quiz' })
    // Type doesn't accept email/first_name/last_name/phone — those live in the Fulfilment Log.
    expect(body.email).toBeUndefined()
    expect(body.first_name).toBeUndefined()
    expect(body.last_name).toBeUndefined()
    expect(body.phone).toBeUndefined()
  })
})
