# 📤 Supabase Image Upload Migration Guide

## Overview

This guide explains how to upload vehicle images from local storage to Supabase Storage with automatic resizing for large files.

## 🎯 What the Script Does

1. ✅ Fetches 50 media records from the database (configurable)
2. ✅ Finds images in `/public/images-by-coverage/` folders
3. ✅ Sanitizes filenames (replaces `~` and other invalid characters)
4. ✅ **Auto-rotates images based on EXIF orientation** (fixes rotated phone photos)
5. ✅ Checks file size and resizes if > 3MB to HD resolution (1920px width)
6. ✅ Uploads to Supabase Storage at `vehicles/{vehicleId}/{sanitized-filename}`
7. ✅ **Updates database with Supabase URL** in `publishedUrl` field
8. ✅ Generates a JSON report with results

## 📋 Prerequisites

### 1. Supabase Project Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Create a Storage Bucket:**
   - Go to Storage in your Supabase dashboard
   - Click "New bucket"
   - Name it: `vehicle-images`
   - Set it to **Public** (or configure RLS policies as needed)

### 2. Get Your Supabase Credentials

From your Supabase project dashboard:
- Go to **Settings** → **API**
- Copy:
  - `Project URL` (e.g., `https://xxxxx.supabase.co`)
  - `anon public` key (or `service_role` key for admin access)

### 3. Configure Environment Variables

