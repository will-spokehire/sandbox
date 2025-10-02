# 🔄 How to Fix Rotated Images

## Problem

Images that were uploaded **before** the EXIF rotation fix are still rotated in Supabase Storage.

**Example:** `6ab4ab_74f11dc66a5647598f0edb76c205fcc2-mv2.jpeg` is rotated 90°

## Why This Happens

1. **First upload (before fix):** Images were uploaded without EXIF rotation correction
2. **Script was updated:** Added `.rotate()` to fix EXIF orientation
3. **Existing images:** Still rotated because they weren't re-processed

## Solution: Re-upload with Overwrite

The script now has `OVERWRITE_EXISTING: true` which will:
- ✅ Re-process ALL images with EXIF rotation
- ✅ Overwrite existing files in Supabase
- ✅ Fix any rotated images automatically

### Quick Fix - Run the Script Again

```bash
cd spoke-hire-web
npm run upload-images-to-supabase
```

The script will:
1. Process each image with `.rotate()` (applies EXIF rotation)
2. **Overwrite** existing files in Supabase (because `OVERWRITE_EXISTING: true`)
3. Upload correctly oriented versions

### What You'll See

```
🚀 Starting Supabase Image Upload Migration

📋 Configuration:
  - Limit: 50 images
  - Max size before resize: 3MB
  - Resize width: 1920px
  - Bucket: vehicle-images
  - Overwrite existing: YES (will fix rotated images)  ← Important!
  
[1/50] Processing: 6ab4ab_74f11dc66a5647598f0edb76c205fcc2~mv2.jpeg
  📁 Found in: high-coverage
  📊 Original size: 2.85MB
  🔧 Sanitized filename: 6ab4ab_74f11dc66a5647598f0edb76c205fcc2~mv2.jpeg → 6ab4ab_74f11dc66a5647598f0edb76c205fcc2-mv2.jpeg
  ☁️  Uploading to Supabase...
  ✅ Uploaded successfully (overwrote existing)  ← Fixed rotation!
```

## Configuration Options

Edit `/spoke-hire-web/scripts/upload-images-to-supabase.ts`:

```typescript
const CONFIG = {
  LIMIT: 50,                    // Process 50 images at a time
  OVERWRITE_EXISTING: true,     // Set to true to fix rotated images
  // ...
};
```

### Option 1: Fix All Images (Recommended)
```typescript
OVERWRITE_EXISTING: true,   // Will re-upload and fix rotations
LIMIT: undefined,           // Process ALL images
```

### Option 2: Test with 50 First
```typescript
OVERWRITE_EXISTING: true,   // Will re-upload and fix rotations
LIMIT: 50,                  // Test with first 50
```

### Option 3: Skip Existing (Default behavior before)
```typescript
OVERWRITE_EXISTING: false,  // Skip files that already exist
LIMIT: 50,
```

## How It Works

### Before (OVERWRITE_EXISTING: false)
```
Image exists in Supabase? → Skip it (even if rotated)
```

### Now (OVERWRITE_EXISTING: true)
```
Process image → Apply EXIF rotation → Upload → Overwrite existing → Fixed!
```

## Checking Results

### In Supabase Dashboard
1. Go to Storage → `vehicle-images`
2. Navigate to `vehicles/{vehicleId}/`
3. View image: Should be correctly oriented now

### In Results File
Check `data/upload-results.json`:
```json
{
  "results": [
    {
      "filename": "6ab4ab_74f11dc66a5647598f0edb76c205fcc2~mv2.jpeg",
      "sanitizedFilename": "6ab4ab_74f11dc66a5647598f0edb76c205fcc2-mv2.jpeg",
      "supabaseUrl": "https://...storage.supabase.co/.../6ab4ab_74f11dc66a5647598f0edb76c205fcc2-mv2.jpeg",
      "success": true
    }
  ]
}
```

## Important Notes

### 1. Overwrite is Safe
- Old rotated image is replaced
- Same filename and path
- URLs remain the same
- No database changes needed

### 2. Processing Time
- Each image is re-processed (with rotation)
- Slightly slower than skipping
- But fixes all rotated images

### 3. Bandwidth Usage
- Re-uploads all images
- Uses upload bandwidth
- Consider Supabase limits

## Batch Processing Strategy

### For Large Numbers of Images

1. **Test batch (50 images):**
   ```typescript
   LIMIT: 50,
   OVERWRITE_EXISTING: true,
   ```

2. **Verify fixes in Supabase**

3. **Process in batches:**
   ```typescript
   LIMIT: 500,  // Increase batch size
   OVERWRITE_EXISTING: true,
   ```

4. **Run multiple times** until all images are fixed

5. **Full migration:**
   ```typescript
   LIMIT: undefined,  // All images
   OVERWRITE_EXISTING: true,
   ```

## After Re-uploading

1. ✅ All images correctly oriented
2. ✅ EXIF orientation applied
3. ✅ Same URLs (no database changes)
4. ✅ Ready to use

## Disable Overwrite Later

After fixing all rotated images:

```typescript
const CONFIG = {
  OVERWRITE_EXISTING: false,  // Back to default
  // ...
};
```

This prevents accidentally re-uploading in the future.

## Troubleshooting

### Image still rotated after re-upload?

1. **Check the local file:**
   ```bash
   file "public/images-by-coverage/*/your-image.jpeg" | grep orientation
   ```

2. **Verify OVERWRITE_EXISTING is true**

3. **Check upload was successful** in results JSON

4. **Clear browser cache** - Supabase might be caching old image

### Upload failed?

Check error in `upload-results.json`:
- Network issues?
- Supabase permissions?
- File size limits?

