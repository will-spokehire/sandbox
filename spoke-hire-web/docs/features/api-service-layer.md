# API Service Layer Architecture

## Overview

The SpokeHire API has been refactored to use a **Service Layer Pattern** for better code organization, maintainability, and testability. This document explains the new architecture and how to work with it.

---

## Architecture Layers

### 1. **Router Layer** (`src/server/api/routers/`)
**Responsibility:** Handle HTTP/tRPC concerns only

- Validate input (Zod schemas)
- Call service methods
- Return responses
- Handle tRPC-specific concerns

**Example:**
```typescript
export const vehicleRouter = createTRPCRouter({
  list: adminProcedure
    .input(listVehiclesInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new VehicleService(ctx.db);
      return await service.listVehicles(input);
    }),
});
```

### 2. **Service Layer** (`src/server/api/services/`)
**Responsibility:** Business logic and orchestration

- Coordinate between repositories
- Implement business rules
- Handle caching
- Call external services (geocoding, etc.)
- Orchestrate complex operations

**Example:**
```typescript
export class VehicleService {
  async listVehicles(params: ListVehiclesParams) {
    // 1. Geocode if needed
    const location = await this.geocodeLocation(params);
    
    // 2. Build filters
    const filters = this.buildFilters(params);
    
    // 3. Fetch data via repository
    const vehicles = await this.repository.findMany(filters);
    
    // 4. Cache results
    this.cacheResults(vehicles);
    
    return vehicles;
  }
}
```

### 3. **Repository Layer** (`src/server/api/repositories/`)
**Responsibility:** Data access only

- Execute Prisma queries
- Handle database operations
- No business logic
- Return raw data

**Example:**
```typescript
export class VehicleRepository {
  async findMany(where: Prisma.VehicleWhereInput) {
    return await this.db.vehicle.findMany({
      where,
      include: { make: true, model: true },
    });
  }
}
```

### 4. **Query Builder Layer** (`src/server/api/builders/`)
**Responsibility:** Construct complex queries

- Build SQL queries (especially PostGIS)
- Construct Prisma where clauses
- Handle dynamic query building

**Example:**
```typescript
export class VehicleQueryBuilder {
  buildDistanceQuery(params: DistanceQueryParams): Prisma.Sql {
    return Prisma.sql`
      SELECT v.*, (${distanceSQL}) as distance
      FROM "Vehicle" v
      WHERE ${conditions}
    `;
  }
}
```

---

## How to Add a New Feature

### Example: Add "Get Vehicle by Registration" endpoint

#### Step 1: Add Repository Method
```typescript
// src/server/api/repositories/vehicle.repository.ts
async findByRegistration(registration: string) {
  try {
    return await this.db.vehicle.findFirst({
      where: { registration },
      include: { make: true, model: true },
    });
  } catch (error) {
    throw new DatabaseError("Failed to fetch vehicle", error);
  }
}
```

#### Step 2: Add Service Method
```typescript
// src/server/api/services/vehicle.service.ts
async getVehicleByRegistration(registration: string) {
  // Check cache first
  const cacheKey = CacheKeys.vehicleByReg(registration);
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  // Fetch from database
  const vehicle = await this.repository.findByRegistration(registration);
  
  if (!vehicle) {
    throw new VehicleNotFoundError(registration);
  }

  // Cache result
  cacheService.set(cacheKey, vehicle, CacheTTL.MEDIUM);
  
  return vehicle;
}
```

#### Step 3: Add Router Endpoint
```typescript
// src/server/api/routers/vehicle.ts
getByRegistration: adminProcedure
  .input(z.object({ registration: z.string() }))
  .query(async ({ ctx, input }) => {
    const service = new VehicleService(ctx.db);
    return await service.getVehicleByRegistration(input.registration);
  }),
```

#### Step 4: Use in Frontend
```typescript
// Frontend component
const { data: vehicle } = api.vehicle.getByRegistration.useQuery({
  registration: "ABC123",
});
```

