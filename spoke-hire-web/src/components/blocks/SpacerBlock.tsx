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
    small: 'h-4 md:h-5', // 16px mobile / 20px desktop
    medium: 'h-8 md:h-10', // 32px mobile / 40px desktop
    large: 'h-12 md:h-[60px]', // 48px mobile / 60px desktop
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






