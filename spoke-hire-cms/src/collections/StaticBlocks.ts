import type { CollectionConfig } from 'payload'
import { commonBlockFields } from '@/fields/commonBlockFields'
import { revalidateWebsite } from '../hooks/revalidateWebsite'

// Import all block definitions from StaticPages
import {
  StatsBarBlock,
  ValueStatsBlock,
  ValuePropsBlock,
  TestimonialsSectionBlock,
  FAQSectionBlock,
  RichTextContentBlock,
  CallToActionBlock,
  FeaturedVehiclesBlock,
  ImageCarouselBlock,
  SpotlightBlock,
  NumberedListBlock,
  SpacerBlock,
} from './StaticPages'

// ============================================
// STATIC BLOCKS COLLECTION
// ============================================

export const StaticBlocks: CollectionConfig = {
  slug: 'static-blocks',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'pageSlug', 'order', 'status', 'updatedAt'],
    description: 'Reusable content blocks that can be embedded on regular pages. Group blocks by pageSlug (e.g., "vehicle-page") and control order with the order field.',
    group: 'Content',
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
        await revalidateWebsite('static-blocks', operation === 'create' ? 'create' : 'update')
      },
    ],
    afterDelete: [
      async () => {
        await revalidateWebsite('static-blocks', 'delete')
      },
    ],
  },
  fields: [
    // ========================================
    // Core Fields
    // ========================================
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Block Name',
      admin: {
        placeholder: 'Vehicle FAQ Section',
        description: 'Display name for this block (for admin use)',
      },
    },
    {
      name: 'pageSlug',
      type: 'text',
      required: true,
      label: 'Page Slug',
      admin: {
        placeholder: 'vehicle-page',
        description: 'Page identifier to group blocks together (e.g., "vehicle-page"). All blocks with the same pageSlug will be rendered on that page.',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Order',
      defaultValue: 0,
      admin: {
        description: 'Sort order for blocks on the same page (lower numbers appear first)',
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

    // ========================================
    // Block Layout
    // ========================================
    {
      name: 'layout',
      type: 'blocks',
      label: 'Block Layout',
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
        ImageCarouselBlock,
        SpotlightBlock,
        NumberedListBlock,
        SpacerBlock,
      ],
      admin: {
        description: 'Build your block by adding and arranging content blocks',
      },
    },
  ],
}


