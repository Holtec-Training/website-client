import { PortableText, type PortableTextBlock } from '@portabletext/react'

interface Props {
  headline?: string
  subhead?: PortableTextBlock[]
  onStart: () => void
}

const DEFAULT_HEADLINE = 'Find the program built for you.'
const DEFAULT_SUBHEAD_TEXT = "A short quiz — answers in under a minute. We'll match you with Milan's programs based on your goals, experience, and equipment."

export default function Landing({ headline, subhead, onStart }: Props) {
  const hasSubhead = Array.isArray(subhead) && subhead.length > 0

  return (
    <section className="qp-container qp-landing">
      <div className="qp-eyebrow">Program Portal</div>
      <h1 className="qp-landing-title">{headline || DEFAULT_HEADLINE}</h1>
      {hasSubhead ? (
        <div className="qp-landing-sub">
          <PortableText value={subhead} />
        </div>
      ) : (
        <p className="qp-landing-sub">{DEFAULT_SUBHEAD_TEXT}</p>
      )}
      <button onClick={onStart} className="qp-cta" style={{ maxWidth: 260 }}>
        Start the quiz
      </button>
    </section>
  )
}
