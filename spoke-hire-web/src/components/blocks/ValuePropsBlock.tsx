import Link from 'next/link'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import type { ValuePropsBlockData } from '~/lib/payload-api'
import {
  Shield,
  ShieldCheck,
  Star,
  CheckCircle,
  Heart,
  Award,
  Clock,
  Users,
  Zap,
  Car,
  Headset,
  Network,
  Globe,
  type LucideIcon,
} from 'lucide-react'

interface ValuePropsBlockProps {
  data: ValuePropsBlockData
}

// Icon mapping for value props - includes all icons used in seed data
const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  'shield-check': ShieldCheck,
  star: Star,
  'check-circle': CheckCircle,
  heart: Heart,
  award: Award,
  clock: Clock,
  users: Users,
  zap: Zap,
  car: Car,
  headset: Headset,
  network: Network,
  globe: Globe,
}

// Get icon component with fallback
function getIcon(iconName?: string): LucideIcon {
  if (!iconName) return CheckCircle
  return iconMap[iconName] ?? CheckCircle
}

/**
 * ValuePropsBlock Component
 *
 * Displays a feature grid highlighting platform benefits.
 */
export function ValuePropsBlock({ data }: ValuePropsBlockProps) {
  const { title, subtitle, selectedProps, displayStyle, columns } = data

  if (!selectedProps || selectedProps.length === 0) {
    return null
  }

  // Check if we should render split layout (columns === 2 and displayStyle === 'grid')
  const isSplitLayout = displayStyle === 'grid' && (columns === '2' || columns === 2)

  // Get column class based on columns value (handles both string and number)
  const getColumnClass = (cols: string | number) => {
    const colNum = String(cols)
    switch (colNum) {
      case '2': return 'grid-cols-1 md:grid-cols-2'
      case '3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case '4': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    }
  }

  // Split Layout (matching Figma design)
  if (isSplitLayout) {
    return (
      <section className="bg-white pt-[60px] md:pt-[100px] pb-0 px-[30px]">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-[206px] items-start">
            {/* Left Column */}
            <div className="w-full lg:w-[524px] shrink-0 flex flex-col gap-[22px]">
              {/* Main Heading */}
              <h2 className="heading-2 text-black w-full">
                {title.includes('\n') ? (
                  title.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < title.split('\n').length - 1 && <br aria-hidden="true" />}
                    </span>
                  ))
                ) : (
                  title
                )}
              </h2>

              {/* Description and Buttons */}
              {subtitle && (
                <div className="flex flex-col gap-[40px]">
                  <p className="body-large text-black w-full">{subtitle}</p>

                  {/* Button Group */}
                  <div className="flex flex-row flex-nowrap gap-[22px] md:gap-[24px] items-center">
                    <Button asChild variant="default" className="flex-1 min-w-0 shrink">
                      <Link href="/vehicles">ALL VEHICLES</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 min-w-0 shrink">
                      <Link href="/contact">GET IN TOUCH</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - 2x2 Grid */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[32px]">
                {selectedProps.map((prop) => {
                  const IconComponent = getIcon(prop.icon)
                  return (
                    <div
                      key={prop.id}
                      className="flex flex-col gap-[24px] items-start text-black"
                    >
                      {/* Icon */}
                      <div className="w-[30px] h-[30px] shrink-0">
                        <IconComponent className="w-full h-full text-black" />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-[7px] w-full">
                        {/* Heading */}
                        <div className="heading-3 text-black">
                          {prop.title.includes('\n') ? (
                            prop.title.split('\n').map((line, i) => (
                              <p key={i} className={i === 0 ? 'mb-0' : ''}>
                                {line}
                              </p>
                            ))
                          ) : (
                            <p className="mb-0">{prop.title}</p>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-base leading-[1.4] tracking-tight text-black">
                          {prop.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Standard Layout (existing behavior)
  return (
    <section className="pt-[60px] md:pt-[100px] pb-0 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>

        {/* Grid Display */}
        {displayStyle === 'grid' && (
          <div className={cn('grid gap-8', getColumnClass(columns))}>
            {selectedProps.map((prop) => {
              const IconComponent = getIcon(prop.icon)
              return (
                <div
                  key={prop.id}
                  className="bg-card rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconComponent className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{prop.title}</h3>
                  <p className="text-muted-foreground">{prop.description}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* List Display */}
        {displayStyle === 'list' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {selectedProps.map((prop) => {
              const IconComponent = getIcon(prop.icon)
              return (
                <div key={prop.id} className="flex gap-4 items-start">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{prop.title}</h3>
                    <p className="text-muted-foreground">{prop.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Carousel Display - simplified for now */}
        {displayStyle === 'carousel' && (
          <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory">
            {selectedProps.map((prop) => {
              const IconComponent = getIcon(prop.icon)
              return (
                <div
                  key={prop.id}
                  className="min-w-[280px] md:min-w-[320px] bg-card rounded-xl p-6 text-center snap-center shrink-0"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconComponent className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{prop.title}</h3>
                  <p className="text-muted-foreground">{prop.description}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default ValuePropsBlock

