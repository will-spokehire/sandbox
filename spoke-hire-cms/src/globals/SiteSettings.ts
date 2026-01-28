import type { GlobalConfig } from 'payload'
import { revalidateWebsite } from '../hooks/revalidateWebsite'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    description: 'Global site settings including branding, SEO defaults, and contact information',
  },
  access: {
    read: () => true, // Public read access
    update: ({ req: { user } }) => !!user, // Admin only
  },
  hooks: {
    afterChange: [
      async () => {
        await revalidateWebsite('site-settings', 'update')
      },
    ],
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'SpokeHire',
      label: 'Site Name',
      admin: {
        placeholder: 'SpokeHire',
      },
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'Site Tagline',
      admin: {
        description: 'Short tagline or slogan for the site',
        placeholder: 'UK\'s Leading Classic Car Hire Platform',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Site Logo',
      admin: {
        description: 'Main logo used in header and throughout the site',
      },
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
      label: 'Favicon',
      admin: {
        description: 'Browser favicon (16x16 or 32x32 px)',
      },
    },
    {
      name: 'seoDefaults',
      type: 'group',
      label: 'SEO Defaults',
      admin: {
        description: 'Default SEO values used when pages don\'t specify their own',
      },
      fields: [
        {
          name: 'defaultMetaDescription',
          type: 'textarea',
          label: 'Default Meta Description',
          maxLength: 160,
          admin: {
            placeholder: 'Discover the UK\'s largest collection of classic cars available for hire...',
          },
        },
        {
          name: 'defaultOgImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Default OG Image',
          admin: {
            description: 'Default image for social media sharing (1200x630 px recommended)',
          },
        },
      ],
    },
    {
      name: 'analytics',
      type: 'group',
      label: 'Analytics',
      fields: [
        {
          name: 'googleAnalyticsId',
          type: 'text',
          label: 'Google Analytics ID',
          admin: {
            placeholder: 'G-XXXXXXXXXX',
            description: 'Google Analytics 4 measurement ID',
          },
        },
      ],
    },
    {
      name: 'copyrightText',
      type: 'text',
      label: 'Copyright Text',
      defaultValue: '© 2025 Spoke Hire Ltd',
      admin: {
        description: 'Copyright text displayed in footer',
        placeholder: '© 2025 Spoke Hire Ltd',
      },
    },
    {
      name: 'contactInfo',
      type: 'group',
      label: 'Contact Information',
      admin: {
        description: 'General contact details used in footer and contact pages',
      },
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          admin: {
            placeholder: 'hello@spokehire.com',
          },
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Phone Number',
          admin: {
            placeholder: '+44 20 1234 5678',
          },
        },
        {
          name: 'address',
          type: 'textarea',
          label: 'Physical Address',
          admin: {
            placeholder: '92 Barcombe Avenue\nLondon\nSW2 3BA',
          },
        },
      ],
    },
  ],
}






