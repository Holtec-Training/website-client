import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SuccessStep from './SuccessStep'

describe('SuccessStep', () => {
  it('shows inbox copy for free-only', () => {
    render(<SuccessStep variant="free" email="jane@example.com" />)
    expect(screen.getByText(/check your inbox/i)).toBeInTheDocument()
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument()
  })

  it('shows Milan-onboarding copy for paid', () => {
    render(<SuccessStep variant="paid" email="jane@example.com" />)
    expect(screen.getByText(/milan will set up your everfit/i)).toBeInTheDocument()
    expect(screen.getByText(/within 24 hours/i)).toBeInTheDocument()
  })
})
