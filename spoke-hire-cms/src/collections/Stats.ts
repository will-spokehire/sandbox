import type { CollectionConfig } from 'payload'

export const Stats: CollectionConfig = {
  slug: 'stats',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'status'],
    description: 'Key metrics displayed as badges on homepage',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      label: 'Label',
      admin: {
        placeholder: 'Vehicles Available',
      },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'icons',
      label: 'Icon',
      admin: {
        description: 'Select an icon from the Icons collection',
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


