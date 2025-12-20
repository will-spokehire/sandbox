import type { Field } from 'payload'

/**
 * Common fields shared across all blocks
 * Add any shared block fields here to avoid duplication
 */
export const commonBlockFields: Field[] = [
  {
    name: 'hideOnMobile',
    type: 'checkbox',
    label: 'Hide on Mobile',
    defaultValue: false,
    admin: {
      description: 'Hide this block on mobile devices (screens < 640px)',
    },
  },
]

