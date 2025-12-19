import type { CollectionConfig } from 'payload'

export const FeaturedVehiclesConfig: CollectionConfig = {
  slug: 'featured-vehicles-config',
  admin: {
    useAsTitle: 'selectionType',
    defaultColumns: ['selectionType', 'count'],
    description: 'Configure which vehicles appear in the featured section',
    group: 'Configuration',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
  },
  fields: [
    {
      name: 'selectionType',
      type: 'select',
      required: true,
      defaultValue: 'newest',
      label: 'Selection Strategy',
      options: [
        {
          label: 'Manual Selection',
          value: 'manual',
        },
        {
          label: 'Newest Vehicles',
          value: 'newest',
        },
        {
          label: 'Price Range',
          value: 'price-range',
        },
      ],
      admin: {
        description: 'How to select featured vehicles',
      },
    },
    {
      name: 'count',
      type: 'number',
      required: true,
      defaultValue: 6,
      min: 1,
      max: 12,
      label: 'Number of Vehicles',
      admin: {
        description: 'How many vehicles to display (1-12)',
      },
    },
    {
      name: 'criteria',
      type: 'json',
      label: 'Auto-Selection Criteria',
      admin: {
        description: 'JSON criteria for automatic selection (e.g., {"minPrice": 10000, "maxPrice": 50000})',
        condition: (data) => data.selectionType === 'price-range',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Configuration Notes',
      admin: {
        description: 'Internal notes about this configuration',
      },
    },
  ],
}


