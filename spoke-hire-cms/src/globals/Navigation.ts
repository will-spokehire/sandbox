import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: {
    description: 'Site-wide navigation menus, footer columns, and social links',
  },
  access: {
    read: () => true, // Public read access
    update: ({ req: { user } }) => !!user, // Admin only
  },
  fields: [
    {
      name: 'mainMenu',
      type: 'array',
      label: 'Main Navigation Menu',
      admin: {
        description: 'Primary navigation links displayed in header',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Link Label',
          admin: {
            placeholder: 'Hire, Register, Vehicles, About',
          },
        },
        {
          name: 'link',
          type: 'text',
          required: true,
          label: 'URL',
          admin: {
            placeholder: '/hire, /register, /vehicles',
          },
        },
        {
          name: 'children',
          type: 'array',
          label: 'Submenu Items',
          admin: {
            description: 'Optional dropdown menu items',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'link',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'icon',
          type: 'text',
          label: 'Icon Identifier',
          admin: {
            description: 'Optional icon name or identifier',
          },
        },
      ],
    },
    {
      name: 'footerColumns',
      type: 'array',
      label: 'Footer Columns',
      admin: {
        description: 'Footer content organized in columns (5 columns from design)',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Column Title',
          admin: {
            description: 'Optional title for the column (most columns have no title)',
          },
        },
        {
          name: 'type',
          type: 'select',
          label: 'Column Type',
          options: [
            {
              label: 'Links',
              value: 'links',
            },
            {
              label: 'Contact',
              value: 'contact',
            },
          ],
          admin: {
            description: 'Type determines how the column is rendered',
          },
        },
        {
          name: 'links',
          type: 'array',
          label: 'Links',
          admin: {
            description: 'For "links" type columns',
            condition: (data, siblingData) => siblingData.type === 'links',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'contactInfo',
          type: 'group',
          label: 'Contact Information',
          admin: {
            description: 'For "contact" type columns',
            condition: (data, siblingData) => siblingData.type === 'contact',
          },
          fields: [
            {
              name: 'addressLabel',
              type: 'text',
              label: 'Address Label',
              defaultValue: 'Address',
            },
            {
              name: 'addressValue',
              type: 'textarea',
              label: 'Address',
              admin: {
                placeholder: '92 Barcombe Avenue, London, SW2 3BA',
              },
            },
            {
              name: 'emailLabel',
              type: 'text',
              label: 'Email Label',
              defaultValue: 'Contact',
            },
            {
              name: 'emailValue',
              type: 'text',
              label: 'Email',
              admin: {
                placeholder: 'hello@spokehire.com',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Media Links',
      admin: {
        description: 'Social media profiles displayed in footer',
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          label: 'Platform',
          options: [
            {
              label: 'Facebook',
              value: 'facebook',
            },
            {
              label: 'Instagram',
              value: 'instagram',
            },
            {
              label: 'Twitter',
              value: 'twitter',
            },
            {
              label: 'LinkedIn',
              value: 'linkedin',
            },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: 'URL',
          admin: {
            placeholder: 'https://instagram.com/spokehire',
          },
        },
        {
          name: 'icon',
          type: 'text',
          label: 'Icon Identifier',
          admin: {
            description: 'Icon name or path (e.g., "instagram-24px")',
          },
        },
      ],
    },
    {
      name: 'footerSettings',
      type: 'group',
      label: 'Footer Settings',
      fields: [
        {
          name: 'copyrightText',
          type: 'text',
          label: 'Copyright Text',
          defaultValue: '© 2025 Spoke Hire Ltd. All rights reserved.',
          admin: {
            placeholder: '© 2025 Spoke Hire Ltd. All rights reserved.',
          },
        },
        {
          name: 'privacyPolicyUrl',
          type: 'text',
          label: 'Privacy Policy URL',
          defaultValue: '/privacy-policy',
        },
        {
          name: 'termsOfServiceUrl',
          type: 'text',
          label: 'Terms of Service URL',
          defaultValue: '/terms-of-service',
        },
        {
          name: 'showLargeLogo',
          type: 'checkbox',
          label: 'Show Large Logo',
          defaultValue: true,
          admin: {
            description: 'Display large SPOKE wordmark in footer',
          },
        },
      ],
    },
    {
      name: 'homeSlug',
      type: 'text',
      label: 'Home Page URL',
      defaultValue: '/',
      admin: {
        description: 'URL slug for the home page (used for logo link and redirects)',
        placeholder: '/',
      },
    },
  ],
}
