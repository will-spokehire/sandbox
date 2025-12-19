/**
 * Header Seed Script for PayloadCMS
 *
 * Seeds header navigation data from Figma design (node-id: 494-4082) into the Navigation global.
 * This script can be run independently to update header navigation.
 *
 * Run with: npx tsx src/seed/seed-header.ts
 * Or add to package.json: "seed:header": "tsx src/seed/seed-header.ts"
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { headerData } from './header-data'

async function seedHeader() {
  console.log('🌱 Starting header seed process...\n')

  const payload = await getPayload({ config })

  try {
    // ============================================
    // SEED NAVIGATION GLOBAL (Header)
    // ============================================
    console.log('🔗 Seeding Navigation global with header data...\n')

    // Get existing navigation global
    const existingNav = await payload.findGlobal({
      slug: 'navigation',
    })

    console.log('📋 Header data to seed:')
    console.log(`  - Main Menu Links: ${headerData.mainMenu.length}`)
    headerData.mainMenu.forEach((link, idx) => {
      console.log(`    ${idx + 1}. ${link.label} → ${link.link}`)
    })
    console.log('')

    // Update with header data
    // Note: This will merge with existing navigation data (like footer)
    // Only mainMenu field will be updated
    await payload.updateGlobal({
      slug: 'navigation',
      data: {
        mainMenu: headerData.mainMenu,
      },
    })

    console.log('✅ Header seed completed successfully!\n')
    console.log('Summary:')
    console.log(`  ✓ Main Menu Links: ${headerData.mainMenu.length}`)
    console.log('\n💡 The header navigation will now appear using the PublicUserNavigation component.')
    console.log('   Make sure to run the main seed script if you also need footer and homepage content.')
  } catch (error) {
    console.error('\n❌ Header seed failed:', error)
    throw error
  }

  process.exit(0)
}

seedHeader()


