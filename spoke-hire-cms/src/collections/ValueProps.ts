import type { CollectionConfig } from 'payload'

export const ValueProps: CollectionConfig = {
  slug: 'value-props',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status'],
    description: 'Feature grid highlighting platform benefits',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Title',
      admin: {
        placeholder: "UK's Most Trusted",
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
      admin: {
        placeholder: 'Detailed explanation of this value proposition...',
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


