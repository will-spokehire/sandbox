# ⏭️ Skip Ready and Failed Images Feature

## Overview

The upload script now **intelligently skips images** that are:
- ✅ Already uploaded (status = `READY`)
- ❌ Previously failed (status = `FAILED`)

This saves time and bandwidth by only processing images that need uploading.

## How It Works

### When `OVERWRITE_EXISTING: false` (Default for production)

```typescript
const CONFIG = {
  OVERWRITE_EXISTING: false,  // Skip READY images
  // ...
};
```

**Behavior:**
- ✅ Only processes images with status: `PROCESSING` or `UPLOADING`
- ✅ Skips images already marked as `READY`
- ✅ Skips images marked as `FAILED`
- ✅ Saves time and bandwidth
- ✅ Perfect for incremental uploads

**Console Output:**
```
📋 Fetching media records from database (limit: 50)...
  ℹ️  Skipping READY and FAILED images
📊 Found 12 media records to process

(Only shows images that need uploading)
```

### When `OVERWRITE_EXISTING: true` (For fixing issues)

```typescript
const CONFIG = {
  OVERWRITE_EXISTING: true,  // Re-upload ALL images including READY
  // ...
};
```

**Behavior:**
- ✅ Processes ALL images including `READY` status
- ✅ Still excludes `FAILED` images (permanently failed)
- ✅ Useful for fixing rotated images
- ✅ Updates with new file sizes
- ✅ Re-applies EXIF rotation correction

**Console Output:**
```
📋 Fetching media records from database (limit: 50)...
  ℹ️  Including READY images (OVERWRITE_EXISTING is true)
  ℹ️  Excluding FAILED images
📊 Found 48 media records to process

(Shows all images except FAILED ones)
```

## Use Cases

### 1. Initial Upload (First Time)
```typescript
OVERWRITE_EXISTING: false,
LIMIT: undefined,  // Upload all
```

**Result:** Uploads all images that aren't marked as `READY`

### 2. Incremental Upload (New Images Added)
```typescript
OVERWRITE_EXISTING: false,
LIMIT: undefined,
```

**Result:** Only uploads new images (status = `PROCESSING` or `UPLOADING`)

### 3. Fix Rotated Images (Re-upload All)
```typescript
OVERWRITE_EXISTING: true,
LIMIT: undefined,
```

**Result:** Re-uploads ALL images with rotation fixes

### 4. Test Upload (Safe Testing)
```typescript
OVERWRITE_EXISTING: false,
LIMIT: 50,
```

**Result:** Tests with 50 non-uploaded images only

## Media Status Flow

```
New Image Added
    ↓
status: UPLOADING or PROCESSING
    ↓
Script processes it (when OVERWRITE_EXISTING: false)
    ↓
Upload to Supabase
    ↓
  Success? ━━━━━━━━━━━━━┓
    ↓                    ↓
  YES                   NO
    ↓                    ↓
status: READY       status: FAILED
    ↓                    ↓
Script skips ✅     Script skips ✅
```

## Checking What Will Be Processed

Use the status check script:

```bash
npm run check-upload-status
```

**Output:**
```
📈 Overall Statistics:
  Total images: 3660
  With published URL: 2500
  Without published URL: 1160
  Uploaded & READY: 2500

📊 Status Breakdown:
  READY: 2500 (68.3%)
  PROCESSING: 1000 (27.3%)
  UPLOADING: 160 (4.4%)

🔍 Upload Progress:
  Uploaded to Supabase: 68.3%
  Uploaded & Ready: 68.3%
```

**Next run with `OVERWRITE_EXISTING: false` will process:**
- 1000 `PROCESSING` images
- 160 `UPLOADING` images
- **Total: 1160 images** (skips 2500 `READY` images)

## Benefits

### ✅ Efficiency
- Don't re-upload already uploaded images
- Save bandwidth and time
- Faster incremental uploads

### ✅ Safety
- Prevents unnecessary re-uploads
- Preserves existing uploads
- Clear separation between new and done

