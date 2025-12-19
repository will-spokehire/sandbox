import type { CollectionConfig } from 'payload'

export const CTABlocks: CollectionConfig = {
  slug: 'cta-blocks',
  admin: {
    useAsTitle: 'heading',
    defaultColumns: ['heading', 'status'],
    description: 'Call-to-action sections',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
      label: 'Heading',
      admin: {
        placeholder: 'List Your Car Today',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Description',
      admin: {
        placeholder: 'Join thousands of vehicle owners earning money...',
      },
    },
    {
      name: 'actions',
      type: 'array',
      required: true,
      minRows: 1,
      label: 'Actions',
      admin: {
        description: 'Add one or more action buttons',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Button Label',
          admin: {
            placeholder: 'Get Started',
          },
        },
        {
          name: 'link',
          type: 'text',
          required: true,
          label: 'Button Link',
          admin: {
            placeholder: '/register',
          },
        },
        {
          name: 'style',
          type: 'select',
          required: true,
          defaultValue: 'primary',
          label: 'Button Style',
          options: [
            {
              label: 'Primary',
              value: 'primary',
            },
            {
              label: 'Secondary',
              value: 'secondary',
            },
            {
              label: 'Outline',
              value: 'outline',
            },
          ],
        },
      ],
    },
    {
      name: 'backgroundStyle',
      type: 'select',
      required: true,
      defaultValue: 'primary',
      label: 'Background Style',
      options: [
        {
          label: 'Primary',
          value: 'primary',
        },
        {
          label: 'Secondary',
          value: 'secondary',
        },
        {
          label: 'Accent',
          value: 'accent',
        },
      ],
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


