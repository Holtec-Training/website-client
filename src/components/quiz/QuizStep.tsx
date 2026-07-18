import { useEffect, useState } from 'react'
import type { Question, AttributeTag } from '../../types/question'

interface Props { questions: Question[]; onComplete: (answers: AttributeTag[]) => void }

const ARC_CIRCUMFERENCE = 2 * Math.PI * 21  // r=21 → ~132

export default function QuizStep({ questions, onComplete }: Props) {
  const [idx, setIdx] = useState(0)
  // One selection Set per question index. Preserved across navigation so Back restores it.
  const [selectionsByQuestion, setSelectionsByQuestion] = useState<Set<number>[]>([])
  // UI state for the currently-visible question. Synced from selectionsByQuestion on nav.
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const q = questions[idx]

  useEffect(() => {
    setSelected(new Set(selectionsByQuestion[idx] ?? new Set()))
  }, [idx, selectionsByQuestion])

  if (!q) return null

  const goToQuestion = (nextIdx: number, updated: Set<number>[] = selectionsByQuestion) => {
    if (nextIdx >= questions.length) {
      const allTags: AttributeTag[] = []
      for (let qi = 0; qi < questions.length; qi++) {
        const set = updated[qi] ?? new Set<number>()
        const opts = questions[qi].options
        set.forEach(optIdx => { allTags.push(...opts[optIdx].attributeTags) })
      }
      onComplete(allTags)
      return
    }
    setSelectionsByQuestion(updated)
    setIdx(nextIdx)
  }

  const handleSingle = (optIdx: number) => {
    const next = [...selectionsByQuestion]
    next[idx] = new Set([optIdx])
    goToQuestion(idx + 1, next)
  }

  const toggleMulti = (optIdx: number) => {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(optIdx)) s.delete(optIdx); else s.add(optIdx)
      return s
    })
  }

  const submitMulti = () => {
    if (selected.size === 0) return
    const next = [...selectionsByQuestion]
    next[idx] = new Set(selected)
    goToQuestion(idx + 1, next)
  }

  const goBack = () => {
    if (idx > 0) setIdx(idx - 1)
  }

  const progress = (idx + 1) / questions.length
  const dashoffset = ARC_CIRCUMFERENCE * (1 - progress)

  return (
    <section className="qp-container">
      {idx > 0 && (
        <button onClick={goBack} className="qp-back-link" type="button">
          ← Back
        </button>
      )}

      <div className="qp-arc">
        <svg viewBox="0 0 48 48">
          <circle className="qp-arc-track" cx="24" cy="24" r="21" />
          <circle
            className="qp-arc-head"
            cx="24"
            cy="24"
            r="21"
            style={{
              strokeDasharray: ARC_CIRCUMFERENCE,
              strokeDashoffset: dashoffset,
            }}
          />
        </svg>
        <div>
          <div className="qp-arc-label">Progress</div>
          <div className="qp-arc-strong">Question {idx + 1} of {questions.length}</div>
        </div>
      </div>

      <h2 className="qp-question">{q.prompt}</h2>

      <div className="qp-options">
        {q.options.map((opt, i) => {
          const isSelected = selected.has(i)
          return (
            <button
              key={i}
              onClick={() => q.multi ? toggleMulti(i) : handleSingle(i)}
              className={`qp-option${isSelected ? ' selected' : ''}`}
              type="button"
            >
              <span>{opt.label}</span>
              <span className="qp-chevron" aria-hidden="true">›</span>
            </button>
          )
        })}
      </div>

      {q.multi && (
        <button
          onClick={submitMulti}
          disabled={selected.size === 0}
          className="qp-cta"
        >
          Next
        </button>
      )}
    </section>
  )
}
