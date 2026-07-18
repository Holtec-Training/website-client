import type { PortableTextBlock } from '@portabletext/react'

export interface CouponMapping {
  src: string
  promotionCode: string
}

export interface SiteConfig {
  programPortalEnabled: boolean
  programPortalCtaLabel: string
  defaultPromotionCode: string
  couponMappings: CouponMapping[]
  landingHeadline?: string
  landingSubhead?: PortableTextBlock[]
}
