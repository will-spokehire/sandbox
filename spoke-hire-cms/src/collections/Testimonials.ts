import type { CollectionConfig } from 'payload'
import { revalidateWebsite } from '../hooks/revalidateWebsite'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'author',
    defaultColumns: ['author', 'role', 'rating', 'status'],
    description: 'Customer testimonials and reviews displayed across the website',
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
        await revalidateWebsite('testimonials', operation === 'create' ? 'create' : 'update')
      },
    ],
    afterDelete: [
      async () => {
        await revalidateWebsite('testimonials', 'delete')
      },
    ],
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      label: 'Testimonial Quote',
      admin: {
        description: 'The testimonial text from the customer',
        placeholder: 'This service was exceptional...',
      },
    },
    {
      name: 'author',
      type: 'text',
      required: true,
      label: 'Author Name',
      admin: {
        placeholder: 'John Smith',
      },
    },
    {
      name: 'role',
      type: 'text',
      label: 'Role/Title',
      admin: {
        description: 'Author\'s role or relationship to the service',
        placeholder: 'Vehicle Owner, Film Producer, Wedding Client',
      },
    },
    {
      name: 'rating',
      type: 'number',
      label: 'Star Rating',
      min: 1,
      max: 5,
      admin: {
        description: 'Rating from 1 to 5 stars',
        step: 1,
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


