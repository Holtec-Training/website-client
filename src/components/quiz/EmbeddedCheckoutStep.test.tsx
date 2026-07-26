import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock @stripe/react-stripe-js so we don't try to load Stripe.js in tests.
vi.mock('@stripe/react-stripe-js', () => ({
  EmbeddedCheckoutProvider: ({ children, options }: { children: React.ReactNode; options: { clientSecret: string } }) => (
    <div data-testid="ec-provider" data-client-secret={options.clientSecret}>{children}</div>
  ),
  EmbeddedCheckout: () => <div data-testid="ec-frame" />,
}))
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockReturnValue(Promise.resolve({})),
}))

import EmbeddedCheckoutStep from './EmbeddedCheckoutStep'

describe('EmbeddedCheckoutStep', () => {
  it('renders the Stripe embedded checkout iframe with the client_secret', () => {
    render(<EmbeddedCheckoutStep clientSecret="cs_test_secret_xyz" onBack={() => {}} />)
    const provider = screen.getByTestId('ec-provider')
    expect(provider).toHaveAttribute('data-client-secret', 'cs_test_secret_xyz')
    expect(screen.getByTestId('ec-frame')).toBeInTheDocument()
  })

  it('renders a Back to results button', () => {
    render(<EmbeddedCheckoutStep clientSecret="cs" onBack={() => {}} />)
    expect(screen.getByRole('button', { name: /back to results/i })).toBeInTheDocument()
  })

  it('calls onBack when the back button is clicked', async () => {
    const onBack = vi.fn()
    render(<EmbeddedCheckoutStep clientSecret="cs" onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /back to results/i }))
    expect(onBack).toHaveBeenCalled()
  })
})
