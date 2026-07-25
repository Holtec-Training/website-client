import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResultsStep from './ResultsStep'
import type { Program } from '../../types/program'

const p = (id: string, title: string): Program => ({
  _id: id, title, slug: { current: id }, scoringAttributes: [], active: true, stripePriceId: `price_${id}`,
})

const PRIOR = { program_title: 'Fat Loss Blueprint', claimed_at: '2026-07-15' }

describe('ResultsStep (fresh customer)', () => {
  it('renders all matched programs in a single unified list', () => {
    render(<ResultsStep matched={[p('a', 'Alpha'), p('b', 'Bravo'), p('c', 'Charlie')]} priorClaim={null} onSubmit={() => {}} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('shows empty state when no programs match', () => {
    render(<ResultsStep matched={[]} priorClaim={null} onSubmit={() => {}} />)
    expect(screen.getByText(/nothing matched/i)).toBeInTheDocument()
  })

  it('shows all programs at $30/mo when nothing is selected', () => {
    render(<ResultsStep matched={[p('a', 'Alpha'), p('b', 'Bravo')]} priorClaim={null} onSubmit={() => {}} />)
    const prices = screen.getAllByText(/\$30\/mo/)
    expect(prices.length).toBe(2)
  })

  it('marks the first selected program as FREE, second as $30/mo', async () => {
    render(<ResultsStep matched={[p('a', 'Alpha'), p('b', 'Bravo')]} priorClaim={null} onSubmit={() => {}} />)
    await userEvent.click(screen.getByLabelText('Alpha'))
    expect(screen.getByTestId('price-0').textContent).toBe('FREE')
    expect(screen.getByTestId('price-1').textContent).toBe('$30/mo')
    await userEvent.click(screen.getByLabelText('Bravo'))
    expect(screen.getByTestId('price-0').textContent).toBe('FREE')
    expect(screen.getByTestId('price-1').textContent).toBe('$30/mo')
  })

  it('cart total = (N-1) × $30/mo', async () => {
    render(<ResultsStep matched={[p('a', 'A'), p('b', 'B'), p('c', 'C')]} priorClaim={null} onSubmit={() => {}} />)
    const total = () => screen.getByTestId('monthly-total').textContent
    expect(total()).toBe('$0/mo')
    await userEvent.click(screen.getByLabelText('A'))
    expect(total()).toBe('$0/mo')
    await userEvent.click(screen.getByLabelText('B'))
    expect(total()).toBe('$30/mo')
    await userEvent.click(screen.getByLabelText('C'))
    expect(total()).toBe('$60/mo')
  })

  it('disables continue when nothing is selected', () => {
    render(<ResultsStep matched={[p('a', 'A')]} priorClaim={null} onSubmit={() => {}} />)
    expect(screen.getByRole('button', { name: /free program/i })).toBeDisabled()
  })

  it('button label depends on cart size (path)', async () => {
    render(<ResultsStep matched={[p('a', 'A'), p('b', 'B')]} priorClaim={null} onSubmit={() => {}} />)
    await userEvent.click(screen.getByLabelText('A'))
    expect(screen.getByRole('button', { name: /free program/i })).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('B'))
    expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument()
  })

  it('onSubmit emits {program_ids, path: "free"} on 1 program', async () => {
    const onSubmit = vi.fn()
    render(<ResultsStep matched={[p('a', 'A')]} priorClaim={null} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByLabelText('A'))
    await userEvent.click(screen.getByRole('button', { name: /free program/i }))
    expect(onSubmit).toHaveBeenCalledWith({ program_ids: ['a'], path: 'free' })
  })

  it('onSubmit emits {program_ids, path: "subscription"} on 2+ programs', async () => {
    const onSubmit = vi.fn()
    render(<ResultsStep matched={[p('a', 'A'), p('b', 'B')]} priorClaim={null} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByLabelText('A'))
    await userEvent.click(screen.getByLabelText('B'))
    await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }))
    expect(onSubmit).toHaveBeenCalledWith({ program_ids: ['a', 'b'], path: 'subscription' })
  })

  it('shows non-refund disclaimer', () => {
    render(<ResultsStep matched={[p('a', 'A')]} priorClaim={null} onSubmit={() => {}} />)
    expect(screen.getByText(/non-refundable/i)).toBeInTheDocument()
  })
})

describe('ResultsStep (prior-claim customer)', () => {
  it('renders prior-claim banner and its content', () => {
    render(<ResultsStep matched={[p('a', 'Alpha')]} priorClaim={PRIOR} onSubmit={() => {}} />)
    expect(screen.getByText(/already received a free program/i)).toBeInTheDocument()
    expect(screen.getByText(/Fat Loss Blueprint/)).toBeInTheDocument()
    expect(screen.getByText(/2026-07-15/)).toBeInTheDocument()
  })

  it('no FREE pill anywhere — first selected shows $30/mo, not FREE', async () => {
    render(<ResultsStep matched={[p('a', 'Alpha'), p('b', 'Bravo')]} priorClaim={PRIOR} onSubmit={() => {}} />)
    await userEvent.click(screen.getByLabelText('Alpha'))
    expect(screen.getByTestId('price-0').textContent).toBe('$30/mo')
    expect(screen.queryByText(/^FREE$/)).toBeNull()
  })

  it('cart total = N × $30/mo (no discount)', async () => {
    render(<ResultsStep matched={[p('a', 'A'), p('b', 'B'), p('c', 'C')]} priorClaim={PRIOR} onSubmit={() => {}} />)
    const total = () => screen.getByTestId('monthly-total').textContent
    expect(total()).toBe('$0/mo')
    await userEvent.click(screen.getByLabelText('A'))
    expect(total()).toBe('$30/mo')
    await userEvent.click(screen.getByLabelText('B'))
    expect(total()).toBe('$60/mo')
    await userEvent.click(screen.getByLabelText('C'))
    expect(total()).toBe('$90/mo')
  })

  it('button label is always "Continue to payment" (path is always subscription)', async () => {
    render(<ResultsStep matched={[p('a', 'A'), p('b', 'B')]} priorClaim={PRIOR} onSubmit={() => {}} />)
    await userEvent.click(screen.getByLabelText('A'))
    expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('B'))
    expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument()
  })

  it('single-selection is allowed and emits path: "subscription"', async () => {
    const onSubmit = vi.fn()
    render(<ResultsStep matched={[p('a', 'A')]} priorClaim={PRIOR} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByLabelText('A'))
    await userEvent.click(screen.getByRole('button', { name: /continue to payment/i }))
    expect(onSubmit).toHaveBeenCalledWith({ program_ids: ['a'], path: 'subscription' })
  })
})
