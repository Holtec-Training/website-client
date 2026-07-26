import { describe, it, expect, beforeEach } from 'vitest'
import { getOrCreateSessionId } from './sessionId'

describe('getOrCreateSessionId', () => {
  beforeEach(() => { sessionStorage.clear() })

  it('generates a UUID on first call', () => {
    const id = getOrCreateSessionId()
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('returns the same id on subsequent calls in the same tab', () => {
    const a = getOrCreateSessionId()
    const b = getOrCreateSessionId()
    expect(a).toBe(b)
  })

  it('persists via sessionStorage', () => {
    const id = getOrCreateSessionId()
    expect(sessionStorage.getItem('session_id')).toBe(id)
  })
})