### ✅ Flexibility
- Easy to re-upload all when needed (set `OVERWRITE_EXISTING: true`)
- Can fix issues without manual filtering
- Smart defaults for different scenarios

## Query Logic

### Skip READY and FAILED (Default)
```sql
SELECT * FROM Media
WHERE type = 'IMAGE'
  AND status IN ('PROCESSING', 'UPLOADING')  -- Excludes READY and FAILED
LIMIT 50;
```

### Include READY, Exclude FAILED (Overwrite Mode)
```sql
SELECT * FROM Media
WHERE type = 'IMAGE'
  AND status IN ('READY', 'PROCESSING', 'UPLOADING')  -- Excludes only FAILED
LIMIT 50;
```

## Examples

### Scenario 1: Daily Incremental Upload
You add 100 new vehicle images daily.

**Config:**
```typescript
OVERWRITE_EXISTING: false,
LIMIT: undefined,
```

**Result:** Only uploads the 100 new images, skips 3,000+ existing ones.

### Scenario 2: Found Rotation Issues
Some images are rotated, need to re-upload.

**Step 1 - Fix specific images:**
```sql
-- Mark problematic images for re-upload
UPDATE Media
SET status = 'PROCESSING'
WHERE filename IN ('rotated1.jpg', 'rotated2.jpg');
```

**Step 2 - Run script:**
```typescript
OVERWRITE_EXISTING: false,  // Only re-uploads the ones we marked
```

**Alternative - Fix ALL:**
```typescript
OVERWRITE_EXISTING: true,   // Re-upload everything with fixes
```

### Scenario 3: Resume Failed Upload
Upload was interrupted, some succeeded, some failed.

**Config:**
```typescript
OVERWRITE_EXISTING: false,  // Will skip successful ones (READY)
LIMIT: undefined,           // Process all failed ones
```

**Result:** Resumes from where it left off!

## Monitoring

### Before Running
```bash
npm run check-upload-status
```

Check the counts to know how many images will be processed.

### After Running
```bash
npm run check-upload-status
```

Verify that images moved from `PROCESSING`/`UPLOADING` to `READY`.

## Best Practices

### 1. Start Conservative
```typescript
OVERWRITE_EXISTING: false,  // Don't re-upload
LIMIT: 50,                  // Test with 50
```

### 2. Check Status First
```bash
npm run check-upload-status
```

### 3. Incremental Production Runs
```typescript
OVERWRITE_EXISTING: false,  // Skip existing
LIMIT: 500,                 // Batch of 500
```

### 4. Fix Issues
```typescript
OVERWRITE_EXISTING: true,   // Re-upload all
LIMIT: 50,                  // Test first
```

## Configuration Reference

| Setting | OVERWRITE_EXISTING | Status Processed | Status Skipped | Use Case |
|---------|-------------------|------------------|----------------|----------|
| Default | `false` | `PROCESSING`, `UPLOADING` | `READY`, `FAILED` | Normal incremental uploads |
| Fix Mode | `true` | `READY`, `PROCESSING`, `UPLOADING` | `FAILED` | Fix rotated/corrupted images |

**Note:** `FAILED` images are **always excluded** in both modes. To retry failed images, manually update their status first.

## Retry Failed Images

If you want to retry images that previously failed:

```sql
-- Reset failed images to PROCESSING
UPDATE Media
SET status = 'PROCESSING'
WHERE status = 'FAILED'
  AND type = 'IMAGE';
```

Then run the script again.

## Summary

- ✅ **Smart filtering** prevents re-uploading already uploaded images
- ✅ **Skips FAILED images** to avoid wasting time on permanent failures
- ✅ **Toggle behavior** with `OVERWRITE_EXISTING` setting
- ✅ **Status-based** logic ensures only necessary work is done
- ✅ **Bandwidth savings** by skipping `READY` and `FAILED` images
- ✅ **Flexibility** to override when needed

Default behavior: **Skip READY and FAILED images** = Fast, efficient, incremental uploads! 🚀

