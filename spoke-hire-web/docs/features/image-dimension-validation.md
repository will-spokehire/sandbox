# Image Dimension Validation - Implementation Summary

## Overview

Added validation to prevent users from uploading images that are too small, ensuring all vehicle photos meet minimum quality standards.

## Changes Made

### 1. Added Dimension Constants (`~/lib/supabase/upload.ts`)

```typescript
// Minimum image dimensions
const MIN_IMAGE_WIDTH = 800;
const MIN_IMAGE_HEIGHT = 600;
```

These constants define the minimum acceptable dimensions for vehicle images.

### 2. Created Dimension Validation Function

```typescript
function validateDimensions(
  width: number,
  height: number
): { valid: boolean; error?: string } {
  if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
    return {
      valid: false,
      error: `Image must be at least ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px (current: ${width}×${height}px)`,
    };
  }
  return { valid: true };
}
```

This function checks if image dimensions meet the minimum requirements and returns a clear error message with actual dimensions if validation fails.

### 3. Updated Upload Process

Modified `uploadImageWithProgress()` to:
1. Get original image dimensions before processing
2. Validate dimensions against minimum requirements
3. Return early with descriptive error if dimensions are too small
4. Include actual dimensions in error response for debugging

**Validation Flow:**
```
File selected → Validate file type/size → Get dimensions → Validate dimensions → Proceed with upload
```

### 4. Updated UI Text

Updated the upload zone help text to show minimum requirements:

**Before:**
```
JPEG, PNG, WebP up to 15MB • Upload starts automatically
```

**After:**
```
JPEG, PNG, WebP up to 15MB • Min 800×600px • Upload starts automatically
```

## User Experience

### When Uploading Small Images:

1. User selects/drops an image
2. System checks dimensions
3. If too small, shows error message:
   ```
   "Image must be at least 800×600px (current: 640×480px)"
   ```
4. Upload progress shows error state with red X icon
5. Image is not uploaded to storage

### Error Messages:

- **Clear**: Shows both minimum requirement and actual dimensions
- **Specific**: Different error for each validation failure
- **Immediate**: User sees error right away, no waiting for upload

## Validation Rules

| Check | Minimum | Error Message |
|-------|---------|---------------|
| Width | 800px | Image must be at least 800×600px (current: WxH) |
| Height | 600px | Image must be at least 800×600px (current: WxH) |
| File Size | 15MB max | File size must be less than 15MB |
| File Type | JPEG, PNG, WebP | Only JPEG, PNG, and WebP images are allowed |

## Technical Details

- **Early validation**: Dimensions checked before any upload starts
- **No storage waste**: Small images never reach Supabase storage
- **Async validation**: Uses Promise-based image loading to get dimensions
- **Type-safe**: Full TypeScript support with proper error types
- **Consistent**: Same validation applies everywhere `uploadImageWithProgress` is used

## Benefits

✅ Ensures high-quality vehicle photos
✅ Prevents small/low-quality images
✅ Clear error messages help users understand requirements
✅ Saves bandwidth by rejecting small images before upload
✅ Consistent validation across all upload flows

## Testing

- ✅ TypeScript compilation passes
- ✅ ESLint validation passes
- ✅ Production build successful
- ✅ No performance impact (validation is fast)

## Configuration

To adjust minimum dimensions, update constants in `~/lib/supabase/upload.ts`:

```typescript
const MIN_IMAGE_WIDTH = 800;  // Change this value
const MIN_IMAGE_HEIGHT = 600; // Change this value
```

