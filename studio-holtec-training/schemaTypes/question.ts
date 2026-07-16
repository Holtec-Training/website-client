import { defineField, defineType, defineArrayMember } from 'sanity'

export default defineType({
  name: 'question',
  title: 'Quiz question',
  type: 'document',
  fields: [
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower numbers appear first in the quiz.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'prompt',
      title: 'Prompt',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'multi',
      title: 'Allow multiple selections',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'options',
      title: 'Options',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string' }),
            defineField({
              name: 'attributeTags',
              title: 'Attribute tags',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [
                    defineField({ name: 'attribute', title: 'Attribute', type: 'string' }),
                    defineField({ name: 'value', title: 'Value', type: 'string' }),
                  ],
                  preview: {
                    select: { attribute: 'attribute', value: 'value' },
                    prepare({ attribute, value }) {
                      return { title: `${attribute}=${value}` }
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: { label: 'label' },
            prepare({ label }) { return { title: label } },
          },
        }),
      ],
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  orderings: [{ title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'prompt', subtitle: 'order' },
    prepare({ title, subtitle }) { return { title, subtitle: `#${subtitle}` } },
  },
})
