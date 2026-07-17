import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkEmail } from './checkEmail'

describe('checkEmail', () => {
  beforeEach(() => {
    sessionStorage.clear()
    sessionStorage.setItem('session_id', 'test-session')
  })

  it('POSTs to /api/check-email with email, session_id, src', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'available' }) }))
    await checkEmail('jane@example.com', 'poster-newmarket')
    const [url, init] = (fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls[0]
    expect(url).toBe('/api/check-email')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body as string)
    expect(body).toEqual({ email: 'jane@example.com', session_id: 'test-session', src: 'poster-newmarket' })
  })

  it('returns available response verbatim', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'available' }) }))
    const r = await checkEmail('jane@example.com', 'nav')
    expect(r).toEqual({ status: 'available' })
  })

  it('returns claimed response verbatim', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'claimed', program_title: 'Fat Loss Blueprint', claimed_at: '2026-07-15' }),
    }))
    const r = await checkEmail('jane@example.com', 'nav')
    expect(r).toEqual({ status: 'claimed', program_title: 'Fat Loss Blueprint', claimed_at: '2026-07-15' })
  })

  it('fails open — returns available on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const r = await checkEmail('jane@example.com', 'nav')
    expect(r).toEqual({ status: 'available' })
  })

  it('fails open — returns available on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    const r = await checkEmail('jane@example.com', 'nav')
    expect(r).toEqual({ status: 'available' })
  })
})
