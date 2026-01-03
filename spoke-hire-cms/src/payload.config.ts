import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Icons } from './collections/Icons'
import { HeroSlides } from './collections/HeroSlides'
import { Stats } from './collections/Stats'
import { ValueProps } from './collections/ValueProps'
import { CTABlocks } from './collections/CTABlocks'
import { Testimonials } from './collections/Testimonials'
import { FAQs } from './collections/FAQs'
import { CarouselImages } from './collections/CarouselImages'
import { Spotlights } from './collections/Spotlights'
import { StaticPages } from './collections/StaticPages'
import { StaticBlocks } from './collections/StaticBlocks'
import { Navigation } from './globals/Navigation'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Icons,
    HeroSlides,
    Stats,
    ValueProps,
    CTABlocks,
    Testimonials,
    FAQs,
    CarouselImages,
    Spotlights,
    StaticPages,
    StaticBlocks,
  ],
  globals: [
    Navigation,
    SiteSettings,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // Database configuration - uses separate PostgreSQL schema in same database
  // PayloadCMS uses configurable schema (default: 'payload'), completely isolated from spoke-hire-web tables (in 'public' schema)
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || process.env.DATABASE_URI || '',
    },
    schemaName: process.env.PAYLOAD_DB_SCHEMA || 'payload', // Use separate schema for PayloadCMS tables
  }),
  sharp,
  plugins: [
    // Conditional storage: S3 for production, local filesystem for development
    // In development (localhost), PayloadCMS uses local filesystem storage by default
    // In production, use Supabase Storage S3
    //
    // Note: There's a known issue with UploadHandlersProvider timing in PayloadCMS
    // See: https://github.com/payloadcms/payload/issues/13353
    // The Suspense boundary in admin layout helps mitigate this issue
    ...(isProduction
      ? [
          s3Storage({
            collections: {
              media: true, // Apply S3 storage to media collection
            },
            bucket: process.env.SUPABASE_BUCKET_NAME || 'payload-media',
            config: {
              endpoint: process.env.SUPABASE_STORAGE_ENDPOINT,
              region: process.env.SUPABASE_STORAGE_REGION || 'us-east-1',
              credentials: {
                accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY || '',
              },
              forcePathStyle: true, // Required for Supabase S3 compatibility
            },
          }),
        ]
      : []),
  ],
})
