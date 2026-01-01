/**
 * Image Seed Script for PayloadCMS
 *
 * This script downloads images from URLs and uploads them to PayloadCMS Media collection.
 * It then creates hero slides and updates the homepage with the image gallery.
 *
 * Run with: NODE_OPTIONS=--no-deprecation npx tsx src/seed/seed-images.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

// Images downloaded from Figma design
const IMAGES = {
  hero: {
    name: 'hero-classic-car-hire',
    alt: 'Classic car hire made easy - couple with red BMW E30',
    localPath: 'src/seed/assets/hero.png',
  },
  projectSpotlight: [
    {
      name: 'project-about-blanc',
      alt: 'About Blanc project - couple with red BMW',
      caption: 'ABOUT BLANC',
      link: '/projects/about-blanc',
      localPath: 'src/seed/assets/about-blanc.png',
    },
    {
      name: 'project-central-cee',
      alt: 'Central Cee project - artist with silver car',
      caption: 'CENTRAL CEE',
      link: '/projects/central-cee',
      localPath: 'src/seed/assets/central-cee.png',
    },
    {
      name: 'project-sacha-keabel',
      alt: 'Sacha Keabel project - model with crashed car',
      caption: 'SACHA KEABEL',
      link: '/projects/sacha-keabel',
      localPath: 'src/seed/assets/sacha-keabel.png',
    },
    {
      name: 'project-tottenham-hotspur',
      alt: 'Tottenham Hotspur FC project - player with Mercedes',
      caption: 'TOTTENHAM HOTSPUR FC',
      link: '/projects/tottenham-hotspur',
      localPath: 'src/seed/assets/tottenham-hotspur.png',
    },
  ],
}

async function downloadImage(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)

    protocol
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirects
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            downloadImage(redirectUrl, destPath).then(resolve).catch(reject)
            return
          }
        }

        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      })
      .on('error', (err) => {
        fs.unlink(destPath, () => {}) // Delete the file on error
        reject(err)
      })
  })
}

async function uploadImageFromPath(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filePath: string,
  altText: string,
): Promise<{ id: string | number } | null> {
  try {
    const absolutePath = path.resolve(process.cwd(), filePath)

    if (!fs.existsSync(absolutePath)) {
      console.log(`  ⚠️  File not found: ${filePath}`)
      return null
    }

    const fileName = path.basename(filePath)
    const fileBuffer = fs.readFileSync(absolutePath)
    const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg'

    // Check if image already exists
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { contains: fileName.split('.')[0] } },
    })

    if (existing.docs.length > 0) {
      console.log(`  ○ Image already exists: ${fileName}`)
      return existing.docs[0]
    }

    const uploaded = await payload.create({
      collection: 'media',
      data: {
        alt: altText,
      },
      file: {
        data: fileBuffer,
        mimetype: mimeType,
        name: fileName,
        size: fileBuffer.length,
      },
    })

    console.log(`  ✓ Uploaded image: ${fileName}`)
    return uploaded
  } catch (error) {
    console.error(`  ❌ Failed to upload ${filePath}:`, error)
    return null
  }
}

async function seedImages() {
  console.log('🖼️  Starting image seed process...')

  const payload = await getPayload({ config })

  try {
    // Ensure assets directory exists
    const assetsDir = path.resolve(process.cwd(), 'src/seed/assets')
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true })
      console.log('📁 Created assets directory: src/seed/assets')
      console.log('')
      console.log('⚠️  Please add the following images to src/seed/assets/:')
      console.log('   - hero.jpg (hero section background)')
      console.log('   - about-blanc.jpg (project spotlight)')
      console.log('   - central-cee.jpg (project spotlight)')
      console.log('   - sacha-keabel.jpg (project spotlight)')
      console.log('   - tottenham-hotspur.jpg (project spotlight)')
      console.log('')
      console.log('Then run this script again.')
      process.exit(0)
    }

    // ============================================
    // 1. UPLOAD HERO IMAGE
    // ============================================
    console.log('\n📸 Uploading hero image...')
    const heroImage = await uploadImageFromPath(payload, IMAGES.hero.localPath, IMAGES.hero.alt)

    // ============================================
    // 2. CREATE HERO SLIDE (if image was uploaded)
    // ============================================
    if (heroImage) {
      console.log('\n🎠 Creating hero slide...')

      const existingSlide = await payload.find({
        collection: 'hero-slides',
        where: { heading: { equals: 'Classic car hire made easy' } },
      })

      if (existingSlide.docs.length === 0) {
        await payload.create({
          collection: 'hero-slides',
          data: {
            heading: 'Classic car hire made easy',
            subheading:
              "Access the UK's largest classic car hire platform with thousands of vehicles available to hire today. Can't see it on the site? We'll find it.",
            ctaText: 'Find a car',
            ctaLink: '/vehicles',
            image: typeof heroImage.id === 'number' ? heroImage.id : Number(heroImage.id),
            status: 'published',
          },
        })
        console.log('  ✓ Created hero slide')
      } else {
        console.log('  ○ Hero slide already exists')
      }
    }

    // ============================================
    // 3. CREATE SPOTLIGHT COLLECTION ITEMS
    // ============================================
    console.log('\n🌟 Creating spotlight collection items...')
    const spotlightIds: (string | number)[] = []

    for (let i = 0; i < IMAGES.projectSpotlight.length; i++) {
      const project = IMAGES.projectSpotlight[i]
      const uploaded = await uploadImageFromPath(payload, project.localPath, project.alt)
      
      if (uploaded) {
        // Check if spotlight item already exists
        const existing = await payload.find({
          collection: 'spotlights',
          where: { caption: { equals: project.caption } },
        })

        if (existing.docs.length > 0) {
          console.log(`  ○ Spotlight already exists: ${project.caption}`)
          spotlightIds.push(existing.docs[0].id)
        } else {
          // Create new spotlight item
          const spotlight = await payload.create({
            collection: 'spotlights',
            data: {
              image: typeof uploaded.id === 'number' ? uploaded.id : Number(uploaded.id),
              caption: project.caption,
              link: project.link,
              status: 'published',
            },
          })
          spotlightIds.push(spotlight.id)
          console.log(`  ✓ Created spotlight: ${project.caption}`)
        }
      }
    }

    // ============================================
    // 4. UPDATE HOMEPAGE WITH PROJECT SPOTLIGHT BLOCK
    // ============================================
    if (spotlightIds.length > 0) {
      console.log('\n📄 Updating homepage with project spotlight block...')

      const homepage = await payload.find({
        collection: 'static-pages',
        where: { slug: { equals: 'home' } },
      })

      if (homepage.docs.length > 0) {
        const page = homepage.docs[0]
        const layout = page.layout as any[]

        // Check if project spotlight block already exists
        const hasSpotlightBlock = layout.some((block) => block.blockType === 'project-spotlight')
        // Also check for old image-gallery block (for migration)
        const hasImageGallery = layout.some((block) => block.blockType === 'image-gallery' && block.title === 'PROJECT SPOTLIGHT')

        if (!hasSpotlightBlock) {
          // Find the position after value-props-section (before call-to-action-block)
          const ctaIndex = layout.findIndex((block) => block.blockType === 'call-to-action-block')
          const insertIndex = ctaIndex > 0 ? ctaIndex : layout.length

          // Create the project spotlight block with references to spotlight collection items
          const spotlightBlock = {
            blockType: 'project-spotlight',
            title: 'PROJECT SPOTLIGHT',
            selectedSpotlights: spotlightIds,
            showArrows: true,
            itemsPerView: 4,
          }

          // Insert the block
          layout.splice(insertIndex, 0, spotlightBlock)

          await payload.update({
            collection: 'static-pages',
            id: page.id,
            data: { layout },
          })

          console.log('  ✓ Added project spotlight block to homepage')
          
          // Optionally remove old image-gallery block if it exists
          if (hasImageGallery) {
            const imageGalleryIndex = layout.findIndex(
              (block) => block.blockType === 'image-gallery' && block.title === 'PROJECT SPOTLIGHT'
            )
            if (imageGalleryIndex >= 0) {
              layout.splice(imageGalleryIndex, 1)
              await payload.update({
                collection: 'static-pages',
                id: page.id,
                data: { layout },
              })
              console.log('  ✓ Removed old image-gallery block (migrated to project-spotlight)')
            }
          }
        } else {
          // Update existing spotlight block with new spotlight references if needed
          const spotlightBlockIndex = layout.findIndex((block) => block.blockType === 'project-spotlight')
          if (spotlightBlockIndex >= 0) {
            const existingBlock = layout[spotlightBlockIndex]
            const existingSpotlightIds = (existingBlock.selectedSpotlights || []).map((id: any) => 
              typeof id === 'object' ? id.id : id
            )
            
            // Check if we need to update spotlights
            const needsUpdate = spotlightIds.length > 0 && 
              (existingSpotlightIds.length === 0 || 
               JSON.stringify(existingSpotlightIds.sort()) !== JSON.stringify(spotlightIds.sort()))
            
            if (needsUpdate) {
              layout[spotlightBlockIndex] = {
                ...existingBlock,
                selectedSpotlights: spotlightIds,
              }
              await payload.update({
                collection: 'static-pages',
                id: page.id,
                data: { layout },
              })
              console.log('  ✓ Updated existing project spotlight block with spotlight references')
            } else {
              console.log('  ○ Project spotlight block already exists with spotlight references')
            }
          }
        }
      }
    }

    // ============================================
    // 5. LINK HERO SLIDES TO HOMEPAGE
    // ============================================
    console.log('\n🔗 Linking hero slides to homepage...')

    const heroSlides = await payload.find({
      collection: 'hero-slides',
      where: { status: { equals: 'published' } },
    })

    if (heroSlides.docs.length > 0) {
      const homepage = await payload.find({
        collection: 'static-pages',
        where: { slug: { equals: 'home' } },
      })

      if (homepage.docs.length > 0) {
        // Hero carousel block has been removed - no longer linking hero slides
        console.log('  ○ Hero carousel block removed - skipping hero slide linking')
      }
    }

    console.log('\n✅ Image seed completed!')
    console.log('\nSummary:')
    console.log(`  - Hero image: ${heroImage ? '✓' : '⚠️ missing'}`)
    console.log(`  - Spotlight items: ${spotlightIds?.length || 0}/4`)
  } catch (error) {
    console.error('❌ Image seed failed:', error)
    throw error
  }

  process.exit(0)
}

seedImages()

