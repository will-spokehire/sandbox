import type { Block, CollectionConfig } from 'payload'
import { commonBlockFields } from '@/fields/commonBlockFields'

// ============================================
// BLOCK DEFINITIONS
// ============================================

/**
 * Stats Bar Block
 * Display key metrics/stats
 */
export const StatsBarBlock: Block = {
  slug: 'stats-bar',
  labels: {
    singular: 'Stats Bar',
    plural: 'Stats Bars',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      admin: {
        description: 'Optional title for the section',
      },
    },
    {
      name: 'displayStyle',
      type: 'select',
      label: 'Display Style',
      defaultValue: 'badges',
      options: [
        { label: 'Badges', value: 'badges' },
        { label: 'Cards', value: 'cards' },
        { label: 'Minimal', value: 'minimal' },
        { label: 'Large', value: 'large' },
      ],
    },
    {
      name: 'selectedStats',
      type: 'relationship',
      relationTo: 'stats',
      hasMany: true,
      required: true,
      filterOptions: {
        status: { equals: 'published' },
      },
      admin: {
        description: 'Select stats to display (order matters)',
      },
    },
    ...commonBlockFields,
  ],
}

/**
 * Value Stats Block
 * Display stats in simple horizontal layout matching hero style
 */
export const ValueStatsBlock: Block = {
  slug: 'value-stats',
  labels: {
    singular: 'Value Stats',
    plural: 'Value Stats',
  },
  fields: [
    {
      name: 'selectedStats',
      type: 'relationship',
      relationTo: 'stats',
      hasMany: true,
      required: true,
      filterOptions: {
        status: { equals: 'published' },
      },
      admin: {
        description: 'Select stats to display (order matters)',
      },
    },
    {
      name: 'backgroundColor',
      type: 'select',
      label: 'Background Color',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Muted', value: 'muted' },
        { label: 'Accent', value: 'accent' },
        { label: 'Primary', value: 'primary' },
      ],
    },
    ...commonBlockFields,
  ],
}

/**
 * Value Propositions Block
 * Display feature grid highlighting platform benefits
 */
export const ValuePropsBlock: Block = {
  slug: 'value-props-section',
  labels: {
    singular: 'Value Propositions',
    plural: 'Value Propositions',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      required: true,
      admin: {
        placeholder: 'Why Choose SpokeHire',
      },
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Subtitle',
      admin: {
        description: 'Supporting text below the title',
      },
    },
    {
      name: 'selectedProps',
      type: 'relationship',
      relationTo: 'value-props',
      hasMany: true,
      required: true,
      filterOptions: {
        status: { equals: 'published' },
      },
    },
    {
      name: 'displayStyle',
      type: 'select',
      label: 'Display Style',
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'List', value: 'list' },
        { label: 'Carousel', value: 'carousel' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      label: 'Columns',
      defaultValue: '4',
      options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
      ],
    },
    ...commonBlockFields,
  ],
}

/**
 * Testimonials Section Block
 * Display customer testimonials in carousel layout
 * Desktop: 3 cards per row with navigation arrows
 * Mobile: Single card with scroll dots
 */
export const TestimonialsSectionBlock: Block = {
  slug: 'testimonials-section',
  labels: {
    singular: 'Testimonials Section',
    plural: 'Testimonials Sections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      admin: {
        placeholder: 'What Our Customers Say',
      },
    },
    {
      name: 'selectedTestimonials',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      required: true,
      filterOptions: {
        status: { equals: 'published' },
      },
    },
    {
      name: 'showRatings',
      type: 'checkbox',
      label: 'Show Star Ratings',
      defaultValue: true,
    },
    ...commonBlockFields,
  ],
}

/**
 * FAQ Section Block
 * Display frequently asked questions in accordion format
 * Simplified to only support manual FAQ selection
 */
export const FAQSectionBlock: Block = {
  slug: 'faq-section',
  labels: {
    singular: 'FAQ Section',
    plural: 'FAQ Sections',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      admin: {
        placeholder: 'Frequently Asked Questions',
      },
    },
    {
      name: 'subtitle',
      type: 'richText',
      label: 'Subtitle',
      admin: {
        description: 'Support multiline text with formatting',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // If the value is a string (old format), convert it to richText format
            if (typeof value === 'string' && value.trim()) {
              // Convert string to Lexical format
              const lines = value.split('\n').filter(line => line.trim())
              return {
                root: {
                  children: lines.map((line) => ({
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: line.trim(),
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  })),
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'root',
                  version: 1,
                },
              }
            }
            return value
          },
        ],
      },
    },
    {
      name: 'selectedFAQs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      required: true,
      filterOptions: {
        status: { equals: 'published' },
      },
      admin: {
        description: 'Select specific FAQs to display',
      },
    },
    {
      name: 'defaultExpanded',
      type: 'checkbox',
      label: 'Default Expanded',
      defaultValue: false,
      admin: {
        description: 'Expand all FAQ items by default',
      },
    },
    ...commonBlockFields,
  ],
}

