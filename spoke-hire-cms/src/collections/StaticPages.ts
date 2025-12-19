import type { Block, CollectionConfig } from 'payload'

// ============================================
// BLOCK DEFINITIONS
// ============================================

/**
 * Hero Carousel Block
 * Display rotating hero section with slides from hero-slides collection
 */
const HeroCarouselBlock: Block = {
  slug: 'hero-carousel',
  labels: {
    singular: 'Hero Carousel',
    plural: 'Hero Carousels',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      admin: {
        description: 'Optional title for admin reference',
      },
    },
    {
      name: 'slides',
      type: 'relationship',
      relationTo: 'hero-slides',
      hasMany: true,
      required: true,
      filterOptions: {
        status: { equals: 'published' },
      },
      admin: {
        description: 'Select which hero slides to display',
      },
    },
    {
      name: 'autoplay',
      type: 'checkbox',
      label: 'Autoplay',
      defaultValue: true,
    },
    {
      name: 'autoplayDelay',
      type: 'number',
      label: 'Autoplay Delay (ms)',
      defaultValue: 5000,
      admin: {
        condition: (data, siblingData) => siblingData?.autoplay,
      },
    },
    {
      name: 'showArrows',
      type: 'checkbox',
      label: 'Show Navigation Arrows',
      defaultValue: true,
    },
    {
      name: 'showDots',
      type: 'checkbox',
      label: 'Show Navigation Dots',
      defaultValue: true,
    },
  ],
}

/**
 * Stats Bar Block
 * Display key metrics/stats
 */
const StatsBarBlock: Block = {
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
      admin: {
        description: 'Number of columns on desktop',
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
  ],
}

/**
 * Value Propositions Block
 * Display feature grid highlighting platform benefits
 */
const ValuePropsBlock: Block = {
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
  ],
}

/**
 * Testimonials Section Block
 * Display customer testimonials
 */
const TestimonialsSectionBlock: Block = {
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
        placeholder: 'What Our Clients Say',
      },
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Subtitle',
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
      name: 'displayStyle',
      type: 'select',
      label: 'Display Style',
      defaultValue: 'carousel',
      options: [
        { label: 'Carousel', value: 'carousel' },
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
      ],
    },
    {
      name: 'showRatings',
      type: 'checkbox',
      label: 'Show Ratings',
      defaultValue: true,
    },
    {
      name: 'showImages',
      type: 'checkbox',
      label: 'Show Author Images',
      defaultValue: true,
    },
    {
      name: 'itemsPerView',
      type: 'number',
      label: 'Items Per View',
      defaultValue: 3,
      min: 1,
      max: 6,
      admin: {
        description: 'Number of testimonials visible at once (for carousel)',
      },
    },
  ],
}

/**
 * FAQ Section Block
 * Display frequently asked questions in accordion
 */
const FAQSectionBlock: Block = {
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
      type: 'textarea',
      label: 'Subtitle',
    },
    {
      name: 'filterBy',
      type: 'select',
      label: 'Filter By',
      defaultValue: 'manual',
      options: [
        { label: 'Manual Selection', value: 'manual' },
        { label: 'Category', value: 'category' },
        { label: 'Featured', value: 'featured' },
      ],
    },
    {
      name: 'selectedFAQs',
      type: 'relationship',
      relationTo: 'faqs',
      hasMany: true,
      filterOptions: {
        status: { equals: 'published' },
      },
      admin: {
        condition: (data, siblingData) => siblingData?.filterBy === 'manual',
        description: 'Select specific FAQs to display',
      },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: [
        { label: 'General', value: 'general' },
        { label: 'Vehicle Owners', value: 'vehicle-owners' },
        { label: 'Renters', value: 'renters' },
        { label: 'Pricing', value: 'pricing' },
        { label: 'Technical', value: 'technical' },
      ],
      admin: {
        condition: (data, siblingData) => siblingData?.filterBy === 'category',
      },
    },
    {
      name: 'limit',
      type: 'number',
      label: 'Limit',
      defaultValue: 10,
      admin: {
        condition: (data, siblingData) => siblingData?.filterBy === 'featured',
        description: 'Maximum number of featured FAQs to display',
      },
    },
    {
      name: 'displayStyle',
      type: 'select',
      label: 'Display Style',
      defaultValue: 'accordion',
      options: [
        { label: 'Accordion', value: 'accordion' },
        { label: 'Two Column', value: 'two-column' },
        { label: 'List', value: 'list' },
      ],
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
  ],
}

