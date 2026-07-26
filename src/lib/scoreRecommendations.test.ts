import { describe, it, expect } from 'vitest'
import { scoreRecommendations } from './scoreRecommendations'
import type { Program } from '../types/program'

const p = (id: string, title: string, attrs: Array<[string, string, number]>): Program => ({
  _id: id,
  title,
  slug: { current: id },
  scoringAttributes: attrs.map(([attribute, value, weight]) => ({ attribute, value, weight })),
  active: true,
})

const A = p('a', 'Alpha', [['goal', 'fat-loss', 3], ['experience', 'beginner', 2]])
const B = p('b', 'Bravo', [['goal', 'fat-loss', 2]])
const C = p('c', 'Charlie', [['goal', 'strength', 3]])
const D = p('d', 'Delta', [['experience', 'beginner', 1]])
const E = p('e', 'Echo', [])

describe('scoreRecommendations (pass 6 semantics)', () => {
  it('returns empty array when no program has score > 0', () => {
    const out = scoreRecommendations([A, B, C, D, E], [])
    expect(out).toEqual([])
  })

  it('returns ALL programs with score > 0, sorted by score desc', () => {
    const selected = [{ attribute: 'goal', value: 'fat-loss' }, { attribute: 'experience', value: 'beginner' }]
    const out = scoreRecommendations([A, B, C, D, E], selected)
    // A=5, B=2, D=1 → included. C=0, E=0 → excluded.
    expect(out.map(p => p._id)).toEqual(['a', 'b', 'd'])
  })

  it('breaks ties by title alphabetical', () => {
    const alpha = p('x', 'Alpha', [['g', 'x', 1]])
    const bravo = p('y', 'Bravo', [['g', 'x', 1]])
    const out = scoreRecommendations([bravo, alpha], [{ attribute: 'g', value: 'x' }])
    expect(out.map(p => p.title)).toEqual(['Alpha', 'Bravo'])
  })

  it('ignores inactive programs', () => {
    const inactive: Program = { ...A, _id: 'x', active: false }
    const out = scoreRecommendations([inactive, B], [{ attribute: 'goal', value: 'fat-loss' }])
    expect(out.map(p => p._id)).toEqual(['b'])
  })

  it('only awards weight when both attribute AND value match', () => {
    const out = scoreRecommendations([A], [{ attribute: 'goal', value: 'strength' }])
    expect(out).toEqual([])  // A does not match "goal=strength" — excluded, no padding
  })

  it('returns all matched programs when many programs match', () => {
    const programs = [A, B, C, D]
    const out = scoreRecommendations(programs, [
      { attribute: 'goal', value: 'fat-loss' },
      { attribute: 'goal', value: 'strength' },
      { attribute: 'experience', value: 'beginner' },
    ])
    // A=5, C=3, B=2, D=1 — all four match, all four returned
    expect(out.map(p => p._id)).toEqual(['a', 'c', 'b', 'd'])
  })
})
