import type { CollectionConfig } from 'payload'

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'status'],
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