/**
 * Rich Text Content Block
 * Free-form rich text content with formatting
 */
export const RichTextContentBlock: Block = {
  slug: 'rich-text-content',
  labels: {
    singular: 'Rich Text Content',
    plural: 'Rich Text Contents',
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Content',
    },
    ...commonBlockFields,
  ],
}

/**
 * Call-to-Action Block
 * Call-to-action section with 2-column responsive layout
 */
export const CallToActionBlock: Block = {
  slug: 'call-to-action-block',
  labels: {
    singular: 'Call-to-Action Block',
    plural: 'Call-to-Action Blocks',
  },
  fields: [
    {
      name: 'selectedCTA',
      type: 'relationship',
      relationTo: 'cta-blocks',
      hasMany: false,
      required: true,
    },
    ...commonBlockFields,
  ],
}

/**
 * Featured Vehicles Block
 * Display featured vehicles in carousel format
 */
export const FeaturedVehiclesBlock: Block = {
  slug: 'featured-vehicles',
  labels: {
    singular: 'Featured Vehicles',
    plural: 'Featured Vehicles',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      admin: {
        placeholder: 'Featured Vehicles',
      },
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Subtitle',
    },
    {
      name: 'selectionType',
      type: 'select',
      label: 'Selection Type',
      defaultValue: 'latest',
      options: [
        { label: 'Manual IDs', value: 'manual' },
        { label: 'Latest', value: 'latest' },
      ],
    },
    {
      name: 'vehicleIds',
      type: 'array',
      label: 'Vehicle IDs',
      admin: {
        condition: (data, siblingData) => siblingData?.selectionType === 'manual',
        description: 'Enter vehicle IDs manually (one per line)',
      },
      fields: [
        {
          name: 'vehicleId',
          type: 'text',
          required: true,
          label: 'Vehicle ID',
        },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      label: 'Limit',
      defaultValue: 6,
      admin: {
        condition: (data, siblingData) => siblingData?.selectionType === 'latest',
        description: 'Number of latest vehicles to display',
      },
    },
    {
      name: 'showMobileButton',
      type: 'checkbox',
      label: "Show 'Show all' button on mobile",
      defaultValue: true,
      admin: {
        description: "Display the 'Show all vehicles' button on mobile devices",
      },
    },
    ...commonBlockFields,
  ],
}

/**
 * Image Gallery Block
 * Display image gallery/grid
 */
export const ImageGalleryBlock: Block = {
  slug: 'image-gallery',
  labels: {
    singular: 'Image Gallery',
    plural: 'Image Galleries',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
    },
    {
      name: 'images',
      type: 'array',
      label: 'Images',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption',
        },
        {
          name: 'link',
          type: 'text',
          label: 'Link URL',
          admin: {
            description: 'Optional URL when image is clicked',
          },
        },
      ],
    },
    {
      name: 'displayStyle',
      type: 'select',
      label: 'Display Style',
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
        { label: 'Carousel', value: 'carousel' },
        { label: 'Lightbox Grid', value: 'lightbox-grid' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      label: 'Columns',
      defaultValue: '3',
      options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
        { label: '5 Columns', value: '5' },
      ],
    },
    ...commonBlockFields,
  ],
}

/**
 * Image Carousel Block
 * Pure image carousel with auto-play, supports mobile and desktop images
 */
export const ImageCarouselBlock: Block = {
  slug: 'image-carousel',
  labels: {
    singular: 'Image Carousel',
    plural: 'Image Carousels',
  },
  fields: [
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'carousel-images',
      hasMany: true,
      required: true,
      filterOptions: {
        status: { equals: 'published' },
      },
      admin: {
        description: 'Select carousel images to display (order matters)',
      },
    },
    {
      name: 'autoplay',
      type: 'checkbox',
      label: 'Autoplay',
      defaultValue: true,
      admin: {
        description: 'Automatically advance to next image',
      },
    },
    {
      name: 'autoplayDelay',
      type: 'number',
      label: 'Autoplay Delay (seconds)',
      defaultValue: 5,
      min: 1,
      max: 60,
      admin: {
        description: 'Seconds between automatic slide transitions',
        condition: (data, siblingData) => siblingData?.autoplay,
      },
    },
    ...commonBlockFields,
  ],
}

