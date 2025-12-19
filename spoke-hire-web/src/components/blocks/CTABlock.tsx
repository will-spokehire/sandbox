import Link from 'next/link'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import type { CTABlockData } from '~/lib/payload-api'

interface CTABlockProps {
  data: CTABlockData
}

/**
 * CTABlock Component
 *
 * Displays a call-to-action section with customizable styling.
 */
export function CTABlock({ data }: CTABlockProps) {
  const { selectedCTA, customOverride, displayStyle } = data

  if (!selectedCTA) {
    return null
  }

  // Use custom overrides if provided, otherwise use CTA block content
  const heading = customOverride?.heading || selectedCTA.heading
  const description = customOverride?.description || selectedCTA.description
  const buttonText = customOverride?.buttonText || selectedCTA.buttonText
  const buttonLink = customOverride?.buttonLink || selectedCTA.buttonLink
  const backgroundStyle = selectedCTA.backgroundStyle

  const bgClasses = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
  }

  const buttonVariant = backgroundStyle === 'primary' ? 'secondary' : 'default'

  return (
    <section className={cn('py-16 md:py-24', bgClasses[backgroundStyle])}>
      <div className="container mx-auto px-4">
        {/* Full Width Display */}
        {displayStyle === 'full-width' && (
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{heading}</h2>
            <p className="text-lg md:text-xl opacity-90 mb-8">{description}</p>
            <Button asChild size="lg" variant={buttonVariant} className="text-lg px-8">
              <Link href={buttonLink}>{buttonText}</Link>
            </Button>
          </div>
        )}

        {/* Contained Display */}
        {displayStyle === 'contained' && (
          <div className="max-w-4xl mx-auto bg-card text-card-foreground rounded-2xl p-8 md:p-12 shadow-lg text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{heading}</h2>
            <p className="text-muted-foreground mb-6">{description}</p>
            <Button asChild size="lg">
              <Link href={buttonLink}>{buttonText}</Link>
            </Button>
          </div>
        )}

        {/* Split Display */}
        {displayStyle === 'split' && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:flex-1">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">{heading}</h2>
              <p className="text-lg opacity-90">{description}</p>
            </div>
            <div className="shrink-0">
              <Button asChild size="lg" variant={buttonVariant} className="text-lg px-8">
                <Link href={buttonLink}>{buttonText}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default CTABlock


