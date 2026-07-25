import { createClient } from '@sanity/client'

export const sanityServer = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? '',
  dataset: process.env.SANITY_DATASET ?? '',
  useCdn: true,
  apiVersion: '2026-04-29',
})