/**
 * Two-Column Content Block
 * Side-by-side content layout
 */
export const TwoColumnContentBlock: Block = {
  slug: 'two-column-content',
  labels: {
    singular: 'Two-Column Content',
    plural: 'Two-Column Contents',
  },
  fields: [
    {
      name: 'leftColumn',
      type: 'richText',
      required: true,
      label: 'Left Column Content',
    },
    {
      name: 'rightColumn',
      type: 'richText',
      required: true,
      label: 'Right Column Content',
    },
    {
      name: 'columnRatio',
      type: 'select',
      label: 'Column Ratio',
      defaultValue: '50-50',
      options: [
        { label: '50/50', value: '50-50' },
        { label: '60/40', value: '60-40' },
        { label: '40/60', value: '40-60' },
        { label: '70/30', value: '70-30' },
        { label: '30/70', value: '30-70' },
      ],
    },
    {
      name: 'reverseOnMobile',
      type: 'checkbox',
      label: 'Reverse on Mobile',
      defaultValue: true,
      admin: {
        description: 'Stack columns in reverse order on mobile',
      },
    },
    {
      name: 'verticalAlignment',
      type: 'select',
      label: 'Vertical Alignment',
      defaultValue: 'top',
      options: [
        { label: 'Top', value: 'top' },
        { label: 'Center', value: 'center' },
        { label: 'Bottom', value: 'bottom' },
      ],
    },
    ...commonBlockFields,
  ],
}

/**
 * Project Spotlight Block
 * Display horizontal carousel of project spotlight items
 * References Spotlights collection for reusable spotlight items
 */
export const SpotlightBlock: Block = {
  slug: 'project-spotlight',
  labels: {
    singular: 'Project Spotlight',
    plural: 'Project Spotlights',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      defaultValue: 'PROJECT SPOTLIGHT',
      admin: {
        description: 'Title displayed above the spotlight items',
      },
    },
    {
      name: 'selectedSpotlights',
      type: 'relationship',
      relationTo: 'spotlights',
      hasMany: true,
      required: true,
      filterOptions: {
        status: { equals: 'published' },
      },
      admin: {
        description: 'Select spotlight items to display (order matters)',
      },
    },
    {
      name: 'showArrows',
      type: 'checkbox',
      label: 'Show Navigation Arrows',
      defaultValue: true,
      admin: {
        description: 'Display left/right arrow buttons for navigation',
      },
    },
    {
      name: 'itemsPerView',
      type: 'number',
      label: 'Items Per View',
      defaultValue: 4,
      admin: {
        description: 'Number of items visible at once (default: 4)',
      },
    },
    ...commonBlockFields,
  ],
}

/**
 * Numbered List Block (RTBs List)
 * Display a numbered list with title, items containing headings and descriptions
 */
export const NumberedListBlock: Block = {
  slug: 'numbered-list',
  labels: {
    singular: 'Numbered List',
    plural: 'Numbered Lists',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      required: true,
      admin: {
        placeholder: 'LIST YOUR CLASSIC CAR WITH SPOKE',
      },
    },
    {
      name: 'items',
      type: 'array',
      label: 'List Items',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'number',
          type: 'text',
          label: 'Number Label',
          admin: {
            description: 'Optional custom number (e.g., "01", "02"). If empty, will auto-increment.',
            placeholder: '01',
          },
        },
        {
          name: 'heading',
          type: 'text',
          label: 'Heading',
          required: true,
          admin: {
            placeholder: 'FREE TO LIST, EASY TO EARN',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
          required: true,
          admin: {
            placeholder: 'No listing fees. No exclusivity. No hassle...',
          },
        },
      ],
    },
    ...commonBlockFields,
  ],
}

/**
 * Spacer Block
 * Add vertical spacing between sections
 */
export const SpacerBlock: Block = {
  slug: 'spacer',
  labels: {
    singular: 'Spacer',
    plural: 'Spacers',
  },
  fields: [
    {
      name: 'height',
      type: 'select',
      label: 'Height',
      defaultValue: 'medium',
      options: [
        { label: 'Small (20px)', value: 'small' },
        { label: 'Medium (40px)', value: 'medium' },
        { label: 'Large (60px)', value: 'large' },
      ],
      admin: {
        description: 'Vertical spacing between sections',
      },
    },
    ...commonBlockFields,
  ],
}

