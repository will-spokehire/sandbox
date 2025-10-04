# 🔐 Supabase Row Level Security (RLS) Setup Guide

## 🎯 Goal: Server-Side Only Access

Configure Supabase so that:
- ✅ **Only your server** (SERVICE_ROLE key) can access the database
- ❌ **Client-side code** (anon key) cannot access the database directly
- ✅ **All data flows through your tRPC API**

---

## 🔑 Understanding Supabase Keys

Supabase provides two keys:

### 1. **ANON Key (Public/Client-Side)**
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
```
- Safe to expose in client-side code
- Limited by Row Level Security (RLS) policies
- Can only access what RLS policies allow

### 2. **SERVICE_ROLE Key (Secret/Server-Side)**
```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."  # Keep secret!
```
- **NEVER expose to client-side**
- Bypasses ALL RLS policies
- Full database access
- Use only in server-side code (API routes, tRPC)

---

## 🛡️ Security Strategy

```
┌─────────────────────────────────────────────┐
│  Browser/Client                             │
│  (Uses ANON key)                            │
└──────────────┬──────────────────────────────┘
               │
               │ All requests go through API
               │
               ↓
┌─────────────────────────────────────────────┐
│  Your Next.js Server/tRPC                   │
│  (Uses SERVICE_ROLE key)                    │
│  ✅ Has full database access                │
└──────────────┬──────────────────────────────┘
               │
               │ Server uses SERVICE_ROLE
               │
               ↓
┌─────────────────────────────────────────────┐
│  Supabase Database                          │
│  🔒 RLS Enabled - blocks ANON key           │
│  ✅ Allows SERVICE_ROLE (bypasses RLS)      │
└─────────────────────────────────────────────┘
```

**Result:**
- Clients **cannot** query database directly
- All data must go through your API
- You control all access logic in tRPC procedures

---

## 📋 Setup Instructions

### Step 1: Apply RLS Configuration

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Copy and paste contents of `supabase-rls-setup.sql`
5. Click **"Run"** (or press Ctrl/Cmd + Enter)

**Option B: Using Command Line**

```bash
# Set your DIRECT_URL
export DATABASE_URL=$(grep DIRECT_URL .env.production | cut -d '=' -f2- | tr -d '"')

# Apply RLS configuration
psql "$DATABASE_URL" -f supabase-rls-setup.sql
```

### Step 2: Verify RLS is Enabled

In Supabase SQL Editor, run:

```sql
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ Protected'
        ELSE '❌ Unprotected'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All your tables should show `✅ Protected`.

### Step 3: Verify Server-Side Code Uses SERVICE_ROLE

Check your server-side Supabase client setup:

```typescript
// src/lib/supabase/server.ts or similar

import { createClient } from '@supabase/supabase-js';
import { env } from '~/env';

// This should use SERVICE_ROLE key for server-side
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,  // ✅ Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

### Step 4: Test Client-Side Access is Blocked

Try querying from the browser console (should fail):

```javascript
// This should FAIL with RLS enabled
const { data, error } = await supabase
  .from('Vehicle')
  .select('*')

console.log(error); // Should show permission denied
```

### Step 5: Test Server-Side Access Works

Your tRPC procedures should work normally:

```typescript
// src/server/api/routers/vehicles.ts

export const vehicleRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    // This uses Prisma, which uses SERVICE_ROLE through DATABASE_URL
    const vehicles = await ctx.db.vehicle.findMany();
    return vehicles; // ✅ Should work
  }),
});
```

---

## 🔍 What RLS Does

### Without RLS (Default - Insecure):
```javascript
// Client-side code can access database directly
const { data } = await supabase
  .from('Vehicle')
  .select('*')  // ✅ Works - BAD!

// Anyone can read/modify your data!
```

### With RLS Enabled (Secure):
```javascript
// Client-side code CANNOT access database
const { data, error } = await supabase
  .from('Vehicle')
  .select('*')  // ❌ Fails - GOOD!

// Must go through your API
const vehicles = await trpc.vehicles.getAll.query(); // ✅ Works through server
```

---

## 🔒 RLS Policy Explanation

The script creates policies with `USING (false)`:

```sql
CREATE POLICY "service_role_only_vehicle" ON "public"."Vehicle"
    FOR ALL
    USING (false);
```

**What this means:**
- `FOR ALL` = Applies to SELECT, INSERT, UPDATE, DELETE
- `USING (false)` = Always evaluates to false
- Result: **No one** with ANON key can access this table

**SERVICE_ROLE key bypasses RLS entirely**, so your server still has full access.

---

## ⚙️ Your Application Architecture

### Current Setup (After RLS):

```typescript
// ❌ Client-Side (Browser) - BLOCKED
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // Limited by RLS
);

