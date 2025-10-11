# Mutation Handlers

## Overview

The SpokeHire admin interface implements centralized mutation handlers that encapsulate all mutation logic with proper error handling, success notifications, and query invalidation. This system provides a consistent and maintainable approach to handling data mutations across the application.

## Architecture

### Core Components

1. **Vehicle Mutations Hook** (`useVehicleMutations`)
2. **Deal Mutations Hook** (`useDealMutations`)
3. **Query Invalidation Helper** (`useInvalidateQueries`)
4. **Mutation Hook Barrel Export** (`mutations/index.ts`)

## Implementation

### 1. Vehicle Mutations Hook

**Location**: `src/hooks/useVehicleMutations.ts`

Encapsulates all vehicle-related mutations with proper error handling:

```typescript
import { useVehicleMutations } from "~/hooks/mutations";

const { 
  archive, 
  publish, 
  decline, 
  deleteVehicle, 
  updateStatus,
  archiveBulk,
  publishBulk,
  isUpdatingStatus,
  isDeleting,
  isAnyPending 
} = useVehicleMutations();

// Archive a vehicle
await archive("vehicle-id");

// Publish a vehicle
await publish("vehicle-id");

// Bulk operations
await archiveBulk(["vehicle1", "vehicle2", "vehicle3"]);
```

**Available Mutations**:
- `archive(vehicleId)` - Archive a vehicle
- `publish(vehicleId)` - Publish a vehicle
- `decline(vehicleId)` - Decline a vehicle
- `deleteVehicle(vehicleId)` - Delete a vehicle
- `updateStatus(vehicleId, status)` - Update vehicle status
- `archiveBulk(vehicleIds)` - Archive multiple vehicles
- `publishBulk(vehicleIds)` - Publish multiple vehicles

**Loading States**:
- `isUpdatingStatus` - Status update in progress
- `isDeleting` - Deletion in progress
- `isAnyPending` - Any mutation in progress

### 2. Deal Mutations Hook

**Location**: `src/hooks/useDealMutations.ts`

Encapsulates all deal-related mutations:

```typescript
import { useDealMutations } from "~/hooks/mutations";

const { 
  create, 
  update, 
  deleteDeal, 
  addVehicles, 
  archive,
  unarchive,
  deleteBulk,
  isCreating,
  isUpdating,
  isDeleting,
  isAddingVehicles,
  isArchiving,
  isUnarchiving,
  isAnyPending 
} = useDealMutations();

// Create a new deal
await create({
  name: "BMW Commercial",
  date: "2025-03-15",
  vehicleIds: ["vehicle1", "vehicle2"]
});

// Add vehicles to existing deal
await addVehicles("deal-id", ["vehicle3", "vehicle4"]);

// Archive a deal
await archive("deal-id");
```

**Available Mutations**:
- `create(data)` - Create a new deal
- `update(dealId, data)` - Update deal details
- `deleteDeal(dealId)` - Delete a deal
- `addVehicles(dealId, vehicleIds, recipientIds?)` - Add vehicles to deal
- `archive(dealId)` - Archive a deal
- `unarchive(dealId)` - Unarchive a deal
- `deleteBulk(dealIds)` - Delete multiple deals

**Loading States**:
- `isCreating` - Creation in progress
- `isUpdating` - Update in progress
- `isDeleting` - Deletion in progress
- `isAddingVehicles` - Adding vehicles in progress
- `isArchiving` - Archiving in progress
- `isUnarchiving` - Unarchiving in progress
- `isAnyPending` - Any mutation in progress

### 3. Query Invalidation Helper

**Location**: `src/hooks/useInvalidateQueries.ts`

Provides convenient methods to invalidate related queries after mutations:

```typescript
import { useInvalidateQueries } from "~/hooks/mutations";

const { 
  invalidateVehicles, 
  invalidateDeals, 
  invalidateVehicle,
  invalidateDeal,
  invalidateFilterOptions,
  invalidateAll 
} = useInvalidateQueries();

// After creating a vehicle
await createVehicle(data);
await invalidateVehicles();

// After creating a deal
await createDeal(data);
await invalidateDeals();

// After updating a specific vehicle
await updateVehicle(vehicleId, data);
await invalidateVehicle(vehicleId);
```

**Available Invalidation Methods**:
- `invalidateVehicles()` - Invalidate all vehicle-related queries
- `invalidateDeals()` - Invalidate all deal-related queries
- `invalidateVehicle(vehicleId)` - Invalidate specific vehicle queries
- `invalidateDeal(dealId)` - Invalidate specific deal queries
- `invalidateFilterOptions()` - Invalidate filter option queries
- `invalidateAll()` - Invalidate all queries (use sparingly)

