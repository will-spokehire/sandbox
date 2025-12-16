import type { CollectionConfig } from 'payload'

export const CTABlocks: CollectionConfig = {
  slug: 'cta-blocks',
  admin: {
    useAsTitle: 'heading',
    defaultColumns: ['heading', 'placement', 'status'],
    description: 'Call-to-action sections with customizable placement',
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
      name: 'buttonText',
      type: 'text',
      required: true,
      label: 'Button Text',
      admin: {
        placeholder: 'Get Started',
      },
    },
    {
      name: 'buttonLink',
      type: 'text',
      required: true,
      label: 'Button Link',
      admin: {
        placeholder: '/register',
      },
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
      name: 'placement',
      type: 'select',
      required: true,
      defaultValue: 'homepage',
      label: 'Placement',
      options: [
        {
          label: 'Homepage',
          value: 'homepage',
        },
        {
          label: 'Sidebar',
          value: 'sidebar',
        },
        {
          label: 'Footer',
          value: 'footer',
        },
      ],
      admin: {
        description: 'Where this CTA block should appear',
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

