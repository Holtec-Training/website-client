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
  priceCents?: number
  stripePriceId?: string
  scoringAttributes: ScoringAttribute[]
  active: boolean
}
