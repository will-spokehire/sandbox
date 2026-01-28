import type { CollectionConfig } from 'payload'
import { revalidateWebsite } from '../hooks/revalidateWebsite'

export const CarouselImages: CollectionConfig = {
  slug: 'carousel-images',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'status'],
    description: 'Images for image carousel blocks (supports mobile and desktop variants)',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
  },
  hooks: {
    afterChange: [
      async ({ operation }) => {
        await revalidateWebsite('carousel-images', operation === 'create' ? 'create' : 'update')
      },
    ],
    afterDelete: [
      async () => {
        await revalidateWebsite('carousel-images', 'delete')
      },
    ],
  },
  fields: [
    {
      name: 'desktopImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Desktop Image',
      admin: {
        description: 'Image displayed on desktop and tablet devices',
      },
    },
    {
      name: 'mobileImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Mobile Image',
      admin: {
        description: 'Optional: Image displayed on mobile devices. Falls back to desktop image if not provided.',
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
      admin: {
        placeholder: 'Descriptive text for accessibility',
        description: 'Required for accessibility. Describe the image content.',
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

