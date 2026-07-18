import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with the given label', () => {
    render(<LoadingSpinner label="Checking your email…" />)
    expect(screen.getByText(/checking your email/i)).toBeInTheDocument()
  })

  it('renders a screen-reader-only fallback when no label is set', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('has role="status" so assistive tech can announce it', () => {
    render(<LoadingSpinner label="Loading" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('applies the size class', () => {
    const { container } = render(<LoadingSpinner size="lg" />)
    expect(container.querySelector('.spinner-lg')).toBeInTheDocument()
  })
})
