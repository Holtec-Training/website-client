export interface AttributeTag {
  attribute: string
  value: string
}

export interface QuestionOption {
  label: string
  attributeTags: AttributeTag[]
}

export interface Question {
  _id: string
  order: number
  prompt: string
  multi: boolean
  options: QuestionOption[]
  active: boolean
}
