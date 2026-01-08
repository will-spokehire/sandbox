import type { CollectionConfig } from 'payload'
import { revalidateWebsite } from '../hooks/revalidateWebsite'

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
  hooks: {
    afterChange: [
      async ({ operation }) => {
        await revalidateWebsite('cta-blocks', operation === 'create' ? 'create' : 'update')
      },
    ],
    afterDelete: [
      async () => {
        await revalidateWebsite('cta-blocks', 'delete')
      },
    ],
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
      name: 'headingLevel',
      type: 'select',
      required: true,
      defaultValue: 'h2',
      label: 'Heading Level',
      options: [
        {
          label: 'H1',
          value: 'h1',
        },
        {
          label: 'H2',
          value: 'h2',
        },
        {
          label: 'H3',
          value: 'h3',
        },
        {
          label: 'H4',
          value: 'h4',
        },
        {
          label: 'H5',
          value: 'h5',
        },
        {
          label: 'H6',
          value: 'h6',
        },
      ],
      admin: {
        description: 'Select the HTML heading level for semantic structure',
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
      required: false,
      label: 'Actions',
      admin: {
        description: 'Add one or more action buttons (optional)',
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


