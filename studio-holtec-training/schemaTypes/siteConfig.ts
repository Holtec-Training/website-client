import { defineField, defineType } from 'sanity'

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
      name: 'maxRecommendations',
      title: 'Max recommendations',
      type: 'number',
      initialValue: 3,
      validation: (Rule) => Rule.min(1).max(5).integer(),
      description: 'How many free programs to show on the results screen (top-N by score).',
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
      title: 'Holding email body',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Paid-path holding email — "Milan will set you up within 24h" copy.',
    }),
  ],
  preview: {
    prepare() { return { title: 'Site config' } },
  },
})
