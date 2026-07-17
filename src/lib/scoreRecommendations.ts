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

export function scoreRecommendations(
  programs: Program[],
  selected: AttributeTag[],
  n: number,
): Program[] {
  const active = programs.filter(p => p.active)
  const scored = active.map(p => ({ p, score: scoreProgram(p, selected) }))
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.p.title.localeCompare(b.p.title)
  })
  return scored.slice(0, Math.min(n, active.length)).map(({ p }) => p)
}
