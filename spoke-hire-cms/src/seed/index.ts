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
import { stats, valueProps, ctaBlocks, homepageLayout } from './homepage-data'
import { footerData } from './footer-data'
import { headerData } from './header-data'

async function seed() {
  console.log('🌱 Starting seed process...')

  const payload = await getPayload({ config })

  try {
    // ============================================
    // 1. SEED STATS
    // ============================================
    console.log('📊 Seeding stats...')
    const createdStats: { id: string | number }[] = []

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
    // 2. SEED VALUE PROPS
    // ============================================
    console.log('💎 Seeding value props...')
    const createdValueProps: { id: string | number }[] = []

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
    // 3. SEED CTA BLOCKS
    // ============================================
    console.log('🎯 Seeding CTA blocks...')
    const createdCTABlocks: { id: string | number }[] = []

    for (const cta of ctaBlocks) {
      const existing = await payload.find({
        collection: 'cta-blocks',
        where: { heading: { equals: cta.heading } },
      })

      if (existing.docs.length === 0) {
        const created = await payload.create({
          collection: 'cta-blocks',
          data: cta,
          draft: false,
        })
        createdCTABlocks.push(created)
        console.log(`  ✓ Created CTA block: ${cta.heading}`)
      } else {
        createdCTABlocks.push(existing.docs[0])
        console.log(`  ○ CTA block already exists: ${cta.heading}`)
      }
    }

    // ============================================
    // 4. SEED HOMEPAGE STATIC PAGE
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
          case 'call-to-action-block':
            return {
              ...block,
              selectedCTA: createdCTABlocks[0]?.id,
            }
          default:
            return block
        }
      }) as typeof homepageLayout.layout

      await payload.create({
        collection: 'static-pages',
        data: {
          ...homepageLayout,
          layout: layoutWithRelationships,
        } as any,
      })
      console.log('  ✓ Created homepage')
    } else {
      console.log('  ○ Homepage already exists')
    }

    // ============================================
    // 5. SEED NAVIGATION GLOBAL (Header & Footer)
    // ============================================
    console.log('\n🔗 Seeding Navigation global (header & footer)...')

    try {
      // Get existing navigation global
      const existingNav = await payload.findGlobal({
        slug: 'navigation',
      })

      // Update with header and footer data
      await payload.updateGlobal({
        slug: 'navigation',
        data: {
          mainMenu: headerData.mainMenu,
          footerColumns: footerData.footerColumns,
          socialLinks: footerData.socialLinks,
          footerSettings: footerData.footerSettings,
        },
      })

      console.log('  ✓ Updated Navigation global with header data')
      console.log('  ✓ Updated Navigation global with footer data')
    } catch (error) {
      console.error('  ❌ Error seeding Navigation global:', error)
      // Continue even if navigation seeding fails
    }

    console.log('\n✅ Seed completed successfully!')
    console.log('\nSummary:')
    console.log(`  - Stats: ${createdStats.length}`)
    console.log(`  - Value Props: ${createdValueProps.length}`)
    console.log(`  - CTA Blocks: ${createdCTABlocks.length}`)
    console.log(`  - Homepage: 1`)
    console.log(`  - Navigation (Header): ${headerData.mainMenu.length} links`)
    console.log(`  - Navigation (Footer): Updated`)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }

  process.exit(0)
}

seed()

