import type { CollectionConfig } from 'payload'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'featured', 'status', 'order'],
    description: 'Frequently asked questions displayed across the website',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      label: 'Question',
      admin: {
        placeholder: 'How do I list my vehicle?',
      },
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      label: 'Answer',
      admin: {
        description: 'Detailed answer with formatting, links, and lists',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: [
        {
          label: 'General',
          value: 'general',
        },
        {
          label: 'Vehicle Owners',
          value: 'vehicle-owners',
        },
        {
          label: 'Renters',
          value: 'renters',
        },
        {
          label: 'Pricing',
          value: 'pricing',
        },
        {
          label: 'Technical',
          value: 'technical',
        },
      ],
      admin: {
        description: 'Category for organizing FAQs by topic',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Display Order',
      admin: {
        description: 'Order within category - lower numbers appear first',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured',
      defaultValue: false,
      admin: {
        description: 'Show this FAQ on homepage and featured sections',
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