### 4. Mutation Hook Barrel Export

**Location**: `src/hooks/mutations/index.ts`

Centralized export for all mutation hooks:

```typescript
import { 
  useVehicleMutations, 
  useDealMutations, 
  useInvalidateQueries 
} from "~/hooks/mutations";
```

## Usage Patterns

### 1. Basic Mutation Usage

```typescript
import { useVehicleMutations } from "~/hooks/mutations";

function VehicleActions({ vehicleId }: { vehicleId: string }) {
  const { archive, publish, isUpdatingStatus } = useVehicleMutations();

  const handleArchive = async () => {
    try {
      await archive(vehicleId);
    } catch (error) {
      // Error handling is built into the hook
      console.error("Failed to archive vehicle:", error);
    }
  };

  const handlePublish = async () => {
    try {
      await publish(vehicleId);
    } catch (error) {
      console.error("Failed to publish vehicle:", error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleArchive}
        disabled={isUpdatingStatus}
      >
        Archive
      </Button>
      <Button 
        onClick={handlePublish}
        disabled={isUpdatingStatus}
      >
        Publish
      </Button>
    </div>
  );
}
```

### 2. Bulk Operations

```typescript
import { useVehicleMutations } from "~/hooks/mutations";

function BulkVehicleActions({ selectedIds }: { selectedIds: string[] }) {
  const { archiveBulk, publishBulk, isAnyPending } = useVehicleMutations();

  const handleBulkArchive = async () => {
    try {
      await archiveBulk(selectedIds);
    } catch (error) {
      console.error("Failed to archive vehicles:", error);
    }
  };

  const handleBulkPublish = async () => {
    try {
      await publishBulk(selectedIds);
    } catch (error) {
      console.error("Failed to publish vehicles:", error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleBulkArchive}
        disabled={isAnyPending || selectedIds.length === 0}
      >
        Archive Selected ({selectedIds.length})
      </Button>
      <Button 
        onClick={handleBulkPublish}
        disabled={isAnyPending || selectedIds.length === 0}
      >
        Publish Selected ({selectedIds.length})
      </Button>
    </div>
  );
}
```

### 3. Deal Creation with Vehicles

```typescript
import { useDealMutations } from "~/hooks/mutations";

function CreateDealForm({ selectedVehicleIds }: { selectedVehicleIds: string[] }) {
  const { create, isCreating } = useDealMutations();

  const handleSubmit = async (formData: DealFormData) => {
    try {
      await create({
        name: formData.name,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        brief: formData.brief,
        fee: formData.fee,
        vehicleIds: selectedVehicleIds,
        recipientIds: [], // Will be calculated automatically
      });
    } catch (error) {
      console.error("Failed to create deal:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={isCreating}>
        {isCreating ? "Creating..." : "Create Deal"}
      </Button>
    </form>
  );
}
```

### 4. Custom Error Handling

```typescript
import { useVehicleMutations } from "~/hooks/mutations";
import { useErrorHandler } from "~/hooks/useErrorHandler";

function VehicleActionsWithCustomErrorHandling({ vehicleId }: { vehicleId: string }) {
  const { archive } = useVehicleMutations();
  const { handleError } = useErrorHandler();

  const handleArchive = async () => {
    try {
      await archive(vehicleId);
    } catch (error) {
      // Custom error handling
      handleError(error);
    }
  };

  return (
    <Button onClick={handleArchive}>
      Archive Vehicle
    </Button>
  );
}
```

### 5. Integration with Forms

```typescript
import { useDealMutations } from "~/hooks/mutations";
import { useForm } from "react-hook-form";

function DealForm({ dealId }: { dealId?: string }) {
  const { create, update, isCreating, isUpdating } = useDealMutations();
  const isSubmitting = isCreating || isUpdating;

  const form = useForm<DealFormData>({
    defaultValues: {
      name: "",
      date: "",
      time: "",
      location: "",
      brief: "",
      fee: "",
    },
  });

  const onSubmit = async (data: DealFormData) => {
    try {
      if (dealId) {
        await update(dealId, data);
      } else {
        await create({
          ...data,
          vehicleIds: [],
          recipientIds: [],
        });
      }
    } catch (error) {
      console.error("Failed to save deal:", error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : dealId ? "Update Deal" : "Create Deal"}
      </Button>
    </form>
  );
}
```

## Error Handling

### Built-in Error Handling

All mutation hooks include built-in error handling:

```typescript
// Error handling is automatic
const { archive } = useVehicleMutations();

// This will automatically:
// 1. Show error toast if mutation fails
// 2. Log error to console
// 3. Invalidate related queries on success
await archive(vehicleId);
```

