import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/programs', () => ({
  getSiteConfig: vi.fn(),
}))

import Navbar from './Navbar'

describe('Navbar', () => {
  it('shows Get Your Program CTA (link to /programs?src=nav) when flag on', async () => {
    const { getSiteConfig } = await import('../lib/programs')
    ;(getSiteConfig as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      programPortalEnabled: true, programPortalCtaLabel: 'Get Your Program', maxRecommendations: 3,
    })
    render(<MemoryRouter><Navbar /></MemoryRouter>)
    const cta = await screen.findByRole('link', { name: /get your program/i })
    expect(cta).toHaveAttribute('href', '/programs?src=nav')
  })

  it('hides Get Your Program CTA when flag off', async () => {
    const { getSiteConfig } = await import('../lib/programs')
    ;(getSiteConfig as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      programPortalEnabled: false, programPortalCtaLabel: 'Get Your Program', maxRecommendations: 3,
    })
    render(<MemoryRouter><Navbar /></MemoryRouter>)
    expect(screen.queryByRole('link', { name: /get your program/i })).toBeNull()
  })

  it('renders Connect as a plain nav link (not filled CTA) when Programs flag on', async () => {
    const { getSiteConfig } = await import('../lib/programs')
    ;(getSiteConfig as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      programPortalEnabled: true, programPortalCtaLabel: 'Get Your Program', maxRecommendations: 3,
    })
    render(<MemoryRouter><Navbar /></MemoryRouter>)
    const connect = await screen.findByRole('link', { name: /^connect$/i })
    expect(connect.className).not.toMatch(/text-white/)
  })
})
