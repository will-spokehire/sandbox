import type { CollectionConfig } from 'payload'

export const Stats: CollectionConfig = {
  slug: 'stats',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'value', 'status', 'order'],
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
      name: 'value',
      type: 'text',
      required: true,
      label: 'Value',
      admin: {
        placeholder: '20000+',
      },
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Icon Identifier',
      admin: {
        description: 'Icon name or identifier (e.g., "car", "users", "check-circle")',
        placeholder: 'car',
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


