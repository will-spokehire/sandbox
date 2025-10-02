# Admin Authentication Feature

## Overview

Passwordless authentication system for admin users using Supabase Email OTP (One-Time Password). Admins are users with `userType: ADMIN` in the database.

## Architecture

### Authentication Flow
1. Admin enters email address
2. Supabase sends OTP code via email (6-digit code)
3. Admin enters OTP code to verify
4. **Client-side**: Supabase verifies OTP → creates session → sets HTTP-only cookies
5. **Server-side**: Backend validates admin role and updates database
6. Session persists across requests via cookies
7. User role checked in database on protected routes (`userType === 'ADMIN'`)

### Two-Tier Authorization
- **Tier 1 (Client)**: Supabase validates OTP code and creates session with cookies
- **Tier 2 (Server)**: Application validates admin role from database and updates login time

This hybrid approach ensures:
- Session cookies are properly set in the browser (client-side Supabase)
- Admin role is validated on the server (can't be bypassed)
- Login times are tracked in our database

## Implementation Status

### ✅ Phase 1: Supabase Client Setup (Complete)

Created Supabase client infrastructure for Next.js 15 App Router:

**Files Created:**
- `src/lib/supabase/client.ts` - Browser-side auth client
- `src/lib/supabase/server.ts` - Server-side auth client + admin client
- `src/lib/supabase/middleware.ts` - Middleware helpers
- `src/lib/supabase/database.types.ts` - TypeScript types
- `src/lib/supabase/index.ts` - Convenience exports
- `src/lib/supabase/README.md` - API documentation

**Configuration:**
- `.env.example` - Environment variable template
- Updated `src/lib/supabase.ts` with deprecation notices

**Package Updates:**
- Installed `@supabase/ssr` for SSR support

### ✅ Phase 2: Auth Context & tRPC Setup (Complete)

**tRPC Infrastructure:**
- Updated `src/server/api/trpc.ts` with auth context
- Added `protectedProcedure` for authenticated users
- Added `adminProcedure` for admin-only endpoints
- Context includes `user`, `supabaseUser`, and `supabase` client

**Auth Router:** (`src/server/api/routers/auth.ts`)
- `auth.signInWithOtp` - Send OTP to email (validates admin role)
- `auth.verifyOtp` - Verify OTP and create session
- `auth.signOut` - End session
- `auth.getSession` - Get current user session
- `auth.resendOtp` - Resend OTP code

**Auth Provider:** (`src/providers/auth-provider.tsx`)
- React Context for client-side auth state
- `useAuth()` hook for accessing auth state
- `useRequireAuth()` hook for protected pages
- `useRequireAdmin()` hook for admin-only pages
- Syncs with Supabase auth state changes

**Scripts:**
- `npm run create-admin-user` - Interactive script to create admin users

### ✅ Phase 3: UI Components (Complete)

**Auth Components:** (`src/components/auth/`)
- `LoginForm.tsx` - Email input form with OTP request
- `OTPVerification.tsx` - OTP code input and verification
- `UserMenu.tsx` - User dropdown menu with sign out
- `AuthGuard.tsx` - Client-side route protection component
- `index.ts` - Centralized exports

**Auth Pages:** (`src/app/auth/`)
- `/auth/login` - Login page with email input
- `/auth/verify-otp` - OTP verification page
- `/auth/callback` - OAuth callback handler (for magic links)

**Admin Pages:** (`src/app/admin/`)
- `/admin` - Protected admin dashboard (demo page)

**Layout Updates:**
- Added `AuthProvider` to root layout
- Added `Toaster` for notifications
- Full app-wide auth state management

### ⏳ Phase 4: Admin Interface (Pending)
- Admin layout
- Dashboard
- Vehicle management pages

### ⏳ Phase 5: Middleware Protection (Pending)
- Next.js middleware for route protection
- Redirect logic

## Usage Examples

### Client Component (Browser)
```tsx
'use client';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const supabase = createClient();
  
  const handleLogin = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: { 
        emailRedirectTo: 'http://localhost:3000/auth/callback' 
      }
    });
  };
  
  return (/* form JSX */);
}
```

### Server Component
```tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  return <div>Admin Dashboard</div>;
}
```

### Server Action
```tsx
'use server';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}
```

### Middleware
```tsx
import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### Admin Operations (Service Role)
```tsx
import { createAdminClient } from '@/lib/supabase/server';

// Server-side only! Never expose to client
export async function createAdminUser(email: string) {
  const supabase = createAdminClient();
  
  // Bypasses RLS, can perform privileged operations
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  
  return data;
}
```

## Database Schema

### User Model (Prisma)
```prisma
model User {
  id               String     @id @default(cuid())
  supabaseId       String?    @unique
  email            String     @unique
  userType         UserType   @default(OWNER_ONLY)
  status           UserStatus @default(ACTIVE)
  // ... other fields
}

enum UserType {
  OWNER_ONLY    // Has vehicles but no Supabase account
  REGISTERED    // Has Supabase account
  ADMIN         // Admin users
}
```

### User Creation Flow
1. Create user in Supabase Auth
2. Get Supabase user UUID
3. Create User record in Prisma database
4. Link via `supabaseId` field
5. Set `userType: 'ADMIN'`

## Setup Instructions

### 1. Create Supabase Project
1. Sign up at https://supabase.com
2. Create new project
3. Wait for provisioning (~2 minutes)

### 2. Get API Keys
From Supabase Dashboard → Settings → API:
- Project URL
- anon/public key
- service_role key (keep secret!)

### 3. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
```

### 4. Enable Email Auth in Supabase
Dashboard → Authentication → Providers:
- ✅ Enable Email provider
- Configure OTP settings (6 digits, 1 hour expiry)
- Set up email templates

### 5. Configure URLs
Dashboard → Authentication → URL Configuration:
- Site URL: `http://localhost:3000` (dev) / `https://your-domain.com` (prod)
- Redirect URLs: Add callback URLs

### 6. Create Admin User
```bash
npm run create-admin-user
```

Follow the interactive prompts to enter:
- Email address
- First name
- Last name

The script will:
- Create user in Supabase Auth
- Create user in your database with ADMIN role
- Link the accounts via supabaseId

## Security Considerations

### Best Practices
✅ Service role key server-side only  
✅ HTTP-only cookies for sessions  
✅ Validate admin role in application code  
✅ Use middleware for route protection  
✅ Enable email confirmation in production  
✅ Implement rate limiting for OTP  

### What NOT to Do
❌ Never expose service role key to client  
❌ Never trust client-side auth checks alone  
❌ Never skip admin role validation  
❌ Don't store secrets in git  

## API Reference

See `src/lib/supabase/README.md` for complete API documentation.

## Troubleshooting

### "Invalid API key" error
- Check API keys in `.env.local`
- Restart dev server after changes
- Verify keys are complete (they're very long)

### "Failed to send email" error
- Enable Email provider in Supabase
- Check email templates are configured
- Review Supabase logs

### Database connection error
- Verify DATABASE_URL is correct
- Check IP allowlist in Supabase
- Confirm database password

## Related Files

### Core Implementation
- `src/lib/supabase/` - All auth clients
- `src/server/api/trpc.ts` - Will contain auth middleware
- `middleware.ts` - Route protection (to be created)

### Documentation
- `src/lib/supabase/README.md` - API reference
- `.env.example` - Environment template
- `SUPABASE_SETUP.md` - Detailed setup guide (root level, acceptable for setup docs)

## Future Enhancements

- [ ] Magic link as alternative to OTP
- [ ] Multi-factor authentication (MFA)
- [ ] Admin role hierarchy (super admin, moderator)
- [ ] Audit logging for admin actions
- [ ] Session management dashboard
- [ ] Rate limiting for login attempts

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Email OTP Documentation](https://supabase.com/docs/guides/auth/auth-email-otp)

## tRPC API Reference

### Auth Router Endpoints

All endpoints available via `api.auth.*`:

```tsx
// Sign in with email OTP
const { mutate: signIn } = api.auth.signInWithOtp.useMutation();
signIn({ email: 'admin@example.com' });

// Verify OTP
const { mutate: verify } = api.auth.verifyOtp.useMutation();
verify({ email: 'admin@example.com', token: '123456' });

// Get current session
const { data: session } = api.auth.getSession.useQuery();

// Sign out
const { mutate: signOut } = api.auth.signOut.useMutation();
signOut();

// Resend OTP
const { mutate: resend } = api.auth.resendOtp.useMutation();
resend({ email: 'admin@example.com' });
```

### Protected Procedures

Create protected endpoints using the middleware:

```tsx
// src/server/api/routers/vehicles.ts
import { createTRPCRouter, protectedProcedure, adminProcedure } from '~/server/api/trpc';

export const vehicleRouter = createTRPCRouter({
  // Any authenticated user
  getMyVehicles: protectedProcedure.query(({ ctx }) => {
    return ctx.db.vehicle.findMany({
      where: { ownerId: ctx.user.id }
    });
  }),

  // Admin only
  getAllVehicles: adminProcedure.query(({ ctx }) => {
    return ctx.db.vehicle.findMany();
  }),
});
```

## React Hooks Reference

### useAuth()
Access authentication state anywhere in your app:

```tsx
import { useAuth } from '~/providers/auth-provider';

function MyComponent() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### useRequireAuth()
Automatically redirect if not authenticated:

```tsx
import { useRequireAuth } from '~/providers/auth-provider';

export function ProtectedPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) return <div>Loading...</div>;

  // User is guaranteed to be authenticated here
  return <div>Protected content for {user.email}</div>;
}
```

### useRequireAdmin()
Automatically redirect if not admin:

```tsx
import { useRequireAdmin } from '~/providers/auth-provider';

export function AdminPage() {
  const { user, isLoading } = useRequireAdmin();

  if (isLoading) return <div>Loading...</div>;

  // User is guaranteed to be an admin here
  return <div>Admin Dashboard</div>;
}
```

## Testing the Authentication Flow

### 1. Setup Supabase
Follow `SUPABASE_SETUP.md` to configure your Supabase project.

### 2. Create Admin User
```bash
npm run create-admin-user
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test Login Flow
1. Navigate to http://localhost:3000/auth/login
2. Enter your admin email
3. Check your email for OTP code
4. Enter the OTP at http://localhost:3000/auth/verify-otp
5. You'll be redirected to http://localhost:3000/admin

### 5. Verify Protection
- Try accessing `/admin` without auth → redirects to `/auth/login`
- Sign in and access `/admin` → shows dashboard
- Sign out from user menu → redirects to login

---

**Last Updated**: Phase 3 Complete  
**Next**: Phase 4 - Admin Interface Pages (Vehicle Management)

