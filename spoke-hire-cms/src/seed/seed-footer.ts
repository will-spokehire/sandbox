/**
 * Footer Seed Script for PayloadCMS
 *
 * Seeds footer data from Figma design (node-id: 505-11735) into the Navigation global.
 * This script can be run independently to update footer content.
 *
 * Run with: npx tsx src/seed/seed-footer.ts
 * Or add to package.json: "seed:footer": "tsx src/seed/seed-footer.ts"
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { footerData } from './footer-data'

async function seedFooter() {
  console.log('🌱 Starting footer seed process...\n')

  const payload = await getPayload({ config })

  try {
    // ============================================
    // SEED NAVIGATION GLOBAL (Footer)
    // ============================================
    console.log('🔗 Seeding Navigation global with footer data...\n')

    // Get existing navigation global
    const existingNav = await payload.findGlobal({
      slug: 'navigation',
    })

    console.log('📋 Footer data to seed:')
    console.log(`  - Footer Columns: ${footerData.footerColumns.length}`)
    footerData.footerColumns.forEach((col, idx) => {
      if (col.type === 'contact') {
        console.log(`    Column ${idx + 1}: Contact (${col.contactInfo?.addressLabel}, ${col.contactInfo?.emailLabel})`)
      } else if (col.type === 'links') {
        console.log(`    Column ${idx + 1}: Links (${col.links?.length || 0} links)`)
      }
    })
    console.log(`  - Social Links: ${footerData.socialLinks.length}`)
    footerData.socialLinks.forEach((link) => {
      console.log(`    - ${link.platform}: ${link.url}`)
    })
    console.log(`  - Footer Settings:`)
    console.log(`    - Copyright: ${footerData.footerSettings.copyrightText}`)
    console.log(`    - Privacy Policy: ${footerData.footerSettings.privacyPolicyUrl}`)
    console.log(`    - Terms of Service: ${footerData.footerSettings.termsOfServiceUrl}`)
    console.log(`    - Show Large Logo: ${footerData.footerSettings.showLargeLogo}`)
    console.log('')

    // Update with footer data
    // Note: This will merge with existing navigation data (like mainMenu)
    // Only footer-related fields will be updated
    await payload.updateGlobal({
      slug: 'navigation',
      data: {
        footerColumns: footerData.footerColumns,
        socialLinks: footerData.socialLinks,
        footerSettings: footerData.footerSettings,
      },
    })

    console.log('✅ Footer seed completed successfully!\n')
    console.log('Summary:')
    console.log(`  ✓ Footer Columns: ${footerData.footerColumns.length}`)
    console.log(`  ✓ Social Links: ${footerData.socialLinks.length}`)
    console.log(`  ✓ Footer Settings: Updated`)
    console.log('\n💡 The footer will now appear on all pages using the Footer component.')
    console.log('   Make sure to run the main seed script if you also need homepage content.')
  } catch (error) {
    console.error('\n❌ Footer seed failed:', error)
    throw error
  }

  process.exit(0)
}

seedFooter()

