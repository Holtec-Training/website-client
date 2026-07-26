import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'

vi.mock('@stripe/react-stripe-js', () => ({
  EmbeddedCheckoutProvider: ({ children, options }: { children: React.ReactNode; options: { clientSecret: string } }) => (
    <div data-testid="ec-provider" data-client-secret={options.clientSecret}>{children}</div>
  ),
  EmbeddedCheckout: () => <div data-testid="ec-frame" />,
}))
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockReturnValue(Promise.resolve({})),
}))
vi.mock('../lib/funnelEvents', () => ({ fireFunnelEvent: vi.fn() }))
vi.mock('../lib/programs', () => ({
  getPrograms: vi.fn().mockResolvedValue([]),
  getQuestions: vi.fn().mockResolvedValue([]),
  getSiteConfig: vi.fn().mockResolvedValue({
    programPortalEnabled: true,
    programPortalCtaLabel: 'Get Your Program',
    defaultPromotionCode: 'HOLTEC',
    couponMappings: [],
  }),
}))

import Programs from './Programs'
import { fireFunnelEvent } from '../lib/funnelEvents'

const renderAt = (url: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/programs" element={<Programs />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )

const fillContact = async () => {
  await userEvent.type(await screen.findByLabelText(/first name/i), 'Jane')
  await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
  await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
  await userEvent.type(screen.getByLabelText(/phone/i), '+64 21 555 0000')
  await userEvent.click(screen.getByRole('button', { name: /continue/i }))
}

describe('Programs page (post-flow-reorder)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
    // Tests assume the check-email pre-check is enabled; the local .env may set it to false.
    vi.stubEnv('VITE_CHECK_EMAIL_ENABLED', 'true')
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it('fires landing_displayed when the Landing screen renders (src from query)', async () => {
    renderAt('/programs?src=poster-newmarket')
    await waitFor(() => expect(fireFunnelEvent).toHaveBeenCalledWith('landing_displayed', expect.objectContaining({ src: 'poster-newmarket' })))
  })

  it('defaults src to "direct" when missing', async () => {
    renderAt('/programs')
    await waitFor(() => expect(fireFunnelEvent).toHaveBeenCalledWith('landing_displayed', expect.objectContaining({ src: 'direct' })))
  })

  it('shows "coming soon" when programPortalEnabled is false', async () => {
    const { getSiteConfig } = await import('../lib/programs')
    ;(getSiteConfig as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce({
      programPortalEnabled: false, programPortalCtaLabel: '', defaultPromotionCode: 'HOLTEC', couponMappings: [],
    })
    renderAt('/programs')
    expect(await screen.findByText(/coming soon/i)).toBeInTheDocument()
  })

  it('Path A (1 program) — quiz first, then contact + email check, then results, then POST /api/free-selection', async () => {
    const { getPrograms, getQuestions } = await import('../lib/programs')
    ;(getPrograms as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce([{
      _id: 'p1', title: 'Alpha', slug: { current: 'alpha' },
      scoringAttributes: [{ attribute: 'goal', value: 'fat-loss', weight: 3 }], active: true,
    }])
    ;(getQuestions as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce([{
      _id: 'q1', order: 1, prompt: 'Goal?', multi: false, active: true,
      options: [{ label: 'Fat loss', attributeTags: [{ attribute: 'goal', value: 'fat-loss' }] }],
    }])
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.includes('check-email') ? { status: 'available' } : { status: 'ok' },
      text: async () => url.includes('check-email') ? JSON.stringify({ status: 'available' }) : JSON.stringify({ status: 'ok' }),
    })))

    renderAt('/programs?src=nav')
    // Landing → Start
    await userEvent.click(await screen.findByRole('button', { name: /start/i }))
    // Quiz
    await userEvent.click(await screen.findByRole('button', { name: 'Fat loss' }))
    // Contact
    await fillContact()
    // Results — pick program → Get my free program
    await userEvent.click(await screen.findByLabelText('Alpha'))
    await userEvent.click(await screen.findByRole('button', { name: /free program/i }))

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/free-selection', expect.anything()))
    // Success page renders — assert on the distinctive title, not the eyebrow which
    // repeats "check your inbox" in the step-by-step guidance below.
    expect(await screen.findByText(/on its way/i)).toBeInTheDocument()
  })

  it('Path B (2+ programs) — POSTs /api/checkout with program_ids[], mounts embedded checkout with client_secret', async () => {
    const { getPrograms, getQuestions } = await import('../lib/programs')
    ;(getPrograms as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce([
      { _id: 'p1', title: 'Alpha', slug: { current: 'alpha' }, scoringAttributes: [{ attribute: 'goal', value: 'fat-loss', weight: 3 }], active: true, stripePriceId: 'price_a' },
      { _id: 'p2', title: 'Bravo', slug: { current: 'bravo' }, scoringAttributes: [{ attribute: 'goal', value: 'fat-loss', weight: 2 }], active: true, stripePriceId: 'price_b' },
    ])
    ;(getQuestions as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce([{
      _id: 'q1', order: 1, prompt: 'Goal?', multi: false, active: true,
      options: [{ label: 'Fat loss', attributeTags: [{ attribute: 'goal', value: 'fat-loss' }] }],
    }])
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () =>
        url.includes('check-email')
          ? { status: 'available' }
          : { client_secret: 'cs_test_secret_abc' },
    })))

    renderAt('/programs?src=poster-ellerslie')
    await userEvent.click(await screen.findByRole('button', { name: /start/i }))
    await userEvent.click(await screen.findByRole('button', { name: 'Fat loss' }))
    await fillContact()
    await userEvent.click(await screen.findByLabelText('Alpha'))
    await userEvent.click(await screen.findByLabelText('Bravo'))
    await userEvent.click(await screen.findByRole('button', { name: /continue to payment/i }))

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/checkout', expect.anything()))
    const call = (fetch as unknown as { mock: { calls: Array<[string, RequestInit]> } }).mock.calls.find(([u]) => u === '/api/checkout')!
    const body = JSON.parse(call[1].body as string)
    expect(body.program_ids).toEqual(['alpha', 'bravo'])
    expect(body.src).toBe('poster-ellerslie')
    expect(body.first_name).toBe('Jane')
    expect(body.phone).toBe('+64 21 555 0000')

    // Embedded checkout mounted with the client_secret returned by the Function
    const provider = await screen.findByTestId('ec-provider')
    expect(provider).toHaveAttribute('data-client-secret', 'cs_test_secret_abc')
    expect(screen.getByTestId('ec-frame')).toBeInTheDocument()

    // Back button lets the customer bail back to results
    await userEvent.click(screen.getByRole('button', { name: /back to results/i }))
    // ResultsStep re-mounts (selection resets) — the program list should be visible again.
    expect(await screen.findByLabelText('Alpha')).toBeInTheDocument()
    expect(screen.getByText(/matches · sorted by fit/i)).toBeInTheDocument()
  })

  it('prior-claim path — pre-check returns claimed, warning banner shown on results', async () => {
    const { getPrograms, getQuestions } = await import('../lib/programs')
    ;(getPrograms as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce([{
      _id: 'p1', title: 'Alpha', slug: { current: 'alpha' },
      scoringAttributes: [{ attribute: 'goal', value: 'fat-loss', weight: 3 }], active: true,
    }])
    ;(getQuestions as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce([{
      _id: 'q1', order: 1, prompt: 'Goal?', multi: false, active: true,
      options: [{ label: 'Fat loss', attributeTags: [{ attribute: 'goal', value: 'fat-loss' }] }],
    }])
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => url.includes('check-email')
        ? { status: 'claimed', program_title: 'Fat Loss Blueprint', claimed_at: '2026-07-15' }
        : { status: 'ok' },
    })))

    renderAt('/programs?src=nav')
    await userEvent.click(await screen.findByRole('button', { name: /start/i }))
    await userEvent.click(await screen.findByRole('button', { name: 'Fat loss' }))
    await fillContact()

    expect(await screen.findByText(/already received a free program/i)).toBeInTheDocument()
    expect(screen.getByText(/Fat Loss Blueprint/)).toBeInTheDocument()
    expect(screen.getByText(/2026-07-15/)).toBeInTheDocument()
  })

  it('checking-email transient shows a loading spinner', async () => {
    const { getPrograms, getQuestions } = await import('../lib/programs')
    ;(getPrograms as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce([])
    ;(getQuestions as unknown as { mockResolvedValueOnce: (v: unknown) => void }).mockResolvedValueOnce([{
      _id: 'q1', order: 1, prompt: 'Goal?', multi: false, active: true,
      options: [{ label: 'Fat loss', attributeTags: [{ attribute: 'goal', value: 'fat-loss' }] }],
    }])
    // Never-resolving fetch so we can catch the transient state
    let resolveFetch: (v: Response) => void = () => {}
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve })))

    renderAt('/programs?src=nav')
    await userEvent.click(await screen.findByRole('button', { name: /start/i }))
    await userEvent.click(await screen.findByRole('button', { name: 'Fat loss' }))
    await fillContact()

    // While the check-email fetch is in flight, the spinner should show
    expect(await screen.findByText(/checking your email/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Cleanup
    resolveFetch({ ok: true, json: async () => ({ status: 'available' }) } as Response)
  })
})
