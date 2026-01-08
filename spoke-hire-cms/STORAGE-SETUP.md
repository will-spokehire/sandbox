# Storage Configuration

## Current Setup: Local File Storage

PayloadCMS is currently configured to use **local file storage** for uploaded media files. Files are stored in the `/media` directory within the CMS project.

### Local Storage Details

- **Location**: `/spoke-hire-cms/media/`
- **Configuration**: Automatic (built into PayloadCMS upload collections)
- **Best for**: Development and testing
- **Pros**: Simple, no external dependencies
- **Cons**: Not suitable for production (files lost on deployment, no CDN)

## Future: Supabase S3 Storage Migration

When you're ready to use Supabase Storage (S3-compatible), follow these steps:

### 1. Enable S3 Protocol in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Storage** → **Settings**
3. Enable **S3 Protocol Access**
4. Generate S3 access keys (Access Key ID and Secret Access Key)

### 2. Install Storage Plugin

```bash
npm install @payloadcms/plugin-cloud-storage @payloadcms/plugin-cloud-storage/s3
```

### 3. Configure Environment Variables

Add to `.env.local`:

```env
# Supabase S3 Storage Configuration
S3_ENDPOINT="https://[PROJECT-REF].supabase.co/storage/v1/s3"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="your-s3-access-key-id"
S3_SECRET_ACCESS_KEY="your-s3-secret-access-key"
S3_BUCKET="payload-uploads"
```

### 4. Update payload.config.ts

Replace the plugins section:

```typescript
import { s3Storage } from '@payloadcms/plugin-cloud-storage/s3'

export default buildConfig({
  // ... other config
  plugins: [
    s3Storage({
      collections: {
        media: {
          adapter: {
            config: {
              endpoint: process.env.S3_ENDPOINT,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
              region: process.env.S3_REGION || 'us-east-1',
              forcePathStyle: true, // Required for Supabase
            },
            bucket: process.env.S3_BUCKET || 'payload-uploads',
          },
          disableLocalStorage: true,
          disablePayloadAccessControl: true,
        },
      },
    }),
  ],
})
```

### 5. Create Supabase Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Create a new bucket: `payload-uploads`
3. Set bucket privacy:
   - **Private**: For admin-only uploads
   - **Public**: For publicly accessible media (recommended)
4. Configure CORS if needed

### 6. Test Upload

1. Restart PayloadCMS dev server
2. Navigate to `/admin/collections/media`
3. Upload a test file
4. Verify it appears in Supabase Storage bucket

## References

- [PayloadCMS Storage Adapters](https://payloadcms.com/docs/upload/storage-adapters)
- [Supabase S3 Compatibility](https://supabase.com/docs/guides/storage/s3/compatibility)
- [@payloadcms/plugin-cloud-storage Documentation](https://payloadcms.com/docs/upload/storage-adapters)

## Migration Strategy

When migrating from local to S3 storage:

1. **Keep existing local files**: Don't delete them until S3 is working
2. **Test with new uploads**: Upload new files to S3 first
3. **Migrate existing files**: Use a script to upload local files to S3
4. **Update database**: Update media URLs in the database
5. **Clean up**: Remove local files once migration is verified

## Notes

- Local storage is fine for development
- Use S3 for production to ensure files persist across deployments
- Supabase Storage provides CDN capabilities for better performance
- Consider setting up image optimization and resizing in Supabase








