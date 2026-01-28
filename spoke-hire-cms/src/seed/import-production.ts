/**
 * Import Production Script
 *
 * Imports exported PayloadCMS data into production environment.
 * Handles ID remapping for relationships between collections.
 *
 * Run with: pnpm import:production
 * Run with clean: pnpm import:production --clean
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import * as fs from 'fs'
import * as path from 'path'
import {
  cleanDocument,
  loadFromJson,
  validateExportDir,
  getMediaExportDir,
  remapId,
  remapIdArray,
  remapLayoutBlocks,
  remapSeoFields,
  IMPORT_ORDER,
  GLOBALS,
  FIELD_MAPPINGS,
  type IdMap,
  type IdMaps,
} from './migration-utils'

// Check for --clean flag
const shouldClean = process.argv.includes('--clean')

async function importProduction() {
  console.log('🚀 Starting production import...\n')
  
  if (shouldClean) {
    console.log('🧹 --clean flag detected. Will delete existing data first.\n')
  }

  // Validate export directory exists with required files
  const requiredFiles = [
    ...IMPORT_ORDER.map((c) => `${c}.json`),
    ...GLOBALS.map((g) => `global-${g}.json`),
  ]

  if (!validateExportDir(requiredFiles)) {
    console.error('\nPlease run export:staging first to generate export files.')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const mediaDir = getMediaExportDir()

  // ============================================
  // CLEAN EXISTING DATA (if --clean flag)
  // ============================================

  if (shouldClean) {
    await cleanExistingData(payload)
  }

  // ID mappings: collection -> { oldId -> newId }
  const idMaps: IdMaps = {}

  const summary: Record<string, { success: number; failed: number; skipped: number }> = {}

  // ============================================
  // IMPORT COLLECTIONS IN DEPENDENCY ORDER
  // ============================================

  for (const slug of IMPORT_ORDER) {
    console.log(`📋 Importing collection: ${slug}...`)

    idMaps[slug] = {}
    summary[slug] = { success: 0, failed: 0, skipped: 0 }

    try {
      const docs = loadFromJson<any[]>(`${slug}.json`)

      for (const doc of docs) {
        const oldId = doc.id
        const cleaned = cleanDocument(doc)

        try {
          // Special handling for media - upload files
          if (slug === 'media') {
            const created = await importMediaDocument(payload, cleaned, mediaDir)
            if (created) {
              idMaps[slug][oldId] = created.id
              summary[slug].success++
            } else {
              summary[slug].failed++
            }
            continue
          }

          // Check if record already exists by unique field
          const existingRecord = await findExistingRecord(payload, slug, doc)
          if (existingRecord) {
            console.log(`    ○ Already exists: ${getRecordIdentifier(doc, slug)}`)
            idMaps[slug][oldId] = existingRecord.id
            summary[slug].skipped++
            continue
          }

          // Remap relationship fields based on collection
          const fieldMappings = FIELD_MAPPINGS[slug]
          if (fieldMappings) {
            for (const [field, refCollection] of Object.entries(fieldMappings)) {
              if (cleaned[field]) {
                const oldRefId = typeof cleaned[field] === 'object' ? cleaned[field].id : cleaned[field]
                const newRefId = remapId(oldRefId, idMaps[refCollection] || {})
                cleaned[field] = newRefId
              }
            }
          }

          // Special handling for static-pages - remap layout blocks and SEO
          if (slug === 'static-pages') {
            if (cleaned.layout) {
              cleaned.layout = remapLayoutBlocks(cleaned.layout, idMaps)
            }
            if (cleaned.seo) {
              cleaned.seo = remapSeoFields(cleaned.seo, idMaps['media'] || {})
            }
          }

          // Create the document
          const created = await payload.create({
            collection: slug as any,
            data: cleaned,
          })

          idMaps[slug][oldId] = created.id
          summary[slug].success++
        } catch (error) {
          console.log(`    ❌ Failed to import ${slug} ID ${oldId}: ${(error as Error).message}`)
          summary[slug].failed++
        }
      }

      const skippedMsg = summary[slug].skipped > 0 ? `, ${summary[slug].skipped} skipped` : ''
      console.log(
        `  ✓ Imported ${summary[slug].success}/${docs.length}${summary[slug].failed > 0 ? ` (${summary[slug].failed} failed)` : ''}${skippedMsg}`
      )
    } catch (error) {
      console.error(`  ❌ Failed to load ${slug}.json:`, error)
    }

    console.log('')
  }

  // ============================================
  // IMPORT GLOBALS
  // ============================================

  console.log('🌐 Importing globals...')

  for (const slug of GLOBALS) {
    try {
      const data = loadFromJson<any>(`global-${slug}.json`)
      const cleaned = cleanDocument(data)

      // Special handling for site-settings - remap media references
      if (slug === 'site-settings') {
        if (cleaned.logo) {
          const oldId = typeof cleaned.logo === 'object' ? cleaned.logo.id : cleaned.logo
          cleaned.logo = remapId(oldId, idMaps['media'] || {})
        }
        if (cleaned.favicon) {
          const oldId = typeof cleaned.favicon === 'object' ? cleaned.favicon.id : cleaned.favicon
          cleaned.favicon = remapId(oldId, idMaps['media'] || {})
        }
        if (cleaned.seoDefaults?.defaultOgImage) {
          const oldId =
            typeof cleaned.seoDefaults.defaultOgImage === 'object'
              ? cleaned.seoDefaults.defaultOgImage.id
              : cleaned.seoDefaults.defaultOgImage
          cleaned.seoDefaults.defaultOgImage = remapId(oldId, idMaps['media'] || {})
        }
      }

      await payload.updateGlobal({
        slug: slug as any,
        data: cleaned,
      })

      console.log(`  ✓ Imported global: ${slug}`)
    } catch (error) {
      console.error(`  ❌ Failed to import global ${slug}:`, (error as Error).message)
    }
  }

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n' + '='.repeat(50))
  console.log('✅ Import completed!\n')
  console.log('Summary:')

  let totalSuccess = 0
  let totalFailed = 0

  for (const [collection, stats] of Object.entries(summary)) {
    const total = stats.success + stats.failed + stats.skipped
    const skippedMsg = stats.skipped > 0 ? `, ${stats.skipped} skipped` : ''
    console.log(`  - ${collection}: ${stats.success}/${total}${stats.failed > 0 ? ` (${stats.failed} failed)` : ''}${skippedMsg}`)
    totalSuccess += stats.success
    totalFailed += stats.failed
  }

  console.log('')
  console.log(`Total: ${totalSuccess} imported, ${totalFailed} failed`)

  if (totalFailed > 0) {
    console.log('\n⚠️  Some imports failed. Check the logs above for details.')
  }

  console.log('\nNext steps:')
  console.log('  1. Verify data in the admin panel')
  console.log('  2. Check that images display correctly')
  console.log('  3. Test the frontend website')

  process.exit(0)
}

/**
 * Delete all existing data from collections (excluding users)
 */