Create or update `.env` file in `/spoke-hire-web/`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Optional: For admin operations (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Existing Database URL
DATABASE_URL="your-database-url"
```

## 🚀 How to Run

### Step 1: Test with 50 Images (Default)

```bash
cd spoke-hire-web
npm run upload-images-to-supabase
```

The script will:
- Process **first 50 images** from the database
- Show progress for each image
- Display statistics at the end
- Save results to `data/upload-results.json`

### Step 2: Review Results

Check the generated file: `spoke-hire-web/data/upload-results.json`

```json
{
  "timestamp": "2025-10-01T...",
  "stats": {
    "totalRecords": 50,
    "filesFound": 48,
    "filesNotFound": 2,
    "resized": 12,
    "uploadedSuccessfully": 48,
    "uploadFailed": 2,
    "totalSizeSavedMB": 35.42
  },
  "results": [
    {
      "mediaId": "abc123",
      "filename": "image.jpg",
      "supabaseUrl": "https://...storage.supabase.co/...",
      "storagePath": "vehicles/xyz/image.jpg",
      "success": true
    }
  ]
}
```

### Step 3: Verify in Supabase Dashboard

1. Go to **Storage** → `vehicle-images` bucket
2. Navigate to `vehicles/{vehicleId}/` folders
3. Verify images are uploaded correctly

## ⚙️ Configuration

Edit `/spoke-hire-web/scripts/upload-images-to-supabase.ts`:

```typescript
const CONFIG = {
  LIMIT: 50,                    // Change to process more/all images
  MAX_SIZE_MB: 3,              // Resize threshold
  RESIZE_WIDTH: 1920,          // HD width
  BUCKET_NAME: 'vehicle-images', // Your bucket name
  OVERWRITE_EXISTING: true,    // true = re-upload READY; false = skip READY
};
```

### Smart Image Filtering

The script **automatically skips images already marked as READY** to save time:

**Skip Already Uploaded (Default for Production):**
```typescript
OVERWRITE_EXISTING: false,  // Only uploads non-READY images
LIMIT: undefined,           // Process all that need uploading
```

**Re-upload Everything (Fix Rotations):**
```typescript
OVERWRITE_EXISTING: true,   // Re-uploads ALL including READY
LIMIT: 50,                  // Test with 50 first
```

See `SKIP_READY_IMAGES.md` for detailed explanation.

## 📊 Script Output

### Console Output

```
🚀 Starting Supabase Image Upload Migration

📋 Configuration:
  - Limit: 50 images
  - Max size before resize: 3MB
  - Resize width: 1920px
  - Bucket: vehicle-images

[1/50] Processing: image1~mv2.jpg
  📁 Found in: high-coverage
  📊 Original size: 4.52MB
  🔧 Sanitized filename: image1~mv2.jpg → image1-mv2.jpg
  🔄 Resizing image (4.52MB > 3MB)...
  ✅ Resized to 2.31MB (saved 2.21MB)
  ☁️  Uploading to Supabase...
  ✅ Uploaded successfully: https://...
  💾 Database updated with published URL

[2/50] Processing: image2.jpg
  📁 Found in: medium-coverage
  📊 Original size: 1.85MB
  ☁️  Uploading to Supabase...
  ✅ Uploaded successfully: https://...
  💾 Database updated with published URL

...

📊 UPLOAD SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Statistics:
  Total records processed: 50
  Files found: 48
  Files not found: 2
  Images resized: 12
  Uploaded successfully: 48
  Upload failed: 2
  Database updated: 48
  Total size saved: 35.42MB

✅ Migration completed!

💡 Next steps:
  1. Review the results in upload-results.json
  2. Check uploaded images in Supabase Storage dashboard
  3. Update database URLs (separate script to be created)
```

## 📁 File Locations

- **Script:** `/spoke-hire-web/scripts/upload-images-to-supabase.ts`
- **Supabase Client:** `/spoke-hire-web/src/lib/supabase.ts`
- **Source Images:** `/spoke-hire-web/public/images-by-coverage/`
  - `high-coverage/` - 1,172 images
  - `medium-coverage/` - 1,568 images
  - `low-coverage/` - 217 images
  - `to-review/` - 703 images
- **Results:** `/spoke-hire-web/data/upload-results.json`

## 🔧 Troubleshooting

### Error: Missing Supabase environment variables

**Solution:** Make sure `.env` file has:
```env
NEXT_PUBLIC_SUPABASE_URL="your-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"
```

### Error: Bucket does not exist

**Solution:** Create the bucket in Supabase dashboard:
1. Go to Storage
2. Create bucket named `vehicle-images`
3. Set to Public or configure RLS

### Error: File not found in coverage folders

**Solution:** The image exists in database but not in local folders. Options:
- Download the image first using `npm run download-images`
- Skip and continue with other images

### Error: 409 - File already exists

**Solution:** This is handled automatically. The script will:
- Get the existing file's public URL
- Mark as successful
- Continue to next image

### Error: Invalid key (with ~ or special characters)

**Solution:** Fixed! The script now automatically sanitizes filenames:
- Replaces `~` with `-` (e.g., `image~mv2.jpg` → `image-mv2.jpg`)
- Removes invalid characters: `<>:"|?*`
- Replaces spaces with `_`
- This happens automatically during upload

### Problem: Images appear rotated 90 degrees

**Solution:** Fixed! The script now auto-rotates images based on EXIF orientation:
- Common with iPhone/Android photos taken in portrait mode
- EXIF metadata tells the correct orientation
- Sharp automatically rotates during processing
- Uploaded images are correctly oriented
- See `EXIF_ROTATION_FIX.md` for technical details

## 💾 Database Integration

The script now **automatically updates the database** after successful uploads!

### What Gets Updated

- ✅ `publishedUrl` field is set to Supabase Storage URL
- ✅ `fileSize` is updated with actual uploaded file size
- ✅ `originalUrl` remains unchanged (keeps historical reference)

### New Database Field

```prisma
model Media {
  originalUrl   String     // Original source (Wix, local, etc.)
  publishedUrl  String?    // Supabase Storage URL ← New!
  filename      String
  fileSize      BigInt?    // Updated with upload size
}
```

### Benefits

- ✅ Track which images are uploaded to Supabase
- ✅ Query uploaded vs non-uploaded images
- ✅ Serve images from Supabase URL
- ✅ Keep original URL for reference

### Query Examples

```typescript
// Get all uploaded images
const uploaded = await prisma.media.findMany({
  where: { publishedUrl: { not: null } }
});

// Use in frontend
const imageUrl = media.publishedUrl || media.originalUrl;
```

See `DATABASE_INTEGRATION.md` for complete documentation.

## 📈 Performance Notes

- **Batch Size:** Script processes images sequentially (can be parallelized for speed)
- **Network:** Upload speed depends on your internet connection
- **Resize Time:** ~100-500ms per large image
- **Estimated Time:**
  - 50 images: ~2-5 minutes
  - 1000 images: ~30-60 minutes
  - 3660 images (all): ~2-3 hours

## 🎯 Next Steps

1. ✅ Test with 50 images
2. ✅ Verify uploads in Supabase dashboard
3. ✅ Review `upload-results.json`
4. ⬜ Increase limit or remove for full migration
5. ⬜ Create database update script using results JSON
6. ⬜ Update Media table with new Supabase URLs

## 📞 Support

If you encounter issues:
1. Check the error in console output
2. Review `upload-results.json` errors section
3. Verify Supabase bucket permissions
4. Ensure environment variables are set correctly