/**
 * Rich Text Content Block
 * Free-form rich text content with formatting
 */
const RichTextContentBlock: Block = {
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
    {
      name: 'maxWidth',
      type: 'select',
      label: 'Content Width',
      defaultValue: 'default',
      options: [
        { label: 'Narrow', value: 'narrow' },
        { label: 'Default', value: 'default' },
        { label: 'Wide', value: 'wide' },
        { label: 'Full', value: 'full' },
      ],
      admin: {
        description: 'Content width constraint',
      },
    },
    {
      name: 'backgroundColor',
      type: 'select',
      label: 'Background Color',
      defaultValue: 'white',
      options: [
        { label: 'White', value: 'white' },
        { label: 'Muted', value: 'muted' },
        { label: 'Accent', value: 'accent' },
      ],
    },
  ],
}

/**
 * Call-to-Action Block
 * Call-to-action section with 2-column responsive layout
 */
const CallToActionBlock: Block = {
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
  ],
}

/**
 * Featured Vehicles Block
 * Display featured vehicles grid/carousel
 */
const FeaturedVehiclesBlock: Block = {
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
      name: 'displayStyle',
      type: 'select',
      label: 'Display Style',
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Carousel', value: 'carousel' },
        { label: 'Masonry', value: 'masonry' },
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
        { label: '6 Columns', value: '6' },
      ],
    },
  ],
}

/**
 * Image Gallery Block
 * Display image gallery/grid
 */
const ImageGalleryBlock: Block = {
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
  ],
}

/**
 * Two-Column Content Block
 * Side-by-side content layout
 */
const TwoColumnContentBlock: Block = {
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
  ],
}

/**
 * Project Spotlight Block
 * Display horizontal carousel of project spotlight items
 * Uses Media collection images with captions and links (same as ImageGalleryBlock)
 */
const SpotlightBlock: Block = {
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
      name: 'images',
      type: 'array',
      label: 'Spotlight Images',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Image',
          admin: {
            description: 'Portrait orientation image (3:4 aspect ratio recommended)',
          },
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Caption/Title',
          required: true,
          admin: {
            description: 'Project title displayed below the image',
            placeholder: 'ABOUT BLANC',
          },
        },
        {
          name: 'link',
          type: 'text',
          label: 'Link',
          admin: {
            description: 'Optional link to project detail page',
            placeholder: '/projects/about-blanc',
          },
        },
      ],
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
  ],
}

/**
 * Spacer Block
 * Add vertical spacing between sections
 */
const SpacerBlock: Block = {
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
        { label: 'Small (2rem)', value: 'small' },
        { label: 'Medium (4rem)', value: 'medium' },
        { label: 'Large (6rem)', value: 'large' },
        { label: 'Extra Large (8rem)', value: 'extra-large' },
      ],
      admin: {
        description: 'Vertical spacing between sections',
      },
    },
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
    description: 'Create and manage static pages using the page builder',
    group: 'Content',
  },
  access: {
    read: () => true, // Public read access
    create: ({ req: { user } }) => !!user, // Admin only
    update: ({ req: { user } }) => !!user, // Admin only
    delete: ({ req: { user } }) => !!user, // Admin only
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
        description: 'URL path for this page (e.g., "about" becomes /about)',
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
        HeroCarouselBlock,
        StatsBarBlock,
        ValuePropsBlock,
        TestimonialsSectionBlock,
        FAQSectionBlock,
        RichTextContentBlock,
        CallToActionBlock,
        FeaturedVehiclesBlock,
        ImageGalleryBlock,
        TwoColumnContentBlock,
        SpotlightBlock,
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

