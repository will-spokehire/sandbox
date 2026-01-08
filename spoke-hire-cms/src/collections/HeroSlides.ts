import type { CollectionConfig } from 'payload'
import { revalidateWebsite } from '../hooks/revalidateWebsite'

export const HeroSlides: CollectionConfig = {
  slug: 'hero-slides',
  admin: {
    useAsTitle: 'heading',
    defaultColumns: ['heading', 'status'],
    description: 'Rotating hero section slides for homepage',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
  },
  hooks: {
    afterChange: [
      async ({ operation, doc }) => {
        await revalidateWebsite('hero-slides', operation === 'create' ? 'create' : 'update')
      },
    ],
    afterDelete: [
      async () => {
        await revalidateWebsite('hero-slides', 'delete')
      },
    ],
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Hero Background Image',
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      label: 'Main Headline',
    },
    {
      name: 'subheading',
      type: 'textarea',
      label: 'Supporting Text',
    },
    {
      name: 'ctaText',
      type: 'text',
      label: 'Button Text',
      admin: {
        placeholder: 'Browse Vehicles',
      },
    },
    {
      name: 'ctaLink',
      type: 'text',
      label: 'Button Link',
      admin: {
        placeholder: '/vehicles',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
    },
  ],
}




