import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { sanityServer } from './_lib/sanityServer'

interface Body {
  first_name: string
  last_name: string
  email: string
  phone?: string
  program_ids: string[]
  session_id: string
  src: string
  location?: string
  has_prior_claim?: boolean
}

interface CouponMapping { src: string; promotionCode: string }
interface SiteConfig { defaultPromotionCode?: string; couponMappings?: CouponMapping[] }

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 500, body: 'Stripe not configured' }

  let body: Body
  try { body = JSON.parse(event.body ?? '{}') } catch { return { statusCode: 400, body: 'Invalid JSON' } }

  const hasPriorClaim = body.has_prior_claim === true
  const minPrograms = hasPriorClaim ? 1 : 2

  if (!Array.isArray(body.program_ids) || body.program_ids.length < minPrograms) {
    return {
      statusCode: 400,
      body: hasPriorClaim
        ? 'Requires 1+ program_ids'
        : 'Path B requires 2+ program_ids',
    }
  }

  const priceIds: string[] = await sanityServer.fetch(
    `*[_type == "program" && slug.current in $ids && defined(stripePriceId)].stripePriceId`,
    { ids: body.program_ids },
  )
  if (priceIds.length !== body.program_ids.length) {
    return { statusCode: 400, body: 'One or more programs missing stripePriceId in Sanity' }
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  // Only apply the first-program-free promo to FRESH customers. Prior-claim customers
  // don't get the discount because they've already had their free program.
  let promotionCodeStr = ''
  let promotionCodeId: string | null = null
  if (!hasPriorClaim) {
    const cfg: SiteConfig | null = await sanityServer.fetch(
      `*[_id == "siteConfig"][0]{defaultPromotionCode, "couponMappings": coalesce(couponMappings[]{src, promotionCode}, [])}`,
    )
    if (!cfg?.defaultPromotionCode) return { statusCode: 500, body: 'No default promotion code configured in siteConfig' }
    const mapping = cfg.couponMappings?.find(m => m.src === body.src)
    promotionCodeStr = mapping?.promotionCode ?? cfg.defaultPromotionCode

    const promos = await stripe.promotionCodes.list({ code: promotionCodeStr, active: true, limit: 1 })
    if (!promos.data.length) {
      return { statusCode: 500, body: `Promotion code ${promotionCodeStr} not found or inactive in Stripe` }
    }
    promotionCodeId = promos.data[0].id
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ui_mode: 'embedded_page',
    // Restrict to card + Link only. Without payment_method_types, Stripe infers
    // available methods from your dashboard settings, which surfaces Klarna and
    // other BNPL providers we don't want on a recurring subscription.
    // Link is Stripe's own auto-fill for returning customers — good UX, keep it.
    payment_method_types: ['card', 'link'],
    line_items: priceIds.map(price => ({ price, quantity: 1 })),
    customer_email: body.email,
    ...(promotionCodeId ? { discounts: [{ promotion_code: promotionCodeId }] } : {}),
    return_url: `${process.env.HOLTEC_ENDPOINT}/programs/thanks?cs={CHECKOUT_SESSION_ID}`,
    metadata: {
      session_id: body.session_id,
      src: body.src,
      location: body.location ?? '',
      program_ids: body.program_ids.join(','),
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone ?? '',
      promotion_code: promotionCodeStr,
      has_prior_claim: hasPriorClaim ? 'true' : 'false',
    },
    subscription_data: {
      metadata: {
        session_id: body.session_id,
        src: body.src,
        location: body.location ?? '',
        program_ids: body.program_ids.join(','),
        has_prior_claim: hasPriorClaim ? 'true' : 'false',
      },
    },
  })

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_secret: session.client_secret }),
  }
}