async function cleanExistingData(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  console.log('🗑️  Cleaning existing data...\n')

  // Delete in reverse dependency order to avoid FK constraint issues
  const deleteOrder = [...IMPORT_ORDER].reverse()

  for (const slug of deleteOrder) {
    try {
      // Find all documents in the collection
      const result = await payload.find({
        collection: slug as any,
        limit: 10000,
        pagination: false,
      })

      if (result.docs.length === 0) {
        console.log(`  ○ ${slug}: already empty`)
        continue
      }

      // Delete each document
      let deleted = 0
      for (const doc of result.docs) {
        try {
          await payload.delete({
            collection: slug as any,
            id: doc.id,
          })
          deleted++
        } catch (error) {
          // Ignore deletion errors (might be FK constraints)
        }
      }

      console.log(`  ✓ ${slug}: deleted ${deleted}/${result.docs.length}`)
    } catch (error) {
      console.log(`  ⚠️  ${slug}: failed to clean - ${(error as Error).message}`)
    }
  }

  console.log('\n✅ Cleanup complete!\n')
}

/**
 * Find an existing record by unique identifier field
 */
async function findExistingRecord(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: string,
  doc: any
): Promise<{ id: string | number } | null> {
  try {
    // Define unique fields for each collection
    const uniqueFieldMap: Record<string, string> = {
      'cta-blocks': 'heading',
      'static-pages': 'slug',
      'faqs': 'question',
      'testimonials': 'name',
      'spotlights': 'title',
      'stats': 'value',
      'value-props': 'title',
      'icons': 'name',
      'carousel-images': 'name',
    }

    const uniqueField = uniqueFieldMap[collection]
    if (!uniqueField || !doc[uniqueField]) return null

    const existing = await payload.find({
      collection: collection as any,
      where: { [uniqueField]: { equals: doc[uniqueField] } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return existing.docs[0]
    }

    return null
  } catch {
    return null
  }
}

/**
 * Get a human-readable identifier for a record
 */
function getRecordIdentifier(doc: any, collection: string): string {
  const fieldPriority = ['heading', 'title', 'name', 'slug', 'question', 'value']
  for (const field of fieldPriority) {
    if (doc[field]) {
      const value = String(doc[field])
      return value.length > 50 ? value.substring(0, 50) + '...' : value
    }
  }
  return `ID ${doc.id}`
}

/**
 * Import a media document by uploading the file
 */
async function importMediaDocument(
  payload: Awaited<ReturnType<typeof getPayload>>,
  doc: any,
  mediaDir: string
): Promise<{ id: string | number } | null> {
  const filename = doc.filename

  if (!filename) {
    console.log(`    ⚠️  Skipping media: no filename`)
    return null
  }

  const filePath = path.join(mediaDir, filename)

  if (!fs.existsSync(filePath)) {
    console.log(`    ⚠️  Media file not found: ${filename}`)
    return null
  }

  try {
    // Check if media with same filename already exists
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { contains: filename.split('.')[0] } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`    ○ Media already exists: ${filename}`)
      return existing.docs[0]
    }

    const fileBuffer = fs.readFileSync(filePath)
    const mimeType = getMimeType(filename)

    const created = await payload.create({
      collection: 'media',
      data: {
        alt: doc.alt || filename,
      },
      file: {
        data: fileBuffer,
        mimetype: mimeType,
        name: filename,
        size: fileBuffer.length,
      },
    })

    return created
  } catch (error) {
    console.log(`    ❌ Failed to upload ${filename}: ${(error as Error).message}`)
    return null
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

importProduction().catch((error) => {
  console.error('❌ Import failed:', error)
  process.exit(1)
})
