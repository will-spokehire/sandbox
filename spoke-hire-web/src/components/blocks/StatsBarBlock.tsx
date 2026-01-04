import * as React from 'react'
import type { StatsBarBlockData } from '~/lib/payload-api'
import { StatsBadge } from '~/components/ui/stats-badge'
import { renderIcon, getIconComponent } from '~/lib/icon-renderer'
import { CheckCircle } from 'lucide-react'

interface StatsBarBlockProps {
  data: StatsBarBlockData
}

/**
 * StatsBarBlock Component
 *
 * Displays key metrics/stats in various display styles.
 */
export function StatsBarBlock({ data }: StatsBarBlockProps) {
  const { title, displayStyle, selectedStats } = data

  if (!selectedStats || selectedStats.length === 0) {
    return null
  }

  return (
    <section className="pt-[60px] pb-0">
      <div className="flex flex-col items-center px-4">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{title}</h2>
        )}

        {displayStyle === 'badges' && (
          <div className="flex flex-wrap items-center justify-center gap-6">
            {selectedStats.map((stat) => (
              <StatsBadge
                key={stat.id}
                icon={renderIcon(stat.icon, 'size-3.5')}
                label={stat.label}
              />
            ))}
          </div>
        )}

        {displayStyle === 'cards' && (
          <div className="flex flex-wrap items-center justify-center gap-6">
            {selectedStats.map((stat) => {
              const IconComponent = typeof stat.icon === 'string' 
                ? getIconComponent(stat.icon) 
                : CheckCircle
              return (
                <div
                  key={stat.id}
                  className="bg-card rounded-lg p-6 text-center shadow-sm border"
                >
                  {typeof stat.icon === 'string' ? (
                    <IconComponent className="w-8 h-8 mx-auto mb-3 text-primary" />
                  ) : (
                    renderIcon(stat.icon, 'w-8 h-8 mx-auto mb-3 text-primary')
                  )}
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        )}

        {displayStyle === 'minimal' && (
          <div className="flex flex-wrap items-center justify-center gap-8">
            {selectedStats.map((stat) => (
              <div key={stat.id} className="text-center">
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {displayStyle === 'large' && (
          <div className="flex flex-wrap items-center justify-center gap-8">
            {selectedStats.map((stat) => {
              const IconComponent = typeof stat.icon === 'string' 
                ? getIconComponent(stat.icon) 
                : CheckCircle
              return (
                <div key={stat.id} className="text-center">
                  {typeof stat.icon === 'string' ? (
                    <IconComponent className="w-12 h-12 mx-auto mb-4 text-primary" />
                  ) : (
                    renderIcon(stat.icon, 'w-12 h-12 mx-auto mb-4 text-primary')
                  )}
                  <div className="text-lg text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default StatsBarBlock

