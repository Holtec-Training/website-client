import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Holtec Training',

  projectId: import.meta.env.SANITY_STUDIO_PROJECT_ID,
  dataset: import.meta.env.SANITY_STUDIO_DATASET,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Site config')
              .id('siteConfig')
              .child(
                S.document()
                  .schemaType('siteConfig')
                  .documentId('siteConfig')
              ),
            S.divider(),
            S.documentTypeListItem('program').title('Programs'),
            S.documentTypeListItem('question').title('Quiz questions'),
            S.documentTypeListItem('trainer').title('Trainers'),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, ctx) =>
      ctx.schemaType === 'siteConfig'
        ? prev.filter((a) => !['duplicate', 'delete'].includes(a.action!))
        : prev,
  },
})
