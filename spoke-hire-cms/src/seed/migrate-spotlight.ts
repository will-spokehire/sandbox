/**
 * Migration Script: Convert Image Gallery Spotlight to Project Spotlight Block
 *
 * This script migrates existing image-gallery blocks with title "PROJECT SPOTLIGHT"
 * to the new project-spotlight block format.
 *
 * Run with: NODE_OPTIONS=--no-deprecation npx tsx src/seed/migrate-spotlight.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

async function migrateSpotlight() {
  console.log('🔄 Starting spotlight migration...')

  const payload = await getPayload({ config })

  try {
    // Find homepage
    const homepage = await payload.find({
      collection: 'static-pages',
      where: { slug: { equals: 'home' } },
      depth: 2, // Need depth to get populated image relationships
    })

    if (homepage.docs.length === 0) {
      console.log('⚠️  Homepage not found')
      return
    }

    const page = homepage.docs[0]
    const layout = page.layout as any[]

    // Find image-gallery block with PROJECT SPOTLIGHT title
    const imageGalleryIndex = layout.findIndex(
      (block) => block.blockType === 'image-gallery' && block.title === 'PROJECT SPOTLIGHT'
    )

    if (imageGalleryIndex === -1) {
      console.log('ℹ️  No image-gallery block with PROJECT SPOTLIGHT found')
      
      // Check if project-spotlight block already exists
      const hasSpotlightBlock = layout.some((block) => block.blockType === 'project-spotlight')
      if (hasSpotlightBlock) {
        console.log('✓ Project spotlight block already exists')
      } else {
        console.log('⚠️  No spotlight block found. Run seed-images.ts to create one.')
      }
      return
    }

    const imageGalleryBlock = layout[imageGalleryIndex]
    console.log(`📦 Found image-gallery block with ${imageGalleryBlock.images?.length || 0} images`)

    // Convert to project-spotlight format
    const spotlightBlock = {
      blockType: 'project-spotlight',
      title: imageGalleryBlock.title || 'PROJECT SPOTLIGHT',
      images: (imageGalleryBlock.images || []).map((img: any) => ({
        image: typeof img.image === 'object' ? img.image.id : img.image,
        caption: img.caption || img.image?.alt || '',
        link: img.link || '',
      })),
      showArrows: true,
      itemsPerView: 4,
    }

    // Replace the image-gallery block with project-spotlight block
    layout[imageGalleryIndex] = spotlightBlock

    // Update the page
    await payload.update({
      collection: 'static-pages',
      id: page.id,
      data: { layout },
    })

    console.log('✓ Successfully migrated image-gallery to project-spotlight block')
    console.log(`  - Migrated ${spotlightBlock.images.length} images`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }

  process.exit(0)
}

migrateSpotlight()





