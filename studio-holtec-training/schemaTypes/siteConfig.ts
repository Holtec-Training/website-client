import { defineField, defineType, defineArrayMember } from 'sanity'

export default defineType({
  name: 'siteConfig',
  title: 'Site config',
  type: 'document',
  fields: [
    defineField({
      name: 'programPortalEnabled',
      title: 'Program Portal enabled',
      type: 'boolean',
      initialValue: false,
      description: 'Master switch. When off, /programs shows a placeholder and the Navbar CTA hides.',
    }),
    defineField({
      name: 'programPortalCtaLabel',
      title: 'Navbar CTA label',
      type: 'string',
      initialValue: 'Get Your Program',
    }),
    defineField({
      name: 'defaultPromotionCode',
      title: 'Default Stripe promotion code',
      type: 'string',
      initialValue: 'HOLTEC',
      description: 'Fallback promotion code used when a customer\'s ?src= value is not listed in Coupon mappings below. Must exist as an active Promotion Code in Stripe backed by the `one_program_free` coupon.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'couponMappings',
      title: 'Coupon mappings',
      type: 'array',
      description: 'Maps ?src= attribution values to customer-visible Stripe promotion codes. Each promotion code must already exist in Stripe, backed by the shared `one_program_free` coupon. Adding a new gym or event = create the Stripe promotion code, then add a mapping row here.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'src', title: 'src value', type: 'string', description: 'Exact match, e.g. "poster-ellerslie" or "nav"' }),
            defineField({ name: 'promotionCode', title: 'Stripe promotion code', type: 'string', description: 'e.g. "ELLERSLIE" — shown to the customer on their Stripe receipt' }),
          ],
          preview: {
            select: { src: 'src', code: 'promotionCode' },
            prepare({ src, code }) { return { title: `${src} → ${code}` } },
          },
        }),
      ],
    }),
    defineField({
      name: 'landingHeadline',
      title: 'Landing headline',
      type: 'string',
    }),
    defineField({
      name: 'landingSubhead',
      title: 'Landing subhead',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'holdingEmailBody',
      title: 'Welcome email body',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Path B welcome email — "Milan will be in touch" copy sent alongside the Stripe Customer Portal link.',
    }),
  ],
  preview: {
    prepare() { return { title: 'Site config' } },
  },
})
