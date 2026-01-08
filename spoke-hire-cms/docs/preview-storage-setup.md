# Preview Storage Setup Guide

Complete guide for setting up Supabase S3 storage for PayloadCMS image uploads in preview deployments.

## Overview

Preview deployments on Vercel use `NODE_ENV=production`, which means PayloadCMS will automatically use Supabase S3 storage (not local filesystem). This guide walks you through configuring Supabase Storage for preview environments.

## Prerequisites

- Access to your preview Supabase project dashboard
- Preview Supabase project already created (same as spoke-hire-web preview)
- Vercel project configured for preview deployments

---

## Step 1: Enable S3 Protocol in Supabase

1. Go to your **preview Supabase project** dashboard
   - URL: `https://app.supabase.com/project/[PREVIEW-PROJECT-REF]`

2. Navigate to **Storage** → **Settings**

3. Find the **S3 Protocol Access** section

4. Click **Enable S3 Protocol** (if not already enabled)

5. Wait for the feature to activate (usually instant)

> **Note**: S3 Protocol Access allows Supabase Storage to be accessed via S3-compatible API, which PayloadCMS uses for media uploads.

---

## Step 2: Generate S3 Credentials

1. In the same **Storage** → **Settings** page

2. Scroll to the **S3 API** section

3. Click **Generate new credentials** (or use existing if already generated)

4. **Save these credentials securely**:
   - **Access Key ID** - Public identifier
   - **Secret Access Key** - Private key (shown only once!)

5. Copy both values - you'll need them for environment variables

> **Warning**: The Secret Access Key is shown only once. If you lose it, you'll need to generate new credentials.

---

## Step 3: Create Storage Bucket

1. In Supabase dashboard, go to **Storage** → **Buckets**

2. Click **New bucket**

3. Configure the bucket:
   - **Name**: `payload-media` (or your preferred name)
   - **Public bucket**: 
     - ✅ **Checked** - For publicly accessible media (recommended for preview)
     - ❌ **Unchecked** - For admin-only access
   - **File size limit**: Leave default or set as needed
   - **Allowed MIME types**: Leave empty for all types, or specify (e.g., `image/*`)

4. Click **Create bucket**

5. Verify the bucket appears in your buckets list

> **Note**: The bucket name must match the `SUPABASE_BUCKET_NAME` environment variable you'll set later.

---

## Step 4: Configure Environment Variables in Vercel

You need to set these environment variables in Vercel for **preview** deployments:

### Required Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables for **Preview** environment:

```env
# Supabase Storage S3 Endpoint
# Format: https://[PREVIEW-PROJECT-REF].supabase.co/storage/v1/s3
SUPABASE_STORAGE_ENDPOINT="https://[PREVIEW-PROJECT-REF].supabase.co/storage/v1/s3"

# Supabase Storage Region
# Typically "us-east-1" or your Supabase project region
SUPABASE_STORAGE_REGION="us-east-1"

# S3 Access Key ID (from Step 2)
SUPABASE_ACCESS_KEY_ID="your-access-key-id-here"

# S3 Secret Access Key (from Step 2)
SUPABASE_SECRET_ACCESS_KEY="your-secret-access-key-here"

# Storage Bucket Name (from Step 3)
SUPABASE_BUCKET_NAME="payload-media"
```

### How to Get the Endpoint URL

The endpoint URL format is:
```
https://[YOUR-PROJECT-REF].supabase.co/storage/v1/s3
```

To find your project reference:
1. Go to Supabase Dashboard → Settings → API
2. Your Project URL is: `https://[PROJECT-REF].supabase.co`
3. Use the `[PROJECT-REF]` part in the endpoint URL

### Setting Variables in Vercel

1. For each variable:
   - Click **Add New**
   - Enter the **Key** (variable name)
   - Enter the **Value**
   - Select **Preview** from the environment dropdown
   - Click **Save**

2. Repeat for all 5 variables

> **Important**: Make sure to select **Preview** environment, not Production or Development.

---

## Step 5: Test Image Upload

After setting up storage and environment variables:

1. **Trigger a new preview deployment** in Vercel:
   - Push a commit to a branch, or
   - Redeploy an existing preview deployment

2. **Wait for deployment to complete**

3. **Access the preview CMS admin panel**:
   - URL: `https://[your-preview-url].vercel.app/admin`

4. **Log in** to the admin panel

