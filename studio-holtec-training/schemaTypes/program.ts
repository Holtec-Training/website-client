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
      name: 'stripePriceId',
      title: 'Stripe Price ID (recurring $30/mo NZD)',
      type: 'string',
      description: 'e.g. price_1AbC2xY3Z4… — from Milan\'s Stripe dashboard. This is the RECURRING monthly Price for the program subscription; global rate is $30/mo NZD.',
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
