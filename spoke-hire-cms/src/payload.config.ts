import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

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
  collections: [Users, Media],
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
            },
          }),
        ]
      : []),
  ],
})
