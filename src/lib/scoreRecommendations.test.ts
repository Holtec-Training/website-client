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

describe('scoreRecommendations', () => {
  it('returns exactly N results even when scores are all zero', () => {
    const out = scoreRecommendations([A, B, C, D, E], [], 3)
    expect(out).toHaveLength(3)
  })

  it('sorts by score descending', () => {
    const selected = [{ attribute: 'goal', value: 'fat-loss' }, { attribute: 'experience', value: 'beginner' }]
    const out = scoreRecommendations([A, B, C, D], selected, 3)
    expect(out.map(p => p._id)).toEqual(['a', 'b', 'd']) // A=5, B=2, D=1, C=0 (dropped)
  })

  it('breaks ties by title alphabetical', () => {
    const alpha = p('x', 'Alpha', [['g', 'x', 1]])
    const bravo = p('y', 'Bravo', [['g', 'x', 1]])
    const out = scoreRecommendations([bravo, alpha], [{ attribute: 'g', value: 'x' }], 2)
    expect(out.map(p => p.title)).toEqual(['Alpha', 'Bravo'])
  })

  it('caps N at the available active programs', () => {
    const out = scoreRecommendations([A, B], [], 5)
    expect(out).toHaveLength(2)
  })

  it('ignores inactive programs', () => {
    const inactive: Program = { ...A, _id: 'x', active: false }
    const out = scoreRecommendations([inactive, B], [{ attribute: 'goal', value: 'fat-loss' }], 3)
    expect(out.map(p => p._id)).toEqual(['b'])
  })

  it('only awards weight when both attribute AND value match', () => {
    const out = scoreRecommendations([A], [{ attribute: 'goal', value: 'strength' }], 1)
    expect(out[0]).toBe(A) // returned as top-1 despite score 0 (padding)
  })
})
