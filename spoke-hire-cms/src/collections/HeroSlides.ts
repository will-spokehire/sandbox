import type { CollectionConfig } from 'payload'

export const HeroSlides: CollectionConfig = {
  slug: 'hero-slides',
  admin: {
    useAsTitle: 'heading',
    defaultColumns: ['heading', 'status', 'order'],
    description: 'Rotating hero section slides for homepage',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
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
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Display Order',
      admin: {
        description: 'Lower numbers appear first',
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

