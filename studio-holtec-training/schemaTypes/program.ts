import { defineField, defineType, defineArrayMember } from 'sanity'

export default defineType({
  name: 'program',
  title: 'Program',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      description: 'One-paragraph summary shown on the results card.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Full portable-text description.',
    }),
    defineField({
      name: 'pdf',
      title: 'PDF asset',
      type: 'file',
      options: { accept: 'application/pdf' },
      description: 'The branded PDF emailed to free-path customers.',
    }),
    defineField({
      name: 'priceCents',
      title: 'Price (cents, NZD)',
      type: 'number',
      description: 'Display price only — Stripe is the source of truth via stripePriceId.',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'stripePriceId',
      title: 'Stripe Price ID',
      type: 'string',
      description: 'e.g. price_1AbC2xY3Z4… — copy from Milan\'s Stripe dashboard.',
    }),
    defineField({
      name: 'scoringAttributes',
      title: 'Scoring attributes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'attribute', title: 'Attribute', type: 'string' }),
            defineField({ name: 'value', title: 'Value', type: 'string' }),
            defineField({ name: 'weight', title: 'Weight', type: 'number', initialValue: 1 }),
          ],
          preview: {
            select: { attribute: 'attribute', value: 'value', weight: 'weight' },
            prepare({ attribute, value, weight }) {
              return { title: `${attribute}=${value} (×${weight})` }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Uncheck to hide from the recommendation pool without deleting.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'summary' },
  },
})
