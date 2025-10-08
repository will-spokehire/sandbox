# Database Optimization Strategies

**Purpose:** Advanced database optimization techniques for SpokeHire  
**Last Updated:** October 2025

---

## Overview

This document covers advanced database optimization strategies beyond basic performance tuning, including the N+1 query problem with Supabase and strategies for handling cloud database latency.

---

## The N+1 Query Problem with Supabase

### Problem Description

When using Prisma with cloud databases like Supabase, the N+1 query problem becomes significantly worse due to network latency.

**Scenario:** Fetching a vehicle with all its relations

```typescript
// This query executes SEQUENTIALLY
const vehicle = await ctx.db.vehicle.findUnique({
  where: { id },
  include: {
    make: true,           // Query 1
    model: true,          // Query 2
    owner: {...},         // Query 3
    steering: true,       // Query 4
    media: {...},         // Query 5
    sources: {...},       // Query 6
    specifications: {...},// Query 7
    collections: {...},   // Query 8-9
  },
});
```

**Timeline (Sequential):**
```
Query 1 ━━━━━ (150ms network latency)
         Query 2 ━━━━━ (150ms)
                  Query 3 ━━━━━ (150ms)
                           Query 4 ━━━━━ (150ms)
                                    ... etc
Total: 10 queries × 150ms = 1,500ms ❌
```

### Why This Happens with Supabase

1. **Network Latency:** Each query requires a round trip to Supabase servers
   - Even with connection pooling (port 6543)
   - Each round trip: ~80-150ms
   - 10 queries = 800-1,500ms just in network time!

2. **Prisma's Query Strategy:** 
   - By default, Prisma executes relation queries sequentially
   - This is the classic "N+1 query problem"
   - Works fine for local databases (low latency < 5ms)
   - Terrible for cloud databases (high latency > 50ms)

3. **Connection Pooling Helps But Doesn't Solve It:**
   - Port 6543 (pooled) vs 5432 (direct) helps with connection overhead
   - But doesn't reduce the number of round trips
   - Still 10 separate network calls

### Solution: Parallel Query Execution

Instead of one query with many `include` statements, use **`Promise.all()`** to execute multiple queries **in parallel**.

**Before (Sequential):**
```typescript
// 10 sequential queries - Total: ~1,100ms
const vehicle = await ctx.db.vehicle.findUnique({
  where: { id },
  include: {
    make: true,
    model: true,
    owner: {...},
    steering: true,
    media: {...},
    sources: {...},
    specifications: {...},
    collections: {...},
  },
});
```

**After (Parallel):**
```typescript
// 5 parallel queries - Total: ~300-400ms
const [vehicle, media, sources, specifications, collections] = 
  await Promise.all([
    ctx.db.vehicle.findUnique({
      where: { id },
      include: {
        make: true,      // Joined in same query
        model: true,     // Joined in same query
        owner: {...},    // Joined in same query
        steering: true,  // Joined in same query
      },
    }),
    ctx.db.media.findMany({ 
      where: { vehicleId: id },
      take: 100,
    }),
    ctx.db.vehicleSource.findMany({ 
      where: { vehicleId: id },
      take: 20,
    }),
    ctx.db.vehicleSpecification.findMany({ 
      where: { vehicleId: id },
      take: 200,
    }),
    ctx.db.vehicleCollection.findMany({ 
      where: { vehicleId: id },
      include: { collection: true },
    }),
  ]);

// Merge results
return {
  ...vehicle,
  media,
  sources,
  specifications,
  collections,
};
```

**Timeline (Parallel):**
```
Query 1 (vehicle + 4 joins) ━━━━━━━━━━━━━ (300ms)
Query 2 (media)             ━━━━━ (150ms)
Query 3 (sources)           ━━━━━ (150ms)
Query 4 (specifications)    ━━━━━ (150ms)
Query 5 (collections)       ━━━━━ (150ms)

Total: max(300, 150, 150, 150, 150) = 300ms ✅
```

### Performance Improvement

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Network Round Trips | 10 sequential | 5 parallel | 50% fewer |
| Execution Time | 1,102ms | ~300-400ms | **70% faster** ✅ |
| Database Load | 10 queries | 5 queries | 50% less |

