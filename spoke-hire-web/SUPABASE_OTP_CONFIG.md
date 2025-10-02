# 🔐 Configure Supabase for OTP (Not Magic Links)

By default, Supabase sends magic links. Here's how to configure it to send OTP codes instead.

## Problem
- Emails contain magic links instead of 6-digit OTP codes
- Getting `auth_callback_failed` errors when clicking links

## Solution: Configure Supabase Email Template

### Step 1: Go to Email Templates

1. Open your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Email Templates**

### Step 2: Update the "Magic Link" Template

The "Magic Link" template is used for OTP emails too. Update it to show the OTP code:

**Subject:**
```
Your SpokeHire Admin Login Code
```

**Body (HTML):**
```html
<h2>Your Login Code</h2>
<p>Use this code to sign in to SpokeHire Admin:</p>
<h1 style="font-size: 32px; font-weight: bold; margin: 20px 0;">{{ .Token }}</h1>
<p>This code will expire in {{ .TokenExpiryDuration }} seconds.</p>
<p>If you didn't request this code, you can safely ignore this email.</p>
```

**Important:** Use `{{ .Token }}` to display the OTP code (not `{{ .ConfirmationURL }}`).

### Step 3: Alternative - Customize Confirm Your Email Template

If the above doesn't work, you can also try the "Confirm your email" template:

```html
<h2>Sign in to SpokeHire Admin</h2>
<p>Enter this verification code:</p>
<h1 style="font-size: 32px; font-weight: bold; margin: 20px 0; font-family: monospace; letter-spacing: 4px;">{{ .Token }}</h1>
<p>Code expires in: {{ .TokenExpiryDuration }} seconds</p>
<p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
```

### Step 4: Verify OTP Settings

Go to **Authentication** → **Settings**:

1. Scroll to **Auth Providers** → **Email**
2. Ensure these settings:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** - Can be disabled for development
   - **OTP expiry duration**: `3600` (1 hour)
   - **OTP length**: `6`

### Step 5: Test the Configuration

1. Go to your login page: http://localhost:3000/auth/login
2. Enter your admin email
3. Check your email - you should now see a 6-digit code like `123456`
4. Enter the code at: http://localhost:3000/auth/verify-otp
5. You should be redirected to the admin dashboard

## Available Template Variables

In Supabase email templates, you can use:

- `{{ .Token }}` - The OTP code (6 digits)
- `{{ .TokenHash }}` - Hashed token (for magic links)
- `{{ .ConfirmationURL }}` - Magic link URL (we don't use this)
- `{{ .Email }}` - User's email address
- `{{ .TokenExpiryDuration }}` - Token expiry in seconds
- `{{ .SiteURL }}` - Your site URL

## Recommended Email Template

Here's a complete, production-ready template:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">SpokeHire</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Admin Portal</p>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Your Login Code</h2>
    <p style="color: #6b7280; font-size: 16px;">Enter this code to sign in to your admin account:</p>
    
    <div style="background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
      <div style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #1f2937; font-family: 'Courier New', monospace;">
        {{ .Token }}
      </div>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      <strong>This code expires in {{ .TokenExpiryDuration }} seconds</strong>
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 13px; margin: 0;">
      If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>SpokeHire Admin Portal</p>
  </div>
</body>
</html>
```

## Still Getting Magic Links?

If you're still receiving magic links after updating the template:

1. **Clear Supabase cache:**
   - Update and save the template again
   - Wait a few minutes for changes to propagate

2. **Check the template name:**
   - Make sure you edited "Magic Link" template
   - This is used for both magic links and OTP

3. **Verify in Supabase Logs:**
   - Go to **Authentication** → **Logs**
   - Check recent emails sent
   - Confirm they show OTP tokens

4. **Test with a different email:**
   - Sometimes cached emails cause issues
   - Try with a fresh email address

## Alternative: Use Magic Links (Not Recommended)

If you want to use magic links instead of OTP:

1. Keep the default email template with `{{ .ConfirmationURL }}`
2. Users click the link instead of entering code
3. They'll be redirected to `/auth/callback`
4. The callback handler will process the link

However, **we recommend OTP** because:
- More secure (can't be intercepted from email)
- Better UX (paste code vs click link)
- Works in all email clients
- No URL callback issues

---

**Need Help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.

