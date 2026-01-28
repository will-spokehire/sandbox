/**
 * Export Staging Script
 *
 * Exports all PayloadCMS data from staging environment to JSON files
 * and downloads media files for migration to production.
 *
 * Run with: pnpm export:staging
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import * as fs from 'fs'
import * as path from 'path'
import {
  downloadFile,
  copyFile,
  ensureExportDirs,
  saveToJson,
  getMediaExportDir,
  IMPORT_ORDER,
  GLOBALS,
} from './migration-utils'

async function exportStaging() {
  console.log('📦 Starting staging export...\n')

  const payload = await getPayload({ config })

  // Ensure export directories exist
  ensureExportDirs()
  console.log('✓ Created export directories\n')

  const mediaDir = getMediaExportDir()
  const summary: Record<string, number> = {}

  // ============================================
  // EXPORT COLLECTIONS
  // ============================================

  for (const slug of IMPORT_ORDER) {
    console.log(`📋 Exporting collection: ${slug}...`)

    try {
      const result = await payload.find({
        collection: slug as any,
        limit: 10000,
        depth: 0, // Get IDs only, not populated relations
        pagination: false,
      })

      const docs = result.docs
      summary[slug] = docs.length

      // Save to JSON
      saveToJson(`${slug}.json`, docs)
      console.log(`  ✓ Exported ${docs.length} documents`)

      // Special handling for media collection - download/copy files
      if (slug === 'media') {
        console.log(`  📥 Downloading media files from Supabase Storage...`)
        let copiedCount = 0
        let failedCount = 0
        let skippedCount = 0

        // Get Supabase storage URL from environment
        const supabaseProjectRef = process.env.SUPABASE_STORAGE_ENDPOINT?.match(/https:\/\/([^.]+)\.storage/)?.[1]
        const bucketName = process.env.SUPABASE_BUCKET_NAME || 'payload-media'

        if (!supabaseProjectRef) {
          console.log(`    ⚠️  SUPABASE_STORAGE_ENDPOINT not configured, trying local files...`)
        }

        for (const doc of docs) {
          const mediaDoc = doc as any
          const filename = mediaDoc.filename

          if (!filename) {
            console.log(`    ⚠️  Skipping media ${mediaDoc.id}: no filename`)
            continue
          }

          const destPath = path.join(mediaDir, filename)

          // Skip if already downloaded
          if (fs.existsSync(destPath)) {
            skippedCount++
            continue
          }

          try {
            // Check if URL is already a full URL
            const isFullUrl = mediaDoc.url && (mediaDoc.url.startsWith('http://') || mediaDoc.url.startsWith('https://'))
            
            if (isFullUrl) {
              // Download from the full URL directly
              await downloadFile(mediaDoc.url, destPath)
              copiedCount++
            } else if (supabaseProjectRef) {
              // Construct Supabase public storage URL
              // Format: https://{project-ref}.supabase.co/storage/v1/object/public/{bucket}/{filename}
              const encodedFilename = encodeURIComponent(filename)
              const supabaseUrl = `https://${supabaseProjectRef}.supabase.co/storage/v1/object/public/${bucketName}/${encodedFilename}`
              
              console.log(`    📥 Downloading: ${filename}`)
              await downloadFile(supabaseUrl, destPath)
              copiedCount++
            } else {
              // Fallback: try local media directory
              const localPath = path.resolve(process.cwd(), 'media', filename)
              if (fs.existsSync(localPath)) {
                copyFile(localPath, destPath)
                copiedCount++
              } else {
                console.log(`    ⚠️  Media file not found: ${filename}`)
                failedCount++
              }
            }
          } catch (error) {
            console.log(`    ❌ Failed to download ${filename}: ${(error as Error).message}`)
            failedCount++
          }
        }

        const skippedMsg = skippedCount > 0 ? `, ${skippedCount} already existed` : ''
        console.log(`  ✓ Downloaded ${copiedCount} files${failedCount > 0 ? `, ${failedCount} failed` : ''}${skippedMsg}`)
      }
    } catch (error) {
      console.error(`  ❌ Failed to export ${slug}:`, error)
      summary[slug] = 0
    }

    console.log('')
  }

  // ============================================
  // EXPORT GLOBALS
  // ============================================

  console.log('🌐 Exporting globals...')

  for (const slug of GLOBALS) {
    try {
      const data = await payload.findGlobal({
        slug: slug as any,
        depth: 0,
      })

      saveToJson(`global-${slug}.json`, data)
      console.log(`  ✓ Exported global: ${slug}`)
    } catch (error) {
      console.error(`  ❌ Failed to export global ${slug}:`, error)
    }
  }

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n' + '='.repeat(50))
  console.log('✅ Export completed!\n')
  console.log('Summary:')

  for (const [collection, count] of Object.entries(summary)) {
    console.log(`  - ${collection}: ${count} documents`)
  }

  console.log(`  - globals: ${GLOBALS.length}`)

  const mediaFiles = fs.readdirSync(mediaDir).filter((f) => !f.startsWith('.'))
  console.log(`  - media files: ${mediaFiles.length}`)

  console.log('\nExport location: src/seed/export/')
  console.log('\nNext steps:')
  console.log('  1. Commit the export folder (or transfer it)')
  console.log('  2. Switch to production environment')
  console.log('  3. Run: pnpm payload migrate')
  console.log('  4. Run: pnpm import:production')

  process.exit(0)
}

exportStaging().catch((error) => {
  console.error('❌ Export failed:', error)
  process.exit(1)
})
