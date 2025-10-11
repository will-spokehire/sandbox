# Reusable Filter Architecture

## Overview

The SpokeHire admin interface implements a reusable filter architecture that provides consistent, type-safe filter state management across all list pages (vehicles, deals, users, etc.). This system uses URL search parameters as the single source of truth, making filters shareable and bookmarkable.

## Architecture

### Core Components

1. **Generic URL Filters Hook** (`useURLFilters`)
2. **Filter Schema Builder** (`createFilterSchema`)
3. **Generic Filter Context** (`FilterProvider`)
4. **Vehicle-Specific Implementation** (`useVehicleFiltersV2`)
5. **Deal-Specific Implementation** (`useDealFilters`)

## Implementation

### 1. Generic URL Filters Hook

**Location**: `src/hooks/useURLFilters.ts`

The foundation of the system. Provides URL-based state management for any filter type:

```typescript
import { useURLFilters, createFilterSchema } from "~/hooks/useURLFilters";

const { filters, updateFilters, clearFilters, hasActiveFilters } = useURLFilters(
  schema,      // Zod schema for validation
  defaults,    // Default filter values
  basePath     // Base URL path (e.g., "/admin/vehicles")
);
```

**Features**:
- Type-safe filter state with Zod validation
- URL search parameters as single source of truth
- Automatic URL serialization/deserialization
- Default value handling
- Filter change detection

### 2. Filter Schema Builder

**Location**: `src/hooks/useURLFilters.ts`

Helper functions to create common filter patterns:

```typescript
import { createFilterSchema } from "~/hooks/useURLFilters";

const myFiltersSchema = createFilterSchema.combine(
  createFilterSchema.search(),     // Adds search field
  createFilterSchema.pagination(), // Adds page field
  createFilterSchema.sorting(),    // Adds sortBy/sortOrder fields
  createFilterSchema.viewMode(),   // Adds viewMode field
  z.object({
    // Your custom filters
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
    categoryIds: z.array(z.string()).default([]),
    dateRange: z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }).optional(),
  })
);
```

**Available Schema Builders**:
- `search()` - Adds search field
- `pagination()` - Adds page field
- `sorting()` - Adds sortBy/sortOrder fields
- `viewMode()` - Adds viewMode field
- `combine()` - Combines multiple schemas

### 3. Generic Filter Context

**Location**: `src/contexts/FilterContext.tsx`

Provides filter state to all child components, eliminating props drilling:

```typescript
import { FilterProvider } from "~/contexts";

<FilterProvider
  schema={myFiltersSchema}
  defaults={defaultMyFilters}
  basePath="/admin/my-page"
>
  <MyFilters />
  <MyListTable />
</FilterProvider>
```

**Usage in Components**:

```typescript
import { useFilterContext } from "~/contexts";

function MyFilters() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterContext<MyFilters>();
  
  return (
    <div>
      <input 
        value={filters.search ?? ""}
        onChange={(e) => updateFilters({ search: e.target.value })}
      />
      <button onClick={clearFilters}>Clear All</button>
    </div>
  );
}
```

### 4. Vehicle-Specific Implementation

**Location**: `src/hooks/useVehicleFiltersV2.ts`

Example implementation for the vehicles list page:

```typescript
export const vehicleFiltersSchema = createFilterSchema.combine(
  createFilterSchema.search(),
  createFilterSchema.pagination(),
  createFilterSchema.sorting(),
  createFilterSchema.viewMode(),
  z.object({
    // Vehicle-specific filters
    status: z.enum(["DRAFT", "PUBLISHED", "DECLINED", "ARCHIVED", "ALL"]).default("PUBLISHED"),
    makeIds: z.array(z.string()).default([]),
    modelId: z.string().optional(),
    collectionIds: z.array(z.string()).default([]),
    exteriorColors: z.array(z.string()).default([]),
    interiorColors: z.array(z.string()).default([]),
    yearFrom: z.string().optional(),
    yearTo: z.string().optional(),
    numberOfSeats: z.array(z.number()).default([]),
    gearboxTypes: z.array(z.string()).default([]),
    steeringIds: z.array(z.string()).default([]),
    countryIds: z.array(z.string()).default([]),
    counties: z.array(z.string()).default([]),
    postcode: z.string().optional(),
    maxDistance: z.number().optional(),
    sortByDistance: z.boolean().default(false),
  })
);

export function useVehicleFiltersV2() {
  return useURLFilters(
    vehicleFiltersSchema,
    defaultVehicleFilters,
    "/admin/vehicles"
  );
}
```

### 5. Deal-Specific Implementation

**Location**: `src/hooks/useDealFilters.ts`

Example implementation for the deals list page:

```typescript
export const dealFiltersSchema = createFilterSchema.combine(
  createFilterSchema.search(),
  createFilterSchema.pagination(),
  createFilterSchema.sorting(),
  createFilterSchema.viewMode(),
  z.object({
    // Deal-specific filters
    status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED", "ALL"]).default("ALL"),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    location: z.string().optional(),
    feeRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    createdById: z.string().optional(),
    vehicleCountRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  })
);

export function useDealFilters() {
  return useURLFilters(
    dealFiltersSchema,
    defaultDealFilters,
    "/admin/deals"
  );
}
```

## Migration Guide

### From Old VehicleFilters to New System