### Custom Error Handling

You can override the built-in error handling:

```typescript
import { useVehicleMutations } from "~/hooks/mutations";
import { useErrorHandler } from "~/hooks/useErrorHandler";

function CustomErrorHandling() {
  const { archive } = useVehicleMutations();
  const { handleError } = useErrorHandler();

  const handleArchive = async (vehicleId: string) => {
    try {
      await archive(vehicleId);
    } catch (error) {
      // Custom error handling
      handleError(error);
    }
  };

  return <Button onClick={() => handleArchive("vehicle-id")}>Archive</Button>;
}
```

## Success Notifications

### Automatic Success Messages

All mutations include automatic success notifications:

```typescript
// These will automatically show success toasts:
await archive(vehicleId);        // "Vehicle archived successfully"
await publish(vehicleId);        // "Vehicle published successfully"
await create(dealData);          // "Deal created successfully"
await addVehicles(dealId, ids);  // "Vehicles added to deal successfully"
```

### Bulk Operation Messages

Bulk operations provide detailed feedback:

```typescript
// Archive 3 vehicles, 2 succeed, 1 fails:
await archiveBulk(["id1", "id2", "id3"]);
// Shows: "2 vehicles archived successfully"
// Shows: "1 vehicle failed to archive"
```

## Query Invalidation

### Automatic Invalidation

All mutations automatically invalidate related queries:

```typescript
// This will automatically invalidate:
// - vehicle.list
// - vehicle.getById
await archive(vehicleId);

// This will automatically invalidate:
// - deal.list
// - deal.getById
await create(dealData);
```

### Manual Invalidation

Use the invalidation helper for custom scenarios:

```typescript
import { useInvalidateQueries } from "~/hooks/mutations";

function CustomInvalidation() {
  const { invalidateVehicles, invalidateDeals } = useInvalidateQueries();

  const handleCustomOperation = async () => {
    // Custom operation
    await customOperation();
    
    // Manually invalidate queries
    await invalidateVehicles();
    await invalidateDeals();
  };

  return <Button onClick={handleCustomOperation}>Custom Operation</Button>;
}
```

## Best Practices

### 1. Always Use Loading States

```typescript
// ✅ Good - Use loading states
const { archive, isUpdatingStatus } = useVehicleMutations();

<Button onClick={() => archive(vehicleId)} disabled={isUpdatingStatus}>
  {isUpdatingStatus ? "Archiving..." : "Archive"}
</Button>

// ❌ Bad - No loading state
<Button onClick={() => archive(vehicleId)}>
  Archive
</Button>
```

### 2. Handle Errors Appropriately

```typescript
// ✅ Good - Handle errors
const { archive } = useVehicleMutations();

const handleArchive = async () => {
  try {
    await archive(vehicleId);
  } catch (error) {
    // Error is already handled by the hook, but you can add custom logic
    console.error("Archive failed:", error);
  }
};

// ❌ Bad - Ignore errors
const handleArchive = async () => {
  await archive(vehicleId); // Errors are handled, but no custom logic
};
```

### 3. Use Appropriate Loading States

```typescript
// ✅ Good - Use specific loading states
const { archive, publish, isUpdatingStatus } = useVehicleMutations();

<Button disabled={isUpdatingStatus}>Archive</Button>
<Button disabled={isUpdatingStatus}>Publish</Button>

// ✅ Also good - Use general loading state for multiple operations
const { isAnyPending } = useVehicleMutations();

<Button disabled={isAnyPending}>Archive</Button>
<Button disabled={isAnyPending}>Publish</Button>
```

### 4. Provide User Feedback

```typescript
// ✅ Good - Clear user feedback
const { archive, isUpdatingStatus } = useVehicleMutations();

<Button onClick={() => archive(vehicleId)} disabled={isUpdatingStatus}>
  {isUpdatingStatus ? "Archiving..." : "Archive Vehicle"}
</Button>

// ❌ Bad - No user feedback
<Button onClick={() => archive(vehicleId)}>
  Archive
</Button>
```

## Future Enhancements

1. **Optimistic Updates**: Update UI immediately while mutation is in progress
2. **Retry Logic**: Automatic retry for failed mutations
3. **Offline Support**: Queue mutations when offline and sync when online
4. **Batch Operations**: Combine multiple mutations into single requests
5. **Progress Tracking**: Show progress for long-running operations

## Related Documentation

- [Error Handling](./error-handling.md) - Comprehensive error handling system
- [Filter Architecture](./filter-architecture.md) - Reusable filter system
- [Context API Usage](./context-api.md) - State management patterns
