# Server Types

Centralized type definitions for the backend layer.

## Structure

```
types/
├── index.ts          # Re-exports all types (import from here)
├── common.ts         # Pagination, sorting, filtering patterns
├── database.ts       # DB client and repository types
├── vehicle.ts        # Vehicle-related types
├── deal.ts           # Deal-related types
├── user.ts           # User-related types
└── email.ts          # Email-related types
```

## Usage

**Always import from the index file:**

```typescript
// ✅ GOOD
import { ListParams, VehicleWithRelations, DealWithDetails } from "~/server/types";

// ❌ BAD
import { ListParams } from "~/server/types/common";
import { VehicleWithRelations } from "~/server/types/vehicle";
```

## Benefits

- ✅ **Single source of truth** - Types defined once, used everywhere
- ✅ **Better consistency** - Same patterns across all services
- ✅ **Easier refactoring** - Update type in one place
- ✅ **Clear documentation** - Types grouped by domain
- ✅ **Type safety** - Compile-time validation across layers

## Guidelines

### When to Add New Types

1. **Domain Types** - Add to respective domain file (`vehicle.ts`, `deal.ts`, etc.)
2. **Common Patterns** - Add to `common.ts` if used across multiple domains
3. **Database Types** - Add to `database.ts` if related to DB operations

### Type Naming Conventions

- **Parameters**: `[Action][Entity]Params` (e.g., `CreateDealParams`)
- **Results**: `[Action][Entity]Result` (e.g., `SendDealResult`)
- **Lists**: `List[Entity]Params/Result` (e.g., `ListVehiclesResult`)
- **With Relations**: `[Entity]WithRelations` or `[Entity]WithDetails`
- **Summary**: `[Entity]Summary` (for list views)
- **Filters**: `[Entity]Filters` (for filtering options)

### Migration from Services

When refactoring, move types from services to shared types:

```typescript
// Before (in service file)
export interface CreateDealParams { ... }

// After (in types/deal.ts)
export interface CreateDealParams { ... }

// Service imports it
import { CreateDealParams } from "~/server/types";
```

## Examples

### Common Patterns

```typescript
import { ListParams, PaginationResult } from "~/server/types";

// Use in service
async function listItems(params: ListParams): Promise<PaginationResult<Item>> {
  // ...
}
```

### Domain-Specific Types

```typescript
import { VehicleWithRelations, DealWithDetails } from "~/server/types";

const vehicle: VehicleWithRelations = await repository.findById(id);
const deal: DealWithDetails = await repository.findByIdWithDetails(dealId);
```

### Database Operations

```typescript
import { DbClient, FindManyOptions } from "~/server/types";

class MyRepository {
  constructor(private db: DbClient) {}
  
  async findMany(options: FindManyOptions) {
    // ...
  }
}
```