1. **Replace the old context**:
   ```typescript
   // Old
   <VehicleFiltersProvider>
     <VehiclesPageContent />
   </VehicleFiltersProvider>
   
   // New
   <FilterProvider
     schema={vehicleFiltersSchema}
     defaults={defaultVehicleFilters}
     basePath="/admin/vehicles"
   >
     <VehiclesPageContent />
   </FilterProvider>
   ```

2. **Update component hooks**:
   ```typescript
   // Old
   const { filters, updateFilters } = useVehicleFiltersContext();
   
   // New
   const { filters, updateFilters } = useVehicleFilterContext();
   ```

3. **Update filter components**:
   ```typescript
   // Old - 51 props
   <VehicleFilters
     search={filters.search}
     status={filters.status}
     makeIds={filters.makeIds}
     // ... 48 more props
   />
   
   // New - 0 props
   <VehicleFilters />
   ```

## Usage Examples

### 1. Creating a New Filter Schema

```typescript
// hooks/useUserFilters.ts
export const userFiltersSchema = createFilterSchema.combine(
  createFilterSchema.search(),
  createFilterSchema.pagination(),
  z.object({
    role: z.enum(["ADMIN", "USER", "ALL"]).default("ALL"),
    status: z.enum(["ACTIVE", "INACTIVE", "ALL"]).default("ALL"),
    createdAfter: z.string().optional(),
    createdBefore: z.string().optional(),
  })
);

export function useUserFilters() {
  return useURLFilters(
    userFiltersSchema,
    defaultUserFilters,
    "/admin/users"
  );
}
```

### 2. Using in a Page Component

```typescript
// app/admin/users/page.tsx
import { FilterProvider } from "~/contexts";
import { userFiltersSchema, defaultUserFilters } from "~/hooks/useUserFilters";

export default function UsersPage() {
  return (
    <FilterProvider
      schema={userFiltersSchema}
      defaults={defaultUserFilters}
      basePath="/admin/users"
    >
      <UsersPageContent />
    </FilterProvider>
  );
}

function UsersPageContent() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useUserFilterContext();
  
  return (
    <div>
      <UserFilters />
      <UserListTable />
    </div>
  );
}
```

### 3. Using in Filter Components

```typescript
// components/UserFilters.tsx
import { useUserFilterContext } from "~/contexts";

export function UserFilters() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useUserFilterContext();
  
  return (
    <div className="space-y-4">
      <input
        value={filters.search ?? ""}
        onChange={(e) => updateFilters({ search: e.target.value })}
        placeholder="Search users..."
      />
      
      <select
        value={filters.role}
        onChange={(e) => updateFilters({ role: e.target.value as any })}
      >
        <option value="ALL">All Roles</option>
        <option value="ADMIN">Admin</option>
        <option value="USER">User</option>
      </select>
      
      {hasActiveFilters && (
        <button onClick={clearFilters}>
          Clear All Filters
        </button>
      )}
    </div>
  );
}
```

## Benefits

### 1. Eliminates Props Drilling
- No more passing 50+ props through multiple component levels
- Clean component interfaces
- Better performance (context subscribers only re-render when needed)

### 2. Type Safety
- Full TypeScript support with Zod validation
- Compile-time error checking
- IntelliSense support for filter properties

### 3. Reusability
- Same pattern works for any list page
- Consistent UX patterns across all list pages
- Easy to add new filters or modify existing ones

### 4. URL State Management
- Filters are shareable and bookmarkable
- Browser back/forward works automatically
- State persists across page refreshes

### 5. Maintainability
- Centralized filter logic
- Easy to test in isolation
- Clear separation of concerns

## Best Practices

### 1. Use the Generic `FilterProvider`
Instead of creating page-specific contexts, use the generic `FilterProvider` for consistency.

### 2. Define Schemas with Zod
Always use Zod schemas for validation and type safety:

```typescript
const myFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  // ... other filters
});
```

### 3. Use `createFilterSchema.combine()`
Compose common patterns using the schema builder:

```typescript
const schema = createFilterSchema.combine(
  createFilterSchema.search(),
  createFilterSchema.pagination(),
  createFilterSchema.sorting(),
  myCustomFilters
);
```

### 4. Keep Default Values Simple
Avoid complex nested objects in default values:

```typescript
// ✅ Good
const defaults = {
  search: undefined,
  status: "ACTIVE",
  categoryIds: [],
};

// ❌ Bad
const defaults = {
  search: undefined,
  status: "ACTIVE",
  complexFilter: {
    nested: {
      value: "default"
    }
  }
};
```

### 5. Use Context Hooks in Components
Always use the context hooks instead of props drilling:

```typescript
// ✅ Good
const { filters, updateFilters } = useUserFilterContext();

// ❌ Bad
function UserFilters({ filters, updateFilters, clearFilters, hasActiveFilters }) {
  // Props drilling
}
```

### 6. Test Filter Combinations
Ensure URL state works correctly with various filter combinations:

```typescript
// Test that URL updates correctly
updateFilters({ search: "test", status: "ACTIVE" });
// Should result in: /admin/users?search=test&status=ACTIVE
```

## Future Enhancements

1. **Filter Presets**: Save and load common filter combinations
2. **Advanced Filtering**: Date ranges, number ranges, multi-select with search
3. **Filter Analytics**: Track which filters are used most
4. **Export Filters**: Export filtered data with current filter state
5. **Filter History**: Remember recent filter combinations

## Related Documentation

- [Error Handling](./error-handling.md) - Comprehensive error handling system
- [Mutation Handlers](./mutation-handlers.md) - Centralized mutation management
- [Context API Usage](./context-api.md) - State management patterns
