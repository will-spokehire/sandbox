# 🔧 Upload Script Fixes Summary

## Issues Fixed

### 1. ❌ Invalid Key Error (Tilde Characters)
**Problem:** Filenames with `~` (tilde) caused "Invalid key" errors  
**Example:** `6ab4ab_74f11dc66a5647598f0edb76c205fcc2~mv2.jpeg`  
**Solution:** Auto-sanitize filenames (replace `~` with `-`)  
**Status:** ✅ Fixed

### 2. ❌ Images Rotated 90 Degrees  
**Problem:** Some images (especially iPhone photos) appeared sideways  
**Example:** `6ab4ab_74f11dc66a5647598f0edb76c205fcc2~mv2.jpeg` (iPhone 12 Pro photo)  
**Solution:** Auto-rotate based on EXIF orientation metadata  
**Status:** ✅ Fixed

---

## What Was Changed

### Filename Sanitization
```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/~/g, '-')           // ~ → -
    .replace(/[<>:"|?*]/g, '')    // Remove invalid chars
    .replace(/\s+/g, '_');        // spaces → _
}
```

### EXIF Rotation Correction
```typescript
// For all images (resized or not)
await sharp(filePath)
  .rotate() // Auto-rotate based on EXIF orientation
  .resize(...)
  .toBuffer();
```

### Format Handling
- ✅ PNG files preserved (with compression)
- ✅ JPEG files re-encoded with rotation
- ✅ Large PNGs converted to JPEG
- ✅ Correct content-type headers

---

## How to Use

Just run the script - all fixes are automatic:

```bash
cd spoke-hire-web
npm run upload-images-to-supabase
```

You'll see:
```
🔧 Sanitized filename: image~mv2.jpg → image-mv2.jpg
```

---

## Technical Details

📄 **Full Documentation:**
- `FILENAME_SANITIZATION_FIX.md` - Tilde character fix
- `EXIF_ROTATION_FIX.md` - Rotation fix details
- `SUPABASE_UPLOAD_GUIDE.md` - Complete usage guide

---

## Re-uploading Previously Failed Images

If you had images that failed before:

1. **Option A:** Script will skip existing files
   - Delete failed uploads from Supabase dashboard first
   - Run script again

2. **Option B:** Fresh upload
   - Clear the bucket
   - Run full migration

---

## What's Next

1. ✅ Run the upload script (fixes applied automatically)
2. ✅ Check results in `data/upload-results.json`
3. ✅ Verify images in Supabase Storage
4. ✅ Confirm images are correctly oriented
5. ⬜ Create database update script (later)

