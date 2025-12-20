import * as React from 'react'
import { cn } from '~/lib/utils'
import type { ValueStatsBlockData } from '~/lib/payload-api'
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

interface ValueStatsBlockProps {
  data: ValueStatsBlockData
}

// Icon mapping for stats - matches StatsBarBlock
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
            const IconComponent = stat.icon ? (iconMap[stat.icon] ?? CheckCircle) : CheckCircle
            // Format label: combine value and label if value exists, otherwise just label
            const displayLabel = stat.value ? `${stat.value} ${stat.label}` : stat.label

            return (
              <div
                key={stat.id}
                className="flex items-center gap-2 h-[30px]"
              >
                <IconComponent
                  className="w-4 h-4 md:w-5 md:h-5 text-spoke-black"
                  strokeWidth={1.5}
                />
                <span className="font-degular text-sm md:text-[20px] leading-[1.5] uppercase text-spoke-black whitespace-nowrap">
                  {displayLabel}
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