---

## How to Add a New Router

### Example: Add Collection Management Router

#### Step 1: Create Repository
```typescript
// src/server/api/repositories/collection.repository.ts
export class CollectionRepository {
  constructor(private db: DbClient) {}

  async findAll() {
    return await this.db.collection.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  async create(data: CreateCollectionInput) {
    return await this.db.collection.create({ data });
  }
}
```

#### Step 2: Create Service
```typescript
// src/server/api/services/collection.service.ts
export class CollectionService {
  private repository: CollectionRepository;

  constructor(private db: DbClient) {
    this.repository = new CollectionRepository(db);
  }

  async listCollections() {
    // Check cache
    const cached = cacheService.get(CacheKeys.collections());
    if (cached) return cached;

    // Fetch from DB
    const collections = await this.repository.findAll();

    // Cache
    cacheService.set(CacheKeys.collections(), collections, CacheTTL.LONG);

    return collections;
  }

  async createCollection(data: CreateCollectionInput) {
    const collection = await this.repository.create(data);
    
    // Invalidate caches
    cacheService.delete(CacheKeys.collections());
    cacheService.delete(CacheKeys.vehicleFilterOptions());
    
    return collection;
  }
}
```

#### Step 3: Create Router
```typescript
// src/server/api/routers/collection.ts
export const collectionRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    const service = new CollectionService(ctx.db);
    return await service.listCollections();
  }),

  create: adminProcedure
    .input(createCollectionSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new CollectionService(ctx.db);
      return await service.createCollection(input);
    }),
});
```

#### Step 4: Register in Root Router
```typescript
// src/server/api/root.ts
import { collectionRouter } from "./routers/collection";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  vehicle: vehicleRouter,
  collection: collectionRouter, // Add here
});
```

---

## Error Handling

### Using Custom Errors

```typescript
import {
  VehicleNotFoundError,
  ValidationError,
  DatabaseError,
} from "~/server/api/errors/app-errors";

// In service
if (!vehicle) {
  throw new VehicleNotFoundError(id);
}

// In repository
try {
  return await this.db.vehicle.findUnique({ where: { id } });
} catch (error) {
  throw new DatabaseError("Failed to fetch vehicle", error);
}
```

### Creating New Error Types

```typescript
// src/server/api/errors/app-errors.ts
export class CustomError extends TRPCError {
  constructor(message: string) {
    super({
      code: "BAD_REQUEST",
      message: `Custom error: ${message}`,
    });
  }
}
```

---

## Caching

### Using the Cache Service

```typescript
import { cacheService, CacheKeys, CacheTTL } from "~/server/api/services/cache.service";

// Get from cache
const data = cacheService.get<MyType>(CacheKeys.myData());

// Set in cache
cacheService.set(CacheKeys.myData(), data, CacheTTL.MEDIUM);

// Invalidate by pattern
cacheService.invalidateByPattern("vehicle:");

// Delete specific key
cacheService.delete(CacheKeys.myData());

// Clear all
cacheService.clear();
```

### Adding New Cache Keys

```typescript
// src/server/api/services/cache.service.ts
export const CacheKeys = {
  // ... existing keys
  myNewKey: (id: string) => `my-feature:${id}`,
  myListKey: () => 'my-feature:list',
} as const;
```

---

## Testing

### Unit Testing Services

```typescript
import { VehicleService } from "~/server/api/services/vehicle.service";

describe('VehicleService', () => {
  let service: VehicleService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      vehicle: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    service = new VehicleService(mockDb);
  });

  it('should list vehicles', async () => {
    mockDb.vehicle.findMany.mockResolvedValue([{ id: '1' }]);
    
    const result = await service.listVehicles({ limit: 10 });
    
    expect(result.vehicles).toHaveLength(1);
    expect(mockDb.vehicle.findMany).toHaveBeenCalled();
  });
});
```

