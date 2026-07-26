import { describe, it, expect, vi, beforeEach } from 'vitest'

const fetchMock = vi.fn()
vi.mock('./sanity', () => ({ sanityClient: { fetch: (...a: unknown[]) => fetchMock(...a) } }))

import { getPrograms, getQuestions, getSiteConfig } from './programs'

describe('sanity fetch helpers', () => {
  beforeEach(() => { fetchMock.mockReset() })

  it('getPrograms fetches only active programs, ordered by title', async () => {
    fetchMock.mockResolvedValue([{ _id: 'a', title: 'A' }])
    const result = await getPrograms()
    expect(fetchMock).toHaveBeenCalled()
    const groq = fetchMock.mock.calls[0][0] as string
    expect(groq).toMatch(/_type == "program"/)
    expect(groq).toMatch(/active == true/)
    expect(groq).toMatch(/order\(title asc\)/)
    expect(result).toHaveLength(1)
  })

  it('getPrograms does NOT fetch priceCents (removed in pass 6)', async () => {
    fetchMock.mockResolvedValue([])
    await getPrograms()
    const groq = fetchMock.mock.calls[0][0] as string
    expect(groq).not.toMatch(/priceCents/)
  })

  it('getQuestions fetches only active questions ordered by order asc', async () => {
    fetchMock.mockResolvedValue([{ _id: 'q1', order: 1 }])
    await getQuestions()
    const groq = fetchMock.mock.calls[0][0] as string
    expect(groq).toMatch(/_type == "question"/)
    expect(groq).toMatch(/active == true/)
    expect(groq).toMatch(/order\(order asc\)/)
  })

  it('getSiteConfig fetches the singleton and includes couponMappings + defaultPromotionCode', async () => {
    fetchMock.mockResolvedValue({ programPortalEnabled: true, defaultPromotionCode: 'HOLTEC', couponMappings: [] })
    const result = await getSiteConfig()
    const groq = fetchMock.mock.calls[0][0] as string
    expect(groq).toMatch(/_id == "siteConfig"/)
    expect(groq).toMatch(/defaultPromotionCode/)
    expect(groq).toMatch(/couponMappings/)
    expect(result?.defaultPromotionCode).toBe('HOLTEC')
  })

  it('getSiteConfig does NOT fetch maxRecommendations (removed in pass 6)', async () => {
    fetchMock.mockResolvedValue({})
    await getSiteConfig()
    const groq = fetchMock.mock.calls[0][0] as string
    expect(groq).not.toMatch(/maxRecommendations/)
  })
})
