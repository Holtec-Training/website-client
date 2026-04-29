import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: '2sbbzydz',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2026-04-29',
})
