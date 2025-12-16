/**
 * Seed Script for PayloadCMS
 *
 * This script populates the database with initial content data
 * based on the Figma homepage design.
 *
 * Run with: npx tsx src/seed/index.ts
 * Or add to package.json: "seed": "tsx src/seed/index.ts"
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { heroSlides, stats, valueProps, ctaBlocks, homepageLayout } from './homepage-data'
import { footerData } from './footer-data'

async function seed() {
  console.log('🌱 Starting seed process...')

  const payload = await getPayload({ config })

  try {
    // ============================================
    // 1. SEED HERO SLIDES (Skipped - requires image upload first)
    // ============================================
    console.log('📸 Hero slides... (skipped - requires images to be uploaded first)')
    console.log('  ℹ️  Upload hero images via CMS admin, then create hero slides manually')
    const createdHeroSlides: { id: string | number }[] = []

    // Fetch any existing hero slides for linking
    const existingHeroSlides = await payload.find({
      collection: 'hero-slides',
      where: { status: { equals: 'published' } },
      limit: 10,
    })
    createdHeroSlides.push(...existingHeroSlides.docs)

    // ============================================
    // 2. SEED STATS
    // ============================================
    console.log('📊 Seeding stats...')
    const createdStats = []

    for (const stat of stats) {
      const existing = await payload.find({
        collection: 'stats',
        where: { label: { equals: stat.label } },
      })

      if (existing.docs.length === 0) {
        const created = await payload.create({
          collection: 'stats',
          data: stat,
        })
        createdStats.push(created)
        console.log(`  ✓ Created stat: ${stat.label}`)
      } else {
        createdStats.push(existing.docs[0])
        console.log(`  ○ Stat already exists: ${stat.label}`)
      }
    }

    // ============================================
    // 3. SEED VALUE PROPS
    // ============================================
    console.log('💎 Seeding value props...')
    const createdValueProps = []

    for (const prop of valueProps) {
      const existing = await payload.find({
        collection: 'value-props',
        where: { title: { equals: prop.title } },
      })

      if (existing.docs.length === 0) {
        const created = await payload.create({
          collection: 'value-props',
          data: prop,
        })
        createdValueProps.push(created)
        console.log(`  ✓ Created value prop: ${prop.title}`)
      } else {
        createdValueProps.push(existing.docs[0])
        console.log(`  ○ Value prop already exists: ${prop.title}`)
      }
    }

    // ============================================
    // 4. SEED CTA BLOCKS
    // ============================================
    console.log('🎯 Seeding CTA blocks...')
    const createdCTABlocks = []

    for (const cta of ctaBlocks) {
      const existing = await payload.find({
        collection: 'cta-blocks',
        where: { heading: { equals: cta.heading } },
      })

      if (existing.docs.length === 0) {
        const created = await payload.create({
          collection: 'cta-blocks',
          data: cta,
        })
        createdCTABlocks.push(created)
        console.log(`  ✓ Created CTA block: ${cta.heading}`)
      } else {
        createdCTABlocks.push(existing.docs[0])
        console.log(`  ○ CTA block already exists: ${cta.heading}`)
      }
    }

    // ============================================
    // 5. SEED HOMEPAGE STATIC PAGE
    // ============================================
    console.log('📄 Seeding homepage...')

    // Check if homepage already exists
    const existingHomepage = await payload.find({
      collection: 'static-pages',
      where: { slug: { equals: 'home' } },
    })

    if (existingHomepage.docs.length === 0) {
      // Build the layout with relationships
      const layoutWithRelationships = homepageLayout.layout.map((block) => {
        switch (block.blockType) {
          case 'hero-carousel':
            return {
              ...block,
              slides: createdHeroSlides.map((s) => s.id),
            }
          case 'stats-bar':
            return {
              ...block,
              selectedStats: createdStats.map((s) => s.id),
            }
          case 'value-props-section':
            return {
              ...block,
              selectedProps: createdValueProps.map((p) => p.id),
            }
          case 'cta-block':
            return {
              ...block,
              selectedCTA: createdCTABlocks[0]?.id,
            }
          default:
            return block
        }
      })

      await payload.create({
        collection: 'static-pages',
        data: {
          ...homepageLayout,
          layout: layoutWithRelationships,
        },
      })
      console.log('  ✓ Created homepage')
    } else {
      console.log('  ○ Homepage already exists')
    }

    // ============================================
    // 6. SEED NAVIGATION GLOBAL (Footer)
    // ============================================
    console.log('\n🔗 Seeding Navigation global (footer)...')

    try {
      // Get existing navigation global
      const existingNav = await payload.findGlobal({
        slug: 'navigation',
      })

      // Update with footer data
      await payload.updateGlobal({
        slug: 'navigation',
        data: {
          footerColumns: footerData.footerColumns,
          socialLinks: footerData.socialLinks,
          footerSettings: footerData.footerSettings,
        },
      })

      console.log('  ✓ Updated Navigation global with footer data')
    } catch (error) {
      console.error('  ❌ Error seeding Navigation global:', error)
      // Continue even if footer seeding fails
    }

    console.log('\n✅ Seed completed successfully!')
    console.log('\nSummary:')
    console.log(`  - Hero Slides: ${createdHeroSlides.length}`)
    console.log(`  - Stats: ${createdStats.length}`)
    console.log(`  - Value Props: ${createdValueProps.length}`)
    console.log(`  - CTA Blocks: ${createdCTABlocks.length}`)
    console.log(`  - Homepage: 1`)
    console.log(`  - Navigation (Footer): Updated`)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }

  process.exit(0)
}

seed()

