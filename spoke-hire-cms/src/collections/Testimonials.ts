import type { CollectionConfig } from 'payload'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'author',
    defaultColumns: ['author', 'role', 'category', 'rating', 'featured', 'status', 'order'],
    description: 'Customer testimonials and reviews displayed across the website',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Author Photo',
      admin: {
        description: 'Optional photo of the person giving the testimonial',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: [
        {
          label: 'Vehicle Owner',
          value: 'vehicle-owner',
        },
        {
          label: 'Renter',
          value: 'renter',
        },
        {
          label: 'Wedding',
          value: 'wedding',
        },
        {
          label: 'Film',
          value: 'film',
        },
      ],
      admin: {
        description: 'Category for filtering testimonials by use case',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured',
      defaultValue: false,
      admin: {
        description: 'Show this testimonial on homepage and featured sections',
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

