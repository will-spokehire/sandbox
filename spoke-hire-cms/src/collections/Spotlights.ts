import type { CollectionConfig } from 'payload'

export const Spotlights: CollectionConfig = {
  slug: 'spotlights',
  admin: {
    useAsTitle: 'caption',
    defaultColumns: ['caption', 'status'],
    description: 'Project spotlight items for reuse across multiple pages',
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
      label: 'Image',
      admin: {
        description: 'Portrait orientation image (3:4 aspect ratio recommended)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      required: true,
      label: 'Caption/Title',
      admin: {
        description: 'Project title displayed below the image',
        placeholder: 'ABOUT BLANC',
      },
    },
    {
      name: 'link',
      type: 'text',
      label: 'Link',
      admin: {
        description: 'Optional link to project detail page',
        placeholder: '/projects/about-blanc',
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

