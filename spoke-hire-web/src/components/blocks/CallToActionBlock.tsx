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

  const { heading, description, actions, backgroundStyle, headingLevel = 'h2' } = selectedCTA

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

  const buttonCount = actions.length

  return (
    <section className={cn('py-16 md:py-24', bgClasses[backgroundStyle])}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 md:gap-12 items-start">
          {/* Left Column: Heading (2/3 width) */}
          <div>
            {headingLevel === 'h1' && <h1 className="heading-1">{heading}</h1>}
            {headingLevel === 'h2' && <h2 className="heading-2">{heading}</h2>}
            {headingLevel === 'h3' && <h3 className="heading-3">{heading}</h3>}
            {headingLevel === 'h4' && <h4 className="heading-4">{heading}</h4>}
            {headingLevel === 'h5' && <h5 className="heading-5">{heading}</h5>}
            {headingLevel === 'h6' && <h6 className="heading-6">{heading}</h6>}
          </div>

          {/* Right Column: Description + Actions (1/3 width) */}
          <div className="flex flex-col gap-6 md:pt-16">
            <p className="body-large">{description}</p>
            <div className="flex flex-row flex-nowrap gap-[22px] md:gap-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  asChild
                  size="lg"
                  variant={getButtonVariant(action.style)}
                  className={cn(
                    'text-lg px-6 md:px-8 shrink',
                    buttonCount === 1 ? 'w-full' : 'flex-1 min-w-0'
                  )}
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

