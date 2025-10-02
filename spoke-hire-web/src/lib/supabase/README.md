# Supabase Auth Integration

This directory contains the Supabase authentication setup for SpokeHire admin interface.

## 📁 Files Overview

### `client.ts`
Browser-side Supabase client for Client Components.
- Handles auth state in the browser
- Manages session cookies automatically
- Use in `'use client'` components

**Usage:**
```tsx
'use client';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
await supabase.auth.signInWithOtp({ email });
```

### `server.ts`
Server-side Supabase clients for Server Components, Server Actions, and API routes.

**Functions:**
- `createClient()` - Regular server client with user session
- `createAdminClient()` - Admin client with service role key (bypasses RLS)

**Usage:**
```tsx
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Regular server client
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Admin client (for privileged operations)
const admin = createAdminClient();
await admin.auth.admin.createUser({ email });
```

### `middleware.ts`
Middleware helpers for auth session management.

**Functions:**
- `updateSession(request)` - Refresh auth tokens, manage cookies
- `getAuthUser(request)` - Get authenticated user in middleware

**Usage:**
```tsx
// In middleware.ts
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

### `database.types.ts`
TypeScript type definitions for Supabase database.

**Generate types:**
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
```

### `index.ts`
Convenience exports for all Supabase functionality.

## 🔐 Authentication Flow

### Email OTP Flow (Passwordless)

1. **User enters email** → Client component
   ```tsx
   const { error } = await supabase.auth.signInWithOtp({
     email: 'admin@spokehire.com',
     options: {
       emailRedirectTo: 'http://localhost:3000/auth/callback',
     },
   });
   ```

2. **User receives OTP** → Email sent by Supabase

3. **User enters OTP** → Client component
   ```tsx
   const { data, error } = await supabase.auth.verifyOtp({
     email: 'admin@spokehire.com',
     token: '123456',
     type: 'email',
   });
   ```

4. **Session created** → Cookies set automatically

5. **Access protected routes** → Middleware validates session

## 🛡️ Security

### Client vs Server Client

- **Client (`client.ts`)**: 
  - Uses anon key
  - Runs in browser
  - Subject to RLS policies
  - Session managed via cookies

- **Server (`server.ts`)**: 
  - Uses anon key + session cookie
  - Runs on server
  - Validates session on each request
  - Can access server-only data

- **Admin (`createAdminClient()`)**: 
  - Uses service role key
  - Runs on server only
  - Bypasses all RLS policies
  - Use with extreme caution

### Important Notes

⚠️ **Never expose service role key to the client**
⚠️ **Always validate admin role in your application code**
⚠️ **Use middleware to protect routes**

## 🔄 Migration from Old Client

The old `src/lib/supabase.ts` is deprecated but kept for backward compatibility with existing scripts.

**Old way:**
```tsx
import { supabase } from '@/lib/supabase';
```

**New way:**
```tsx
// Client components
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Server components
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
```

## 📚 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Setup Guide](../../SUPABASE_SETUP.md)

