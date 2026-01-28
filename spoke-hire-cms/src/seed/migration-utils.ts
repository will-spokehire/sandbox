/**
 * Migration Utility Functions
 *
 * Shared utilities for staging to production migration scripts.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

// Type for ID mapping: oldId -> newId
export type IdMap = Record<string | number, string | number>
export type IdMaps = Record<string, IdMap>

/**
 * Download a file from URL to destination path
 */
export async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure directory exists
    const dir = path.dirname(destPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)

    protocol
      .get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            file.close()
            fs.unlinkSync(destPath)
            downloadFile(redirectUrl, destPath).then(resolve).catch(reject)
            return
          }
        }

        if (response.statusCode !== 200) {
          file.close()
          fs.unlinkSync(destPath)
          reject(new Error(`Failed to download: ${response.statusCode}`))
          return
        }

        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      })
      .on('error', (err) => {
        file.close()
        fs.unlink(destPath, () => {}) // Delete the file on error
        reject(err)
      })
  })
}

/**
 * Copy a local file to destination
 */
export function copyFile(srcPath: string, destPath: string): void {
  const dir = path.dirname(destPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.copyFileSync(srcPath, destPath)
}

/**
 * Clean document by removing system fields
 */
export function cleanDocument<T extends Record<string, any>>(doc: T): Omit<T, 'id' | 'createdAt' | 'updatedAt'> {
  const { id, createdAt, updatedAt, ...rest } = doc
  return rest as Omit<T, 'id' | 'createdAt' | 'updatedAt'>
}

/**
 * Remap a single ID using the provided map
 */
export function remapId(oldId: string | number | undefined | null, idMap: IdMap): string | number | undefined {
  if (oldId === undefined || oldId === null) return undefined
  const newId = idMap[oldId]
  if (newId === undefined) {
    console.warn(`  ⚠️  Could not remap ID: ${oldId}`)
    return undefined
  }
  return newId
}

/**
 * Remap an array of IDs using the provided map
 */
export function remapIdArray(oldIds: (string | number)[] | undefined | null, idMap: IdMap): (string | number)[] {
  if (!oldIds || !Array.isArray(oldIds)) return []
  return oldIds
    .map((oldId) => {
      // Handle case where relationship is populated (object with id)
      const id = typeof oldId === 'object' && oldId !== null ? (oldId as any).id : oldId
      return remapId(id, idMap)
    })
    .filter((id): id is string | number => id !== undefined)
}

/**
 * Remap layout blocks for static-pages collection
 * Handles all block types with their relationship fields
 */
export function remapLayoutBlocks(layout: any[], idMaps: IdMaps): any[] {
  if (!layout || !Array.isArray(layout)) return []

  return layout.map((block) => {
    const remapped = { ...block }

    switch (block.blockType) {
      case 'stats-bar':
        if (block.selectedStats) {
          remapped.selectedStats = remapIdArray(block.selectedStats, idMaps['stats'] || {})
        }
        break

      case 'value-props-section':
        if (block.selectedProps) {
          remapped.selectedProps = remapIdArray(block.selectedProps, idMaps['value-props'] || {})
        }
        break

      case 'call-to-action-block':
        if (block.selectedCTA) {
          const oldId = typeof block.selectedCTA === 'object' ? block.selectedCTA.id : block.selectedCTA
          remapped.selectedCTA = remapId(oldId, idMaps['cta-blocks'] || {})
        }
        break

      case 'testimonials-section':
        if (block.selectedTestimonials) {
          remapped.selectedTestimonials = remapIdArray(block.selectedTestimonials, idMaps['testimonials'] || {})
        }
        break

      case 'faq-section':
        if (block.selectedFAQs) {
          remapped.selectedFAQs = remapIdArray(block.selectedFAQs, idMaps['faqs'] || {})
        }
        break

      case 'project-spotlight':
        if (block.selectedSpotlights) {
          remapped.selectedSpotlights = remapIdArray(block.selectedSpotlights, idMaps['spotlights'] || {})
        }
        break

      case 'image-carousel':
        if (block.images) {
          remapped.images = remapIdArray(block.images, idMaps['carousel-images'] || {})
        }
        break

      // These block types don't have relationships to remap:
      // - rich-text-content
      // - featured-vehicles (uses external vehicle IDs)
      // - numbered-list
      // - spacer
    }

    return remapped
  })
}

/**
 * Remap SEO fields that may contain media references
 */
export function remapSeoFields(seo: any, mediaIdMap: IdMap): any {
  if (!seo) return seo

  const remapped = { ...seo }

  if (seo.ogImage) {
    const oldId = typeof seo.ogImage === 'object' ? seo.ogImage.id : seo.ogImage
    remapped.ogImage = remapId(oldId, mediaIdMap)
  }

  return remapped
}

/**
 * Get export directory path
 */
export function getExportDir(): string {
  return path.resolve(process.cwd(), 'src/seed/export')
}

/**
 * Get media export directory path
 */
export function getMediaExportDir(): string {
  return path.join(getExportDir(), 'media')
}

/**
 * Ensure export directories exist
 */
export function ensureExportDirs(): void {
  const exportDir = getExportDir()
  const mediaDir = getMediaExportDir()

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true })
  }
}

/**
 * Save data to JSON file in export directory
 */
export function saveToJson(filename: string, data: any): void {
  const filePath = path.join(getExportDir(), filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

/**
 * Load data from JSON file in export directory
 */
export function loadFromJson<T>(filename: string): T {
  const filePath = path.join(getExportDir(), filename)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Export file not found: ${filePath}`)
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

/**
 * Check if export directory exists and has required files
 */
export function validateExportDir(requiredFiles: string[]): boolean {
  const exportDir = getExportDir()

  if (!fs.existsSync(exportDir)) {
    console.error(`❌ Export directory not found: ${exportDir}`)
    return false
  }

  const missingFiles: string[] = []
  for (const file of requiredFiles) {
    const filePath = path.join(exportDir, file)
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file)
    }
  }

  if (missingFiles.length > 0) {
    console.error(`❌ Missing export files: ${missingFiles.join(', ')}`)
    return false
  }

  return true
}

/**
 * Collections in dependency order for import
 */
export const IMPORT_ORDER = [
  'media',
  'icons',
  'stats',
  'value-props',
  'cta-blocks',
  'faqs',
  'testimonials',
  'spotlights',
  'carousel-images',
  'static-pages',
] as const

/**
 * Globals to export/import
 */
export const GLOBALS = ['navigation', 'site-settings'] as const

/**
 * Field mappings for each collection (which fields reference which collections)
 */
export const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  icons: { svg: 'media' },
  stats: { icon: 'icons' },
  'value-props': { icon: 'icons' },
  spotlights: { image: 'media' },
  'carousel-images': { desktopImage: 'media', mobileImage: 'media' },
  // static-pages handled separately via remapLayoutBlocks
}
