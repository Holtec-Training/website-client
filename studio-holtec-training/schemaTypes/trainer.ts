import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'trainer',
  title: 'Trainer',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. "Auckland", "Wellington"',
    }),
    defineField({
      name: 'specialties',
      title: 'Specialties',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Tags like "Strength", "Weight Loss", etc.',
    }),
    defineField({
      name: 'spec',
      title: 'Spec',
      type: 'string',
      description: 'Short descriptor, e.g. "Strength & Fat Loss"',
    }),
    defineField({
      name: 'isNew',
      title: 'Is New',
      type: 'boolean',
      description: 'Shows "New" badge if true, "Verified" if false',
      initialValue: false,
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Longer profile description (portable text)',
    }),
    defineField({
      name: 'certifications',
      title: 'Certifications',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'bookingUrl',
      title: 'Booking URL',
      type: 'url',
      description: 'Link to booking page',
    }),
    defineField({
      name: 'instagramHandle',
      title: 'Instagram Handle',
      type: 'string',
      description: 'Without the @ symbol',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'location',
      media: 'photo',
    },
  },
})