### Implementation Example

From `src/server/api/routers/vehicle.ts`:

```typescript
getById: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    // Parallel execution
    const [vehicle, media, sources, specifications, collections] = 
      await Promise.all([
        ctx.db.vehicle.findUnique({
          where: { id: input.id },
          include: {
            make: true,
            model: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            steering: true,
          },
        }),
        ctx.db.media.findMany({
          where: { vehicleId: input.id },
          orderBy: { order: 'asc' },
          take: 100,
        }),
        ctx.db.vehicleSource.findMany({
          where: { vehicleId: input.id },
          include: { source: true },
          take: 20,
        }),
        ctx.db.vehicleSpecification.findMany({
          where: { vehicleId: input.id },
          orderBy: { category: 'asc' },
          take: 200,
        }),
        ctx.db.vehicleCollection.findMany({
          where: { vehicleId: input.id },
          include: { collection: true },
        }),
      ]);

    if (!vehicle) throw new TRPCError({ code: 'NOT_FOUND' });

    return {
      ...vehicle,
      media,
      sources,
      specifications,
      collections,
    };
  }),
```

---

## Connection Pooling

Even with parallel queries, connection pooling is essential for cloud databases.

### Why Connection Pooling Matters

```env
# GOOD: Pooled connection (port 6543)
DATABASE_URL="postgres://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true"

# BAD: Direct connection (port 5432)
DATABASE_URL="postgres://user:pass@db.xxx.supabase.co:5432/postgres"
```

**Why?**
- Port 6543 (pooled): Reuses existing connections (~5-10ms overhead)
- Port 5432 (direct): Creates new connections (~50-100ms overhead)

With 5 parallel queries:
- Pooled: 5 × 10ms = 50ms connection overhead
- Direct: 5 × 75ms = 375ms connection overhead
- **Savings: 325ms** ⚡

### Configuration

```env
# Connection pooling for app queries
DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection for migrations only
DIRECT_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"
```

---

## Alternative Optimization Strategies

### Option A: Raw SQL with Joins

**Pros:** Fastest possible (single query)  
**Cons:** Complex SQL, harder to maintain

```typescript
const result = await ctx.db.$queryRaw`
  SELECT 
    v.*,
    m.name as make_name,
    mo.name as model_name,
    u.first_name as owner_first_name,
    -- ... more fields
  FROM "Vehicle" v
  LEFT JOIN "Make" m ON v."makeId" = m.id
  LEFT JOIN "Model" mo ON v."modelId" = mo.id
  LEFT JOIN "User" u ON v."ownerId" = u.id
  WHERE v.id = ${id}
`;
```

**Performance:** ~150-200ms (single query)

### Option B: Prisma relationJoins (Preview Feature)

**Pros:** Clean API, forces joins  
**Cons:** Still in preview, may have limitations

```typescript
// Requires Prisma 5.8+ with preview feature
const vehicle = await ctx.db.vehicle.findUnique({
  relationJoins: true,  // Forces left joins
  where: { id },
  include: { make: true, model: true, ... },
});
```

Requires `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}
```

### Option C: DataLoader Pattern

**Pros:** Great for GraphQL/batch requests  
**Cons:** Overkill for single requests

```typescript
import DataLoader from 'dataloader';

const vehicleLoader = new DataLoader(async (ids) => {
  const vehicles = await ctx.db.vehicle.findMany({
    where: { id: { in: ids } },
  });
  
  // Return in same order as requested
  return ids.map(id => 
    vehicles.find(v => v.id === id)
  );
});

// Batch multiple requests
const [v1, v2, v3] = await Promise.all([
  vehicleLoader.load(id1),
  vehicleLoader.load(id2),
  vehicleLoader.load(id3),
]);
```

---

## When to Use Each Strategy

### Use Parallel Queries (`Promise.all()`)
✅ Working with cloud databases (Supabase, PlanetScale, etc.)  
✅ Query has multiple independent relations  
✅ Relations don't depend on each other  
✅ Network latency is significant (>50ms per query)

**Use for:** `getById`, complex list queries

