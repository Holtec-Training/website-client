import type { Program } from '../types/program'
import type { AttributeTag } from '../types/question'

function scoreProgram(program: Program, selected: AttributeTag[]): number {
  let score = 0
  for (const attr of program.scoringAttributes) {
    for (const s of selected) {
      if (s.attribute === attr.attribute && s.value === attr.value) {
        score += attr.weight
      }
    }
  }
  return score
}

/**
 * Pass 6 semantics: return ALL active programs with score > 0, sorted by
 * score desc, ties broken by title alphabetical. NO cap, NO padding with
 * zero-score programs. Returns [] if no program matches.
 */
export function scoreRecommendations(
  programs: Program[],
  selected: AttributeTag[],
): Program[] {
  const active = programs.filter(p => p.active)
  const scored = active
    .map(p => ({ p, score: scoreProgram(p, selected) }))
    .filter(({ score }) => score > 0)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.p.title.localeCompare(b.p.title)
  })
  return scored.map(({ p }) => p)
}
