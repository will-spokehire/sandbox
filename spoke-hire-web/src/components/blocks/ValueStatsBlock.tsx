import * as React from 'react'
import { cn } from '~/lib/utils'
import type { ValueStatsBlockData } from '~/lib/payload-api'
import { renderIcon, getIconComponent } from '~/lib/icon-renderer'
import { CheckCircle } from 'lucide-react'

interface ValueStatsBlockProps {
  data: ValueStatsBlockData
}

/**
 * ValueStatsBlock Component
 *
 * Displays stats in a simple horizontal layout matching the hero section style.
 * Icon + text, uppercase, horizontal flex layout.
 */
export function ValueStatsBlock({ data }: ValueStatsBlockProps) {
  const { selectedStats, backgroundColor } = data

  if (!selectedStats || selectedStats.length === 0) {
    return null
  }

  const bgClasses = {
    default: 'bg-white',
    muted: 'bg-muted',
    accent: 'bg-accent',
    primary: 'bg-primary text-primary-foreground',
  }

  return (
    <section className={cn('pt-[40px] pb-0', bgClasses[backgroundColor || 'default'])}>
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap gap-4 md:gap-6 items-center justify-center">
          {selectedStats.map((stat) => {
            const IconComponent = typeof stat.icon === 'string' 
              ? getIconComponent(stat.icon) 
              : CheckCircle

            return (
              <div
                key={stat.id}
                className="flex items-center gap-2 h-[30px]"
              >
                {typeof stat.icon === 'string' ? (
                  <IconComponent
                    className="w-3.5 h-3.5 md:w-3.5 md:h-3.5 text-spoke-black"
                    strokeWidth={1.5}
                  />
                ) : (
                  renderIcon(stat.icon, 'h-3.5 text-spoke-black')
                )}
                <span className="font-degular text-sm md:text-[20px] uppercase text-spoke-black whitespace-nowrap">
                  {stat.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ValueStatsBlock

