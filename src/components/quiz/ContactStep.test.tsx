import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactStep from './ContactStep'

describe('ContactStep', () => {
  it('renders four inputs (first, last, email, phone)', () => {
    render(<ContactStep onSubmit={() => {}} />)
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
  })

  it('marks phone as required (no "optional" hint)', () => {
    render(<ContactStep onSubmit={() => {}} />)
    expect(screen.getByLabelText(/phone/i)).toBeRequired()
    expect(screen.queryByText(/optional/i)).toBeNull()
  })

  it('Continue is disabled when any field is empty', () => {
    render(<ContactStep onSubmit={() => {}} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('Continue enables only once every field is filled with valid values', async () => {
    render(<ContactStep onSubmit={() => {}} />)
    const btn = screen.getByRole('button', { name: /continue/i })

    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane')
    expect(btn).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    expect(btn).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
    expect(btn).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/phone/i), '+64 21 555 0000')
    expect(btn).toBeEnabled()
  })

  it('rejects an obviously malformed email', async () => {
    render(<ContactStep onSubmit={() => {}} />)
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
    await userEvent.type(screen.getByLabelText(/phone/i), '+64 21 555 0000')
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('calls onSubmit with all four fields on submit', async () => {
    const onSubmit = vi.fn()
    render(<ContactStep onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/phone/i), '+64 21 555 0000')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com', phone: '+64 21 555 0000',
    })
  })
})