### Don't Use Parallel Queries
❌ Local databases (low latency < 5ms)  
❌ Dependent queries (one needs result of another)  
❌ Single relation queries (no benefit)

### Use Raw SQL
✅ Absolute maximum performance needed  
✅ Complex joins that Prisma doesn't handle well  
✅ Custom aggregations

**Use for:** Analytics, reports, complex searches

### Use DataLoader
✅ GraphQL APIs  
✅ Batch requests (loading many entities at once)  
✅ Avoiding duplicate requests

**Use for:** GraphQL resolvers, batch operations

---

## Index Optimization

Proper indexing is crucial for query performance.

### Composite Indexes

For queries filtering by multiple fields:

```sql
-- Efficient for: WHERE status = 'PUBLISHED' ORDER BY createdAt DESC
CREATE INDEX idx_vehicle_status_created 
ON "Vehicle"(status, "createdAt" DESC);

-- Efficient for: WHERE status = 'PUBLISHED' AND year = 2024
CREATE INDEX idx_vehicle_status_year 
ON "Vehicle"(status, year);
```

### Full-Text Search Indexes

For text search:

```sql
-- GIN index for full-text search on name
CREATE INDEX idx_vehicle_search_name 
ON "Vehicle" USING GIN(to_tsvector('english', name));

-- Search query
SELECT * FROM "Vehicle" 
WHERE to_tsvector('english', name) @@ plainto_tsquery('english', 'Tesla Model');
```

### Covering Indexes

Include commonly selected columns:

```sql
-- Covers: SELECT id, name, price WHERE status = 'PUBLISHED'
CREATE INDEX idx_vehicle_status_covering 
ON "Vehicle"(status) INCLUDE (id, name, price);
```

---

## Query Optimization Checklist

When optimizing slow queries:

1. **Measure First**
   - [ ] Enable query logging
   - [ ] Identify slow queries (>500ms)
   - [ ] Measure baseline performance

2. **Check N+1 Queries**
   - [ ] Count number of queries executed
   - [ ] Look for sequential relation loading
   - [ ] Consider parallel execution

3. **Verify Indexes**
   - [ ] Check EXPLAIN ANALYZE output
   - [ ] Ensure indexes exist for WHERE clauses
   - [ ] Verify composite indexes for multi-field queries

4. **Optimize Relations**
   - [ ] Add `take` limits on relations
   - [ ] Select only needed fields
   - [ ] Consider separate queries vs includes

5. **Use Connection Pooling**
   - [ ] Verify port 6543 (pooled) in use
   - [ ] Check connection_limit setting
   - [ ] Monitor connection usage

6. **Implement Caching**
   - [ ] Server-side caching for expensive queries
   - [ ] Client-side caching with staleTime
   - [ ] Cache invalidation strategy

7. **Test and Monitor**
   - [ ] Measure after optimization
   - [ ] Monitor in production
   - [ ] Set up alerts for slow queries

---

## Monitoring & Debugging

### Enable Query Logging

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}
```

### Check Query Performance

In Supabase dashboard:
1. Go to **Reports** → **Database**
2. View slow queries
3. Check index usage

### Analyze Query Plans

```sql
EXPLAIN ANALYZE
SELECT * FROM "Vehicle"
WHERE status = 'PUBLISHED'
ORDER BY "createdAt" DESC
LIMIT 50;
```

Look for:
- **Seq Scan** → Add index
- **Index Scan** → Good!
- **High cost** → Optimize query

---

## Summary

**Best Practices for Supabase:**
1. ✅ Use connection pooling (port 6543)
2. ✅ Execute independent queries in parallel with `Promise.all()`
3. ✅ Add appropriate database indexes
4. ✅ Limit relations with `take`
5. ✅ Implement caching for expensive queries
6. ✅ Monitor query performance regularly

**Expected Results:**
- API responses < 1 second
- Database load reduced 50-70%
- Better user experience
- Lower infrastructure costs

---

## Related Documentation

- [Performance Optimizations](../features/performance.md) - Overall performance guide
- [Supabase Setup](../setup/supabase-setup.md) - Connection configuration
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization) - Official docs

---

**Remember:** Optimize based on measurements, not assumptions. Always profile before and after optimization to verify improvements.

