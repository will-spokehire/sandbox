import * as React from 'react'
import { cn } from '~/lib/utils'
import type { StatsBarBlockData } from '~/lib/payload-api'
import { StatsBadge } from '~/components/ui/stats-badge'
import {
  Car,
  Users,
  CheckCircle,
  Star,
  Shield,
  ShieldCheck,
  Clock,
  Award,
  Heart,
  Headset,
  Network,
  Globe,
  type LucideIcon,
} from 'lucide-react'

interface StatsBarBlockProps {
  data: StatsBarBlockData
}

// Icon mapping for stats - includes all icons used in seed data
const iconMap: Record<string, LucideIcon> = {
  car: Car,
  users: Users,
  'check-circle': CheckCircle,
  star: Star,
  shield: Shield,
  'shield-check': ShieldCheck,
  clock: Clock,
  award: Award,
  heart: Heart,
  headset: Headset,
  network: Network,
  globe: Globe,
}

// Get icon component for a stat with fallback
function getIconElement(iconName?: string): React.ReactNode {
  const IconComponent = iconName ? (iconMap[iconName] ?? CheckCircle) : CheckCircle
  return <IconComponent className="size-3.5" />
}

/**
 * StatsBarBlock Component
 *
 * Displays key metrics/stats in various display styles.
 */
export function StatsBarBlock({ data }: StatsBarBlockProps) {
  const { title, displayStyle, selectedStats, columns, backgroundColor } = data

  if (!selectedStats || selectedStats.length === 0) {
    return null
  }

  const bgClasses = {
    default: 'bg-white',
    muted: 'bg-muted',
    accent: 'bg-accent',
    primary: 'bg-primary text-primary-foreground',
  }

  // Get column class based on columns value (handles both string and number)
  const getColumnClass = (cols: string | number) => {
    const colNum = String(cols)
    switch (colNum) {
      case '2': return 'grid-cols-2'
      case '3': return 'grid-cols-2 md:grid-cols-3'
      case '4': return 'grid-cols-2 md:grid-cols-4'
      default: return 'grid-cols-2 md:grid-cols-4'
    }
  }

  return (
    <section className={cn('pt-[60px] pb-0', bgClasses[backgroundColor])}>
      <div className="container mx-auto px-4">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{title}</h2>
        )}

        {displayStyle === 'badges' && (
          <div className={cn('grid gap-4 md:gap-6', getColumnClass(columns))}>
            {selectedStats.map((stat) => (
              <StatsBadge
                key={stat.id}
                icon={getIconElement(stat.icon)}
                label={`${stat.value} ${stat.label}`}
              />
            ))}
          </div>
        )}

        {displayStyle === 'cards' && (
          <div className={cn('grid gap-6', getColumnClass(columns))}>
            {selectedStats.map((stat) => {
              const IconComponent = stat.icon ? (iconMap[stat.icon] ?? CheckCircle) : CheckCircle
              return (
                <div
                  key={stat.id}
                  className="bg-card rounded-lg p-6 text-center shadow-sm border"
                >
                  <IconComponent className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        )}

        {displayStyle === 'minimal' && (
          <div className={cn('grid gap-8', getColumnClass(columns))}>
            {selectedStats.map((stat) => (
              <div key={stat.id} className="text-center">
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {displayStyle === 'large' && (
          <div className={cn('grid gap-8', getColumnClass(columns))}>
            {selectedStats.map((stat) => {
              const IconComponent = stat.icon ? (iconMap[stat.icon] ?? CheckCircle) : CheckCircle
              return (
                <div key={stat.id} className="text-center">
                  <IconComponent className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2">
                    {stat.value}
                  </div>
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

