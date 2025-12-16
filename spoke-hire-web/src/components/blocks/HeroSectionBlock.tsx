'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '~/components/ui/button'
import type { HeroCarouselBlockData } from '~/lib/payload-api'
import { getMediaUrl } from '~/lib/payload-api'
import { Car, Headset, Globe, Star } from 'lucide-react'

interface HeroSectionBlockProps {
  data: HeroCarouselBlockData
}

/**
 * Stats items for the hero section
 * Based on Figma design: 10,000+ VEHICLES, SPECIALIST SUPPORT, UK-WIDE DELIVERY, TRUSTED SUPPLIER
 */
const heroStats = [
  { icon: Car, label: '10,000+ VEHICLES' },
  { icon: Headset, label: 'SPECIALIST SUPPORT' },
  { icon: Globe, label: 'UK-WIDE DELIVERY' },
  { icon: Star, label: 'TRUSTED SUPPLIER' },
]

/**
 * HeroSectionBlock Component
 *
 * A modern hero section matching the SpokeHire Figma design.
 * Features:
 * - Large uppercase headline with Degular font
 * - Subtitle and CTA buttons positioned to the right
 * - Stats bar with icons
 * - Full-width hero image
 */
export function HeroSectionBlock({ data }: HeroSectionBlockProps) {
  const { slides } = data

  // Use the first slide's data for the hero content
  const slide = slides?.[0]

  if (!slide) {
    return null
  }

  // Split heading into two lines (first 3 words, rest)
  const headingWords = slide.heading?.split(' ') || ['Classic', 'car', 'hire', 'made', 'easy']
  const headingLine1 = headingWords.slice(0, 3).join(' ')
  const headingLine2 = headingWords.slice(3).join(' ')

  return (
    <section className="relative w-full bg-white">
      {/* Main Content Container */}
      <div className="container mx-auto px-4 md:px-[30px] pt-10 md:pt-[41px] pb-0">
        {/* Hero Content Grid - Matching Figma Layout */}
        <div className="relative mb-10">
          {/* Two-column layout for desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_509px] gap-8 lg:gap-4">
            {/* Large Headline - Left Side */}
            <div>
              <h1 className="font-degular text-[clamp(40px,7vw,96px)] leading-[0.95] uppercase text-spoke-black">
                <span className="block">{headingLine1}</span>
                <span className="block">{headingLine2}</span>
              </h1>
            </div>

            {/* Right Side Content */}
            <div className="flex flex-col justify-end gap-8 lg:gap-[41px] lg:pb-4">
              {/* Subtitle */}
              <p className="font-degular text-lg md:text-[22px] leading-[1.3] tracking-[-0.22px] text-spoke-black max-w-[445px]">
                {slide.subheading ||
                  "Access the UK's largest classic car hire platform with thousands of vehicles available to hire today. Can't see it on the site? We'll find it."}
              </p>

              {/* Button Group */}
              <div className="flex gap-4 md:gap-[17px] items-center flex-wrap">
                <Button asChild className="w-full sm:w-[196px]">
                  <Link href={slide.ctaLink || '/vehicles'}>
                    {slide.ctaText || 'FIND A CAR'}
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/list-your-car">LIST YOUR CAR</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 md:gap-6 items-center justify-center py-6 border-t border-spoke-grey-light">
          {heroStats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center gap-2 h-[30px]"
            >
              <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-spoke-black" strokeWidth={1.5} />
              <span className="font-degular text-sm md:text-[20px] leading-[1.5] uppercase text-spoke-black whitespace-nowrap">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Image - Full Width Lightbox Style */}
      {slide.image && (
        <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[813px] overflow-hidden">
          <Image
            src={getMediaUrl(slide.image.url)}
            alt={slide.image.alt || slide.heading || 'Hero image'}
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </div>
      )}
    </section>
  )
}

export default HeroSectionBlock

