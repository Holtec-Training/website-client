import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { sanityServer } from './_lib/sanityServer'

interface Body {
  first_name: string
  last_name: string
  email: string
  phone?: string
  free_program_id?: string
  paid_program_ids: string[]
  session_id: string
  src: string
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 500, body: 'Stripe not configured' }

  let body: Body
  try { body = JSON.parse(event.body ?? '{}') } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  if (!body.paid_program_ids?.length) return { statusCode: 400, body: 'No paid programs selected' }

  const priceIds: string[] = await sanityServer.fetch(
    `*[_type == "program" && slug.current in $ids && defined(stripePriceId)].stripePriceId`,
    { ids: body.paid_program_ids },
  )
  if (!priceIds.length) return { statusCode: 400, body: 'No Stripe prices found for selection' }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: priceIds.map(price => ({ price, quantity: 1 })),
    customer_email: body.email,
    success_url: 'https://holtectraining.co.nz/programs/thanks?cs={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://holtectraining.co.nz/programs?cancelled=1',
    metadata: {
      session_id: body.session_id,
      src: body.src,
      free_program_id: body.free_program_id ?? '',
      paid_program_ids: body.paid_program_ids.join(','),
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone ?? '',
    },
  })

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkout_session_url: session.url }),
  }
}
