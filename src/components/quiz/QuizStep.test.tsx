import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuizStep from './QuizStep'
import type { Question } from '../../types/question'

const q1: Question = {
  _id: 'q1', order: 1, prompt: 'Goal?', multi: false, active: true,
  options: [
    { label: 'Fat loss', attributeTags: [{ attribute: 'goal', value: 'fat-loss' }] },
    { label: 'Strength', attributeTags: [{ attribute: 'goal', value: 'strength' }] },
  ],
}
const q2: Question = {
  _id: 'q2', order: 2, prompt: 'Limitations?', multi: true, active: true,
  options: [
    { label: 'None', attributeTags: [{ attribute: 'limits', value: 'none' }] },
    { label: 'Knees', attributeTags: [{ attribute: 'limits', value: 'knees' }] },
  ],
}

describe('QuizStep', () => {
  it('shows the first question', () => {
    render(<QuizStep questions={[q1, q2]} onComplete={() => {}} />)
    expect(screen.getByText('Goal?')).toBeInTheDocument()
  })

  it('single-choice advances on click', async () => {
    render(<QuizStep questions={[q1, q2]} onComplete={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fat loss' }))
    expect(await screen.findByText('Limitations?')).toBeInTheDocument()
  })

  it('multi-choice needs explicit next click', async () => {
    render(<QuizStep questions={[q2]} onComplete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'None' }))
    expect(screen.getByText('Limitations?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('emits all selected attribute tags on completion', async () => {
    const onComplete = vi.fn()
    render(<QuizStep questions={[q1]} onComplete={onComplete} />)
    await userEvent.click(screen.getByRole('button', { name: 'Strength' }))
    expect(onComplete).toHaveBeenCalledWith([{ attribute: 'goal', value: 'strength' }])
  })

  it('no Back button on the first question', () => {
    render(<QuizStep questions={[q1, q2]} onComplete={() => {}} />)
    expect(screen.queryByRole('button', { name: /back/i })).toBeNull()
  })

  it('Back button appears from question 2 onwards', async () => {
    render(<QuizStep questions={[q1, q2]} onComplete={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fat loss' }))
    expect(await screen.findByText('Limitations?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('Back navigates to the previous question with previous single-choice restored', async () => {
    render(<QuizStep questions={[q1, q2]} onComplete={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fat loss' }))
    await userEvent.click(await screen.findByRole('button', { name: /back/i }))
    // Q1 shown again
    expect(screen.getByText('Goal?')).toBeInTheDocument()
    // Previously-picked option is highlighted (has 'selected' class)
    const fatLoss = screen.getByRole('button', { name: 'Fat loss' })
    expect(fatLoss.className).toMatch(/selected/)
  })

  it('Back + change answer + advance completes with the CHANGED tag', async () => {
    const onComplete = vi.fn()
    render(<QuizStep questions={[q1, q2]} onComplete={onComplete} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fat loss' }))
    await userEvent.click(await screen.findByRole('button', { name: /back/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Strength' }))
    await userEvent.click(await screen.findByRole('button', { name: 'None' }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(onComplete).toHaveBeenCalledWith([
      { attribute: 'goal', value: 'strength' },  // CHANGED from fat-loss
      { attribute: 'limits', value: 'none' },
    ])
  })

  it('Back restores multi-choice selections', async () => {
    const q3: Question = {
      _id: 'q3', order: 3, prompt: 'Style?', multi: false, active: true,
      options: [{ label: 'A', attributeTags: [{ attribute: 's', value: 'a' }] }],
    }
    render(<QuizStep questions={[q2, q3]} onComplete={() => {}} />)
    // q2 is multi
    await userEvent.click(screen.getByRole('button', { name: 'None' }))
    await userEvent.click(screen.getByRole('button', { name: 'Knees' }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    // Now on q3
    expect(await screen.findByText('Style?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /back/i }))
    // Back on q2 — both prior selections should be highlighted
    const none = screen.getByRole('button', { name: 'None' })
    const knees = screen.getByRole('button', { name: 'Knees' })
    expect(none.className).toMatch(/selected/)
    expect(knees.className).toMatch(/selected/)
  })
})
