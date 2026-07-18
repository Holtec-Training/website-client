import { sanityClient } from './sanity'
import type { Program } from '../types/program'
import type { Question } from '../types/question'
import type { SiteConfig } from '../types/siteConfig'

const PROGRAM_FIELDS = `_id, title, slug, summary, stripePriceId,
  "scoringAttributes": scoringAttributes[]{attribute, value, weight}, active`

export function getPrograms(): Promise<Program[]> {
  return sanityClient.fetch(
    `*[_type == "program" && active == true] | order(title asc) { ${PROGRAM_FIELDS} }`,
  )
}

export function getQuestions(): Promise<Question[]> {
  return sanityClient.fetch(
    `*[_type == "question" && active == true] | order(order asc) {
      _id, order, prompt, multi, options, active
    }`,
  )
}

export function getSiteConfig(): Promise<SiteConfig | null> {
  return sanityClient.fetch(
    `*[_id == "siteConfig"][0]{
      programPortalEnabled,
      programPortalCtaLabel,
      defaultPromotionCode,
      "couponMappings": coalesce(couponMappings[]{src, promotionCode}, []),
      landingHeadline,
      landingSubhead
    }`,
  )
}
