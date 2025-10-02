# 💾 Database Integration - Published URL Tracking

## Overview

The upload script now **automatically updates the database** with Supabase Storage URLs after successful uploads.

## New Database Field

### Media Model - `publishedUrl`

Added to the `Media` table in Prisma schema:

```prisma
model Media {
  // ... existing fields
  
  // File Information
  originalUrl       String     // Original file URL/path (Wix, local, etc.)
  publishedUrl      String?    // Published URL (Supabase Storage URL)
  filename          String     // Original filename
  
  // ... other fields
}
```

### Field Purpose

- **`originalUrl`**: Keeps the original source (Wix URL, local path, etc.)
- **`publishedUrl`**: Stores the Supabase Storage public URL
- **Benefits**:
  - ✅ Track which images have been uploaded to Supabase
  - ✅ Know where to serve images from (Supabase URL)
  - ✅ Keep historical reference to original source
  - ✅ Easy to query uploaded vs non-uploaded images

## How It Works

### During Upload

1. **Image is processed** (rotation, resize)
2. **Uploaded to Supabase** Storage
3. **Database is updated** automatically:
   ```typescript
   await prisma.media.update({
     where: { id: mediaId },
     data: {
       publishedUrl: supabaseUrl,  // New Supabase URL
       fileSize: uploadedSize,      // Actual uploaded file size
       status: 'READY',             // Mark as ready for use
     },
   });
   ```

### Smart Filtering

**The script skips images already marked as `READY`** (when `OVERWRITE_EXISTING: false`):
- ✅ Only processes `PROCESSING` and `UPLOADING` images
- ✅ Saves time and bandwidth
- ✅ Perfect for incremental uploads
- ✅ Can re-upload all by setting `OVERWRITE_EXISTING: true`

### Console Output

You'll see this for each successful upload:

```
[1/50] Processing: image.jpg
  📁 Found in: high-coverage
  📊 Original size: 2.85MB
  ☁️  Uploading to Supabase...
  ✅ Uploaded successfully: https://xxx.supabase.co/.../image-mv2.jpeg
  💾 Database updated with published URL  ← New!
```

## Database Schema Update

### Migration Applied

```sql
-- Add publishedUrl column to Media table
ALTER TABLE "Media" ADD COLUMN "publishedUrl" TEXT;
```

### Applied Using

```bash
npx prisma db push
```

## Usage Examples

### Query Images by Upload Status

```typescript
// Get all images uploaded to Supabase
const uploadedImages = await prisma.media.findMany({
  where: {
    publishedUrl: { not: null }
  }
});

// Get images NOT yet uploaded
const notUploadedImages = await prisma.media.findMany({
  where: {
    publishedUrl: null
  }
});

// Count uploaded images
const uploadedCount = await prisma.media.count({
  where: {
    publishedUrl: { not: null }
  }
});
```

### Get Vehicle with Supabase URLs

```typescript
const vehicle = await prisma.vehicle.findUnique({
  where: { id: vehicleId },
  include: {
    media: {
      select: {
        id: true,
        filename: true,
        originalUrl: true,
        publishedUrl: true,  // Supabase URL
        isPrimary: true,
        order: true,
      },
      orderBy: { order: 'asc' }
    }
  }
});

// Use published URL if available, fallback to original
const primaryImage = vehicle.media.find(m => m.isPrimary);
const imageUrl = primaryImage?.publishedUrl || primaryImage?.originalUrl;
```

### Update Vehicle Display Logic

```typescript
function getImageUrl(media: Media): string {
  // Prefer published URL (Supabase) over original
  return media.publishedUrl || media.originalUrl;
}
```

## Statistics Tracking

The upload script now tracks database updates:

```
📈 Statistics:
  Total records processed: 50
  Files found: 48
  Files not found: 2
  Images resized: 12
  Uploaded successfully: 48
  Upload failed: 2
  Database updated: 48        ← New statistic!
  Total size saved: 35.42MB
```

## Results JSON

The `upload-results.json` now includes database update status:

```json
{
  "results": [
    {
      "mediaId": "abc123",
      "filename": "image~mv2.jpeg",
      "sanitizedFilename": "image-mv2.jpeg",
      "supabaseUrl": "https://xxx.supabase.co/.../image-mv2.jpeg",
      "success": true,
      "databaseUpdated": true  ← New field!
    }
  ],
  "stats": {
    "uploadedSuccessfully": 48,
    "databaseUpdated": 48     ← New stat!
  }
}
```

## Error Handling

If database update fails (but upload succeeds):

```
✅ Uploaded successfully: https://...
⚠️  Failed to update database: [error message]
```

The upload is still marked as successful, but `databaseUpdated` will be `false`.

## Migration Status

### What Happens on Re-upload

When `OVERWRITE_EXISTING: true`:
- ✅ Image is re-uploaded (with rotation fix)
- ✅ Database `publishedUrl` is updated again
- ✅ `fileSize` is updated with new size
- ✅ Old URL is replaced with new one (same URL if filename unchanged)

### Checking Upload Status

```bash
# Run this in Prisma Studio or psql
SELECT 
  COUNT(*) FILTER (WHERE "publishedUrl" IS NOT NULL) as uploaded,
  COUNT(*) FILTER (WHERE "publishedUrl" IS NULL) as not_uploaded
FROM "Media"
WHERE "type" = 'IMAGE';
```

## Next Steps

### 1. Update Frontend to Use Supabase URLs

```typescript
// Before
<img src={media.originalUrl} />

// After
<img src={media.publishedUrl || media.originalUrl} />
```

### 2. Add Index for Performance

If querying by `publishedUrl` frequently:

```prisma
model Media {
  // ... fields
  
  @@index([publishedUrl])
}
```

### 3. Migration Script for Existing URLs

If you need to bulk update URLs later:

```typescript
// Example: Update all records from results.json
const results = JSON.parse(fs.readFileSync('data/upload-results.json'));

for (const result of results.results) {
  if (result.success && result.databaseUpdated) {
    await prisma.media.update({
      where: { id: result.mediaId },
      data: { publishedUrl: result.supabaseUrl }
    });
  }
}
```

## Benefits

### ✅ Automatic Tracking
- No manual database updates needed
- Upload and DB update in one operation

### ✅ Auditability
- Know exactly which images are in Supabase
- Query by upload status
- Track upload progress

### ✅ Flexibility
- Keep original URLs for reference
- Can re-upload and update URLs easily
- Fallback to original if Supabase unavailable

### ✅ Performance
- Direct database queries for uploaded images
- No need to check Supabase Storage API
- Fast filtering and counting

## Troubleshooting

### Database update failed but upload succeeded

**Cause**: Database connection issue or validation error

**Solution**: 
1. Check `upload-results.json` for successful uploads
2. Manually update database using media IDs and URLs from results
3. Or re-run upload (with `OVERWRITE_EXISTING: true`)

### publishedUrl is null after upload

**Check**:
1. Was upload actually successful? (check console output)
2. Any errors in `upload-results.json`?
3. Database connection working? (test with Prisma Studio)

### Need to clear publishedUrl for re-upload

```typescript
// Reset all published URLs
await prisma.media.updateMany({
  where: { type: 'IMAGE' },
  data: { publishedUrl: null }
});
```

## Summary

The upload script now provides **complete end-to-end automation**:

1. ✅ Find images in local folders
2. ✅ Apply EXIF rotation correction
3. ✅ Resize if needed
4. ✅ Upload to Supabase Storage
5. ✅ **Update database with Supabase URL** ← New!
6. ✅ Track all statistics

No manual database updates needed! 🎉