### Integration Testing Routers

```typescript
import { createCaller } from "~/server/api/root";

describe('Vehicle Router', () => {
  it('should return vehicles', async () => {
    const ctx = await createContext();
    const caller = createCaller(ctx);
    
    const result = await caller.vehicle.list({ limit: 10 });
    
    expect(result.vehicles).toBeDefined();
  });
});
```

---

## Best Practices

### ✅ Do

- Keep routers thin (just input validation and service calls)
- Put business logic in services
- Put data access in repositories
- Use custom error classes
- Cache expensive operations
- Invalidate caches after mutations
- Use TypeScript types everywhere
- Document complex logic

### ❌ Don't

- Put business logic in routers
- Put business logic in repositories
- Access database directly from routers
- Use generic errors (use custom error classes)
- Forget to invalidate caches
- Mix concerns between layers
- Use `any` type (use proper types)

---

## Common Patterns

### Pattern 1: List with Filters
```typescript
// Service
async listWithFilters(params: FilterParams) {
  const filters = this.buildFilters(params);
  const data = await this.repository.findMany(filters);
  return this.formatResults(data);
}
```

### Pattern 2: Get by ID with Cache
```typescript
// Service
async getById(id: string) {
  const cacheKey = CacheKeys.detail(id);
  const cached = cacheService.get(cacheKey);
  if (cached) return cached;

  const data = await this.repository.findById(id);
  cacheService.set(cacheKey, data, CacheTTL.SHORT);
  return data;
}
```

### Pattern 3: Create with Cache Invalidation
```typescript
// Service
async create(input: CreateInput) {
  const created = await this.repository.create(input);
  
  // Invalidate related caches
  cacheService.invalidateByPattern("list:");
  cacheService.delete(CacheKeys.filterOptions());
  
  return created;
}
```

### Pattern 4: Update with Validation
```typescript
// Service
async update(id: string, input: UpdateInput) {
  // Validate exists
  const existing = await this.repository.findById(id);
  if (!existing) {
    throw new NotFoundError(id);
  }

  // Update
  const updated = await this.repository.update(id, input);
  
  // Invalidate caches
  cacheService.delete(CacheKeys.detail(id));
  
  return updated;
}
```

---

## Migration from Old Code

### Old Pattern (Monolithic Router)
```typescript
export const vehicleRouter = createTRPCRouter({
  list: adminProcedure
    .input(schema)
    .query(async ({ ctx, input }) => {
      // 400 lines of logic here
      const vehicles = await ctx.db.vehicle.findMany({ ... });
      // More logic
      return vehicles;
    }),
});
```

### New Pattern (Service Layer)
```typescript
// Router (thin)
export const vehicleRouter = createTRPCRouter({
  list: adminProcedure
    .input(schema)
    .query(async ({ ctx, input }) => {
      const service = new VehicleService(ctx.db);
      return await service.listVehicles(input);
    }),
});

// Service (business logic)
export class VehicleService {
  async listVehicles(params) {
    // Business logic here
    return await this.repository.findMany(filters);
  }
}

// Repository (data access)
export class VehicleRepository {
  async findMany(filters) {
    return await this.db.vehicle.findMany(filters);
  }
}
```

---

## Troubleshooting

### Issue: Type errors with PrismaClient
**Solution:** Use `any` for DbClient type in services/repositories (already done)

### Issue: Cache not invalidating
**Solution:** Check cache key patterns and use `invalidateByPattern()`

### Issue: Service not found
**Solution:** Make sure to import from correct path: `~/server/api/services/...`

### Issue: Error not caught properly
**Solution:** Use custom error classes from `~/server/api/errors/app-errors`

---

## Resources

- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Service Layer Pattern](https://martinfowler.com/eaaCatalog/serviceLayer.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

**Last Updated:** October 6, 2025  
**Version:** 1.0  
**Status:** Production Ready