// ============================================
// STATIC PAGES COLLECTION
// ============================================

export const StaticPages: CollectionConfig = {
  slug: 'static-pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    description: 'Create and manage static pages and articles using the page builder. Articles are accessible at /articles/[slug] and use a specialized template.',
    group: 'Content',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
  },
  hooks: {
    afterRead: [
      ({ doc }) => {
        // Convert old string subtitle data to richText format for FAQ blocks
        if (doc.layout && Array.isArray(doc.layout)) {
          doc.layout = doc.layout.map((block: any) => {
            if (block.blockType === 'faq-section' && block.subtitle && typeof block.subtitle === 'string') {
              // Convert string to Lexical format
              const lines = block.subtitle.split('\n').filter((line: string) => line.trim())
              block.subtitle = {
                root: {
                  children: lines.map((line: string) => ({
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: line.trim(),
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  })),
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'root',
                  version: 1,
                },
              }
            }
            return block
          })
        }
        return doc
      },
    ],
    beforeChange: [
      ({ data }) => {
        // Also convert on save to persist the conversion
        if (data.layout && Array.isArray(data.layout)) {
          data.layout = data.layout.map((block: any) => {
            if (block.blockType === 'faq-section' && block.subtitle && typeof block.subtitle === 'string') {
              const lines = block.subtitle.split('\n').filter((line: string) => line.trim())
              block.subtitle = {
                root: {
                  children: lines.map((line: string) => ({
                    children: [
                      {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: line.trim(),
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    type: 'paragraph',
                    version: 1,
                  })),
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'root',
                  version: 1,
                },
              }
            }
            return block
          })
        }
        return data
      },
    ],
  },
  fields: [
    // ========================================
    // Core Fields
    // ========================================
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Page Title',
      admin: {
        placeholder: 'About SpokeHire',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL Slug',
      admin: {
        placeholder: 'about',
        description: 'URL path for this page (accessible at /[slug])',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (typeof value === 'string') {
              // Convert to lowercase, remove special chars, replace spaces with hyphens
              return value
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Published At',
      admin: {
        description: 'Auto-set when status changes to published',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      hooks: {
        beforeChange: [
          ({ value, siblingData }) => {
            if (siblingData?.status === 'published' && !value) {
              return new Date().toISOString()
            }
            return value
          },
        ],
      },
    },

    // ========================================
    // Page Builder (Layout)
    // ========================================
    {
      name: 'layout',
      type: 'blocks',
      label: 'Page Layout',
      required: true,
      minRows: 1,
      blocks: [
        StatsBarBlock,
        ValueStatsBlock,
        ValuePropsBlock,
        TestimonialsSectionBlock,
        FAQSectionBlock,
        RichTextContentBlock,
        CallToActionBlock,
        FeaturedVehiclesBlock,
        ImageGalleryBlock,
        ImageCarouselBlock,
        TwoColumnContentBlock,
        SpotlightBlock,
        NumberedListBlock,
        SpacerBlock,
      ],
      admin: {
        description: 'Build your page by adding and arranging content blocks',
      },
    },

    // ========================================
    // SEO Fields
    // ========================================
    {
      name: 'seo',
      type: 'group',
      label: 'SEO Settings',
      admin: {
        description: 'Search engine optimization settings',
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Meta Title',
          maxLength: 60,
          admin: {
            description: 'Defaults to page title if not set (max 60 characters)',
          },
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Meta Description',
          maxLength: 160,
          admin: {
            description: 'Brief description for search results (max 160 characters)',
          },
        },
        {
          name: 'ogTitle',
          type: 'text',
          label: 'Open Graph Title',
          admin: {
            description: 'Title for social media sharing (defaults to Meta Title)',
          },
        },
        {
          name: 'ogDescription',
          type: 'textarea',
          label: 'Open Graph Description',
          admin: {
            description: 'Description for social media sharing (defaults to Meta Description)',
          },
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          label: 'Open Graph Image',
          admin: {
            description: 'Image for social media sharing (1200x630 recommended)',
          },
        },
        {
          name: 'keywords',
          type: 'array',
          label: 'Keywords',
          fields: [
            {
              name: 'keyword',
              type: 'text',
              required: true,
            },
          ],
          admin: {
            description: 'Keywords for SEO (optional)',
          },
        },
      ],
    },
  ],
}

