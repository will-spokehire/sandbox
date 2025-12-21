import * as React from 'react'
import { cn } from '~/lib/utils'
import type { NumberedListBlockData } from '~/lib/payload-api'
import { TYPOGRAPHY } from '~/lib/design-tokens'

interface NumberedListBlockProps {
  data: NumberedListBlockData
}

/**
 * NumberedListBlock Component
 *
 * Displays a numbered list section with title and items containing headings and descriptions.
 * Matches the Figma RTBs List design.
 */
export function NumberedListBlock({ data }: NumberedListBlockProps) {
  const { title, items } = data

  if (!items || items.length === 0) {
    return null
  }

  return (
    <section className="bg-white px-4 md:px-[30px] pt-[60px] pb-0">
      <div className="flex flex-col gap-[44px] items-center w-full">
        {/* Main Title */}
        <div className="flex items-end justify-between relative shrink-0 w-full">
          <div className="flex flex-col gap-[26px] items-start relative shrink-0 w-full max-w-[760px]">
            <h2 className={cn(TYPOGRAPHY.h2, 'text-black w-full')}>
              {title}
            </h2>
          </div>
        </div>

        {/* Numbered Items List */}
        <div className="flex flex-col gap-[20px] items-start relative shrink-0 w-full">
          {items.map((item, index) => {
            // Auto-increment number if not provided
            const numberLabel = item.number || String(index + 1).padStart(2, '0')

            return (
              <div
                key={index}
                className="flex flex-col gap-[20px] items-start relative shrink-0 w-full"
              >
                {/* Number and Divider */}
                <div className="flex flex-col gap-[20px] items-start relative shrink-0 w-full">
                  {/* Number Label */}
                  <p className="font-light leading-[1.3] text-black uppercase">
                    <span className={cn(TYPOGRAPHY.h5)}>{numberLabel}</span>
                  </p>

                  {/* Divider Line */}
                  <div className="h-0 relative shrink-0 w-full">
                    <div className="absolute inset-0 border-t border-black" />
                  </div>
                </div>

                {/* Heading and Description - Two Column Layout (Desktop) / Stacked (Mobile) */}
                <div className="flex flex-col md:flex-row items-start md:justify-between not-italic relative shrink-0 text-black w-full gap-4 md:gap-0">
                  {/* Heading - Left Column */}
                  <p className="font-normal leading-[0.95] text-[32px] md:text-[42px] tracking-[-0.32px] md:tracking-[-0.42px] uppercase w-full md:w-[641px]">
                    {item.heading}
                  </p>

                  {/* Description - Right Column */}
                  <p className={cn(TYPOGRAPHY.bodyLarge, 'leading-[1.3] tracking-[-0.22px] w-full md:w-[658px]')}>
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default NumberedListBlock

