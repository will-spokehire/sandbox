import type { CollectionConfig } from 'payload'

export const Icons: CollectionConfig = {
  slug: 'icons',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name'],
    description: 'Custom SVG icons for use across the website',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Icon Name',
      admin: {
        placeholder: 'car',
        description: 'Unique identifier for the icon (e.g., "car", "shield")',
      },
    },
    {
      name: 'svg',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'SVG File',
      admin: {
        description: 'Upload the SVG icon file from Figma',
      },
    },
  ],
}