5. **Navigate to Media collection**:
   - Go to **Collections** → **Media**

6. **Upload a test image**:
   - Click **Create New**
   - Upload an image file
   - Fill in required fields
   - Click **Save**

7. **Verify the upload**:
   - Check that the image appears in the Media collection
   - Open the image URL in a new tab to verify it's accessible
   - Go to Supabase Dashboard → Storage → Buckets → `payload-media`
   - Verify the uploaded file appears in the bucket

---

## Troubleshooting

### Images Not Uploading

**Problem**: Upload fails or images don't appear

**Solutions**:
1. **Check environment variables**:
   - Verify all 5 storage variables are set in Vercel
   - Ensure they're set for **Preview** environment
   - Check for typos in variable names

2. **Verify S3 credentials**:
   - Go to Supabase → Storage → Settings → S3 API
   - Regenerate credentials if needed
   - Update Vercel environment variables

3. **Check bucket permissions**:
   - Ensure bucket exists in Supabase
   - Verify bucket name matches `SUPABASE_BUCKET_NAME`
   - Check bucket is accessible (public or has proper policies)

4. **Check deployment logs**:
   - Go to Vercel → Deployments → [Your Deployment] → Logs
   - Look for storage-related errors
   - Check for missing environment variables

### "Access Denied" Errors

**Problem**: S3 API returns access denied

**Solutions**:
1. Verify S3 Protocol is enabled in Supabase
2. Check that Access Key ID and Secret Access Key are correct
3. Ensure credentials haven't been revoked
4. Regenerate credentials if needed

### Images Upload But Don't Display

**Problem**: Upload succeeds but images don't show

**Solutions**:
1. **Check bucket privacy**:
   - If bucket is private, ensure proper RLS policies
   - Consider making bucket public for preview/testing

2. **Verify endpoint URL**:
   - Check `SUPABASE_STORAGE_ENDPOINT` format
   - Ensure project reference is correct

3. **Check CORS settings**:
   - In Supabase → Storage → Settings
   - Verify CORS is configured for your preview domain

### Environment Variables Not Applied

**Problem**: Changes to env vars don't take effect

**Solutions**:
1. **Redeploy after changes**:
   - Environment variables are only applied on new deployments
   - Trigger a new deployment after adding/updating variables

2. **Check environment scope**:
   - Ensure variables are set for **Preview** environment
   - Production and Development environments are separate

3. **Verify variable names**:
   - Must match exactly: `SUPABASE_STORAGE_ENDPOINT`, `SUPABASE_ACCESS_KEY_ID`, etc.
   - Case-sensitive

---

## Verification Checklist

After setup, verify everything works:

- [ ] S3 Protocol enabled in Supabase
- [ ] S3 credentials generated and saved
- [ ] Storage bucket created (`payload-media` or your name)
- [ ] All 5 environment variables set in Vercel (Preview)
- [ ] Preview deployment completed successfully
- [ ] Can access CMS admin panel in preview
- [ ] Can upload images to Media collection
- [ ] Uploaded images appear in Supabase Storage bucket
- [ ] Images are accessible via URL

---

## Additional Notes

### Storage Costs

- Supabase Storage has free tier limits
- Preview deployments share the same storage as production (if using same project)
- Consider using separate Supabase project for preview to isolate costs

### Bucket Naming

- Default bucket name: `payload-media`
- Can use any name, but must match `SUPABASE_BUCKET_NAME`
- Use descriptive names: `payload-media-preview`, `cms-uploads`, etc.

### Security Considerations

- **Preview environments**: Public buckets are fine for testing
- **Production**: Consider private buckets with RLS policies
- **Credentials**: Never commit S3 credentials to version control
- **Rotation**: Periodically rotate S3 credentials for security

### Migration from Local Storage

If you have existing local media files:

1. Upload them manually through the CMS admin panel, or
2. Use a migration script to bulk upload to Supabase Storage
3. Update media records in database if URLs change

---

## Next Steps

After storage is configured:

1. ✅ Test image uploads in preview
2. ✅ Verify images persist across deployments
3. ✅ Set up production storage (similar process)
4. ✅ Configure image optimization if needed

---

## References

- [Supabase S3 Compatibility](https://supabase.com/docs/guides/storage/s3/compatibility)
- [PayloadCMS Storage Adapters](https://payloadcms.com/docs/upload/storage-adapters)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Last Updated**: January 2025


