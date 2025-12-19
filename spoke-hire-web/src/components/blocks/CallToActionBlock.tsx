import Link from 'next/link'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import type { CallToActionBlockData } from '~/lib/payload-api'

interface CallToActionBlockProps {
  data: CallToActionBlockData
}

/**
 * CallToActionBlock Component
 *
 * Displays a call-to-action section with 2-column layout (desktop) / 1-column (mobile).
 * Left column: Heading
 * Right column: Description + Action buttons
 */
export function CallToActionBlock({ data }: CallToActionBlockProps) {
  const { selectedCTA } = data

  if (!selectedCTA || !selectedCTA.actions || selectedCTA.actions.length === 0) {
    return null
  }

  const { heading, description, actions, backgroundStyle } = selectedCTA

  const bgClasses = {
    primary: 'bg-white text-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
  }

  const getButtonVariant = (style: string) => {
    switch (style) {
      case 'primary':
        return 'default'
      case 'secondary':
        return 'secondary'
      case 'outline':
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <section className={cn('py-16 md:py-24', bgClasses[backgroundStyle])}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 md:gap-12 items-start">
          {/* Left Column: Heading (2/3 width) */}
          <div>
            <h2 className="heading-2">{heading}</h2>
          </div>

          {/* Right Column: Description + Actions (1/3 width) */}
          <div className="flex flex-col gap-6 md:pt-16">
            <p className="body-large">{description}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  asChild
                  size="lg"
                  variant={getButtonVariant(action.style)}
                  className="text-lg px-8"
                >
                  <Link href={action.link}>{action.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CallToActionBlock

