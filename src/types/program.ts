export interface ScoringAttribute {
  attribute: string
  value: string
  weight: number
}

export interface Program {
  _id: string
  title: string
  slug: { current: string }
  summary?: string
  stripePriceId?: string
  scoringAttributes: ScoringAttribute[]
  active: boolean
}