// This will FAIL:
const { data } = await supabase.from('Vehicle').select('*');
// Error: permission denied for table Vehicle


// ✅ Server-Side (tRPC/API Routes) - WORKS
// src/server/db.ts
import { PrismaClient } from '@prisma/client';

// Uses DATABASE_URL which has full access
const prisma = new PrismaClient();

// This WORKS:
const vehicles = await prisma.vehicle.findMany();


// ✅ Client calls server through tRPC
// app/vehicles/page.tsx
const { data } = api.vehicles.getAll.useQuery();  // Works!
```

---

## 🧪 Testing RLS

### Test 1: Direct Database Access (Should Fail)

```bash
# Try to query as anon user
export ANON_KEY="your-anon-key"

curl -X POST "https://your-project.supabase.co/rest/v1/Vehicle?select=*" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"

# Expected: {"message":"permission denied for table Vehicle"}
```

### Test 2: Server-Side Access (Should Work)

```bash
# Your tRPC endpoints should work
curl http://localhost:3000/api/trpc/vehicles.getAll

# Expected: Returns vehicle data
```

### Test 3: Supabase Dashboard (Should Work)

1. Go to Supabase → Table Editor
2. You can still view/edit data (dashboard uses service role)
3. Your Prisma Studio also works (uses DATABASE_URL)

---

## 🔐 Additional Security Best Practices

### 1. Environment Variable Protection

```bash
# .env.production (NEVER commit this!)
SUPABASE_SERVICE_ROLE_KEY="secret-key-here"  # Server only!

# .env.local (For development)
NEXT_PUBLIC_SUPABASE_URL="..."   # OK to expose
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."  # OK to expose
SUPABASE_SERVICE_ROLE_KEY="..."  # Keep secret!
```

### 2. Verify env.js Configuration

```typescript
// src/env.js
export const env = createEnv({
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),  // Server-side only
  },
  client: {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),  // Client-side OK
  },
  // ...
});
```

### 3. tRPC Context Setup

```typescript
// src/server/api/trpc.ts
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    db: db,  // Prisma client (uses SERVICE_ROLE via DATABASE_URL)
    // supabaseAdmin: supabaseAdmin,  // If you need Supabase storage/auth
  };
};
```

### 4. Protected Procedures

```typescript
// For authenticated routes
const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // Check session from cookies
  const session = await getServerSession();
  
  if (!session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  return next({
    ctx: {
      ...ctx,
      session,
    },
  });
});
```

---

## 🚨 Troubleshooting

### Issue: "permission denied for table X"

**Good!** This means RLS is working. Make sure your code:
1. Uses Prisma (which uses DATABASE_URL with proper credentials)
2. Or uses Supabase client with SERVICE_ROLE key server-side
3. Never uses ANON key for direct database access

### Issue: tRPC queries failing

**Check:**
1. Your DATABASE_URL has proper credentials
2. Prisma client is initialized correctly
3. You're not trying to use Supabase client with ANON key in server code

### Issue: Can't access tables in Supabase Dashboard

**This shouldn't happen.** The dashboard always uses service role.
If it does, check:
1. Your Supabase project is active
2. You're logged in
3. Try refreshing the page

---

## 📊 Before vs After

### Before RLS:
```
Client (Browser) → Supabase Database ✅
    ↑
    └── Dangerous! Anyone can access your data
```

### After RLS:
```
Client (Browser) → Supabase Database ❌ (Blocked by RLS)
Client (Browser) → Your API → Supabase Database ✅
    ↑
    └── Secure! All access controlled by your API
```

---

## ✅ Verification Checklist

After setting up RLS, verify:

- [ ] RLS is enabled on all tables (run verification query)
- [ ] Direct client-side queries are blocked
- [ ] tRPC queries work normally
- [ ] Admin users can login
- [ ] Vehicles are loading in the app
- [ ] SERVICE_ROLE key is not exposed to client
- [ ] ANON key is not used for database queries server-side

---

## 🎉 Benefits

With RLS properly configured:

1. **Security** - No direct database access from clients
2. **Control** - All data access goes through your API
3. **Validation** - You control all input/output
4. **Auditing** - Log all database operations
5. **Flexibility** - Easy to add authentication/authorization logic

---

## 📚 Next Steps

1. Apply the RLS configuration
2. Test that client-side queries are blocked
3. Verify your tRPC/API routes still work
4. Deploy to production with confidence!

Need help? The setup script is in `supabase-rls-setup.sql` and ready to run!
