import { cn } from '~/lib/utils'
import type { SpacerBlockData } from '~/lib/payload-api'

interface SpacerBlockProps {
  data: SpacerBlockData
}

/**
 * SpacerBlock Component
 *
 * Adds vertical spacing between sections.
 */
export function SpacerBlock({ data }: SpacerBlockProps) {
  const { height } = data

  const heightClasses = {
    small: 'h-8 md:h-12', // 2rem / 3rem
    medium: 'h-16 md:h-20', // 4rem / 5rem
    large: 'h-24 md:h-32', // 6rem / 8rem
    'extra-large': 'h-32 md:h-40', // 8rem / 10rem
  }

  return (
    <div
      className={cn(heightClasses[height])}
      aria-hidden="true"
      role="presentation"
    />
  )
}

export default SpacerBlock

