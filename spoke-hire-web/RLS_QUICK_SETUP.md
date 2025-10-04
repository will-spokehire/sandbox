# ⚡ Quick RLS Setup

## ✅ Your Current Setup (Already Good!)

Your Supabase client configuration is **already properly set up**:

```typescript
// ✅ GOOD: Server-side with SERVICE_ROLE
import { createAdminClient } from '~/lib/supabase/server';
const supabase = createAdminClient();  // Uses SERVICE_ROLE key

// ✅ GOOD: Server-side with user session
import { createClient } from '~/lib/supabase/server';
const supabase = await createClient();  // Uses ANON key + cookies

// ✅ GOOD: Client-side (limited by RLS)
import { createClient } from '~/lib/supabase/client';
const supabase = createClient();  // Uses ANON key
```

---

## 🎯 Quick Setup (3 Steps)

### Step 1: Apply RLS Configuration

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Copy and paste the entire contents of `supabase-rls-setup.sql` and click **Run**.

### Step 2: Verify RLS is Active

Run this query in SQL Editor:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('Country', 'User', 'Vehicle', 'Media');
```

All should show `rowsecurity = true`.

### Step 3: Update Your Code (If Needed)

**For database operations in tRPC/API routes:**

```typescript
// Option 1: Use Prisma (Recommended - already set up)
const vehicles = await ctx.db.vehicle.findMany();  // ✅ Works

// Option 2: Use Supabase admin client
import { createAdminClient } from '~/lib/supabase/server';
const supabase = createAdminClient();
const { data } = await supabase.from('Vehicle').select('*');  // ✅ Works
```

**For authentication:**

```typescript
// Regular client for auth (uses cookies)
import { createClient } from '~/lib/supabase/server';
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();  // ✅ Works
```

---

## 🧪 Testing

### Test 1: Client-Side Should Fail (Good!)

Open browser console on your site:

```javascript
// This should FAIL after RLS
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  'your-url', 
  'your-anon-key'
);
const { data, error } = await supabase.from('Vehicle').select('*');
console.log(error); // "permission denied" - Perfect!
```

### Test 2: Your API Should Work

```bash
# Your tRPC endpoints should work normally
curl http://localhost:3000/api/trpc/vehicles.getAll
```

---

## 📋 What Gets Protected

After running the RLS script:

```
✅ Country
✅ User  
✅ SteeringType
✅ Make
✅ Model
✅ Collection
✅ Vehicle
✅ Media
✅ VehicleSource
✅ VehicleSpecification
✅ VehicleCollection
```

All these tables will only be accessible via:
- Your server-side code (SERVICE_ROLE)
- Supabase Dashboard (uses service role)
- Your Prisma client (uses DATABASE_URL)

---

## 🎉 That's It!

Your database is now secure:
- ❌ No direct client access
- ✅ All access through your API
- ✅ Full server-side control

For detailed information, see `SUPABASE_RLS_GUIDE.md`.
