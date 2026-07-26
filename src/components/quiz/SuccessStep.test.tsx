import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SuccessStep from './SuccessStep'

describe('SuccessStep (free-path receipt-style success)', () => {
  beforeEach(() => { sessionStorage.clear() })

  it('shows the check-inbox eyebrow + title', () => {
    render(<SuccessStep email="jane@example.com" />)
    // Multiple copies of "check your inbox" (eyebrow + step guidance) — match ≥1.
    expect(screen.getAllByText(/check your inbox/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/on its way/i)).toBeInTheDocument()
  })

  it('renders the customer email as the destination', () => {
    render(<SuccessStep email="jane@example.com" />)
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument()
  })

  it('mentions the spam-folder fallback', () => {
    render(<SuccessStep email="jane@example.com" />)
    expect(screen.getByText(/check spam/i)).toBeInTheDocument()
  })

  it('renders the receipt card when program_portal_free_receipt is set', () => {
    sessionStorage.setItem('program_portal_free_receipt', JSON.stringify({
      program_title: 'Fat Loss Blueprint',
    }))
    render(<SuccessStep email="jane@example.com" />)
    expect(screen.getByText(/program summary/i)).toBeInTheDocument()
    expect(screen.getByText('Fat Loss Blueprint')).toBeInTheDocument()
    expect(screen.getByText(/^INCLUDED$/)).toBeInTheDocument()
    expect(screen.getByText(/PDF · Email/i)).toBeInTheDocument()
  })

  it('does not render the receipt card when sessionStorage is empty (direct-visit fallback)', () => {
    render(<SuccessStep email="jane@example.com" />)
    expect(screen.queryByText(/program summary/i)).toBeNull()
  })

  it('renders the "what happens next" 3-step guidance', () => {
    render(<SuccessStep email="jane@example.com" />)
    expect(screen.getByText(/what happens next/i)).toBeInTheDocument()
    expect(screen.getByText(/save it to your device/i)).toBeInTheDocument()
    expect(screen.getByText(/start training/i)).toBeInTheDocument()
  })

  it('hints at the subscription upgrade path in the disclaimer', () => {
    render(<SuccessStep email="jane@example.com" />)
    expect(screen.getByText(/first program stays free forever/i)).toBeInTheDocument()
  })
})
