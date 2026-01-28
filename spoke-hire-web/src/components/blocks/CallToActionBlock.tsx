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
 * Right column: Description + Action buttons (optional)
 */
export function CallToActionBlock({ data }: CallToActionBlockProps) {
  const { selectedCTA } = data

  if (!selectedCTA) {
    return null
  }

  const { heading, description, actions, headingLevel = 'h2' } = selectedCTA

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

  const getDescriptionPadding = (level: string, hasActions: boolean) => {
    const paddingMap: Record<string, string> = {
      h1: 'md:pt-[144px]',
      h2: 'md:pt-[96px]',
      h3: 'md:pt-[54px]',
      h4: 'md:pt-[48px]',
      h5: 'md:pt-[36px]',
      h6: 'md:pt-[27px]',
    }
    const basePadding = paddingMap[level] ?? 'md:pt-16' // fallback
    // If no actions, reduce padding since there's no button section below
    return basePadding 
  }

  const hasActions = actions && actions.length > 0
  const buttonCount = hasActions ? actions.length : 0

  // Conditional padding based on heading level
  const paddingClasses = headingLevel === 'h1' 
    ? 'pt-[14px] md:pt-[40px] pb-0'
    : 'pt-[60px] pb-0'

  return (
    <section className={cn(paddingClasses, 'bg-white text-foreground')}>
      <div >
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
          <div className={cn('flex flex-col gap-6', getDescriptionPadding(headingLevel, hasActions))}>
            <p className="body-large">{description}</p>
            {hasActions && (
              <div className={cn(
                'flex flex-row flex-nowrap gap-[22px] md:gap-4',
                buttonCount === 1 ? 'justify-start' : ''
              )}>
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    asChild
                    size="lg"
                    variant={getButtonVariant(action.style)}
                    className={cn(
                      'text-lg px-6 md:px-8 shrink',
                      buttonCount === 1 ? 'w-auto' : 'flex-1 min-w-0'
                    )}
                  >
                    <Link href={action.link}>{action.label}</Link>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CallToActionBlock

