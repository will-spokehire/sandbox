# 🔧 Filename Sanitization Fix

## Problem

The upload script was failing with "Invalid key" errors because filenames contained the `~` (tilde) character, which Supabase Storage doesn't allow in file paths.

**Example error:**
```
Invalid key: vehicles/cmg475brn02aav8byg8igqqcg/6ab4ab_8584ab9ca2a3465992df712ba8f693be~mv2.jpeg
                                                                                     ^
                                                                                  Problem!
```

## Solution

Added automatic filename sanitization that:
- ✅ Replaces `~` with `-`
- ✅ Removes other invalid characters: `<>:"|?*`
- ✅ Replaces spaces with `_`

**Example:**
- Original: `6ab4ab_8584ab9ca2a3465992df712ba8f693be~mv2.jpeg`
- Sanitized: `6ab4ab_8584ab9ca2a3465992df712ba8f693be-mv2.jpeg`

## What Changed

### 1. Added `sanitizeFilename()` function
```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/~/g, '-')           // Replace tilde with dash
    .replace(/[<>:"|?*]/g, '')    // Remove other invalid characters
    .replace(/\s+/g, '_');        // Replace spaces with underscore
}
```

### 2. Updated upload process
- Filenames are now sanitized before uploading to Supabase
- Original filename is preserved in the results
- Both original and sanitized filenames are tracked in the JSON output

### 3. Added visual feedback
The script now shows when a filename is sanitized:
```
🔧 Sanitized filename: image~mv2.jpg → image-mv2.jpg
```

## What to Do Now

### Option 1: Run the script again
Simply run the upload script again - it will now work correctly:

```bash
cd spoke-hire-web
npm run upload-images-to-supabase
```

### Option 2: Delete failed uploads first (optional)
If you want to start fresh, you can delete the partial uploads from Supabase Storage dashboard and run again.

## Results File

The `upload-results.json` now includes both filenames:

```json
{
  "results": [
    {
      "filename": "6ab4ab_8584ab9ca2a3465992df712ba8f693be~mv2.jpeg",
      "sanitizedFilename": "6ab4ab_8584ab9ca2a3465992df712ba8f693be-mv2.jpeg",
      "supabaseUrl": "https://...storage.supabase.co/.../6ab4ab_8584ab9ca2a3465992df712ba8f693be-mv2.jpeg",
      "storagePath": "vehicles/.../6ab4ab_8584ab9ca2a3465992df712ba8f693be-mv2.jpeg",
      "success": true
    }
  ]
}
```

## Important Note for Database Updates

When you later update the database URLs, remember:
- The **original filename** is stored in the Media table
- The **sanitized filename** is used in Supabase Storage
- You'll need to sanitize the filename when constructing the new URL

This mapping is preserved in the `upload-results.json` file for easy reference.


