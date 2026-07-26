import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Landing from './Landing'

describe('Landing', () => {
  it('renders headline + Start button', () => {
    render(<Landing headline="Find Your Program" onStart={() => {}} />)
    expect(screen.getByText('Find Your Program')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
  })

  it('calls onStart when Start clicked', async () => {
    const onStart = vi.fn()
    render(<Landing headline="H" onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: /start/i }))
    expect(onStart).toHaveBeenCalled()
  })
})
