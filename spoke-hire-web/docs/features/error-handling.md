# Error Handling System

## Overview

The SpokeHire admin interface implements a comprehensive error handling system that provides graceful error recovery, user feedback, and network status monitoring. This system ensures a robust user experience even when things go wrong.

## Architecture

### Core Components

1. **Error Handler Hook** (`useErrorHandler`)
2. **Retry Mechanism** (`useRetry`) 
3. **Network Status Monitoring** (`useNetworkStatus`)
4. **Error Boundaries** (`ErrorBoundary`)
5. **Network Status UI** (`NetworkStatus`)

## Implementation

### 1. Error Handler Hook

**Location**: `src/hooks/useErrorHandler.ts`

Provides centralized error handling for different error types:

```typescript
import { useErrorHandler } from "~/hooks/useErrorHandler";

const { handleError, handleTRPCError, handleNetworkError } = useErrorHandler();

// Generic error handling
try {
  await someOperation();
} catch (error) {
  handleError(error);
}
```

**Supported Error Types**:
- **tRPC Errors**: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, etc.
- **Network Errors**: Connection issues, timeouts, CORS errors
- **Validation Errors**: Zod validation failures
- **Authentication Errors**: Session expiry, permission issues

### 2. Retry Mechanism

**Location**: `src/hooks/useRetry.ts`

Provides automatic retry functionality with exponential backoff:

```typescript
import { useRetry } from "~/hooks/useRetry";

const { retry, isRetrying } = useRetry();

const handleSave = async () => {
  await retry(
    async () => {
      await saveData();
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
      operationName: "Save changes"
    }
  );
};
```

**Features**:
- Exponential backoff delay
- User feedback during retries
- Configurable retry attempts
- Success/failure callbacks

### 3. Network Status Monitoring

**Location**: `src/hooks/useNetworkStatus.ts`

Monitors network connectivity and provides status information:

```typescript
import { useNetworkStatus } from "~/hooks/useNetworkStatus";

const { isOnline, isOffline, connectionType, isSlowConnection } = useNetworkStatus();

if (isOffline) {
  return <OfflineMessage />;
}
```

**Network Status Properties**:
- `isOnline`: Boolean indicating if device is online
- `isOffline`: Boolean indicating if device is offline
- `connectionType`: Connection type (2g, 3g, 4g, slow-2g, etc.)
- `isSlowConnection`: Boolean indicating slow connection
- `isFastConnection`: Boolean indicating fast connection
- `wasOffline`: Boolean indicating if device was recently offline

### 4. Error Boundaries

**Location**: `src/components/error/ErrorBoundary.tsx`

Catches JavaScript errors in React components:

```typescript
import { ErrorBoundary } from "~/components/error";

<ErrorBoundary
  onError={(error, errorInfo) => {
    console.error("Error caught:", error, errorInfo);
  }}
  resetKeys={[userId]} // Reset when userId changes
>
  <MyComponent />
</ErrorBoundary>
```

**Features**:
- Automatic error catching
- User-friendly error UI
- Retry functionality
- Development vs production error display
- Custom fallback UI support

### 5. Network Status UI

**Location**: `src/components/network/NetworkStatus.tsx`

Displays network connectivity status to users:

```typescript
import { NetworkStatus } from "~/components/network";

// Add to your layout
<NetworkStatus />
```

**Features**:
- Real-time network status display
- Offline/online notifications
- Slow connection warnings
- Auto-dismissing alerts

## Error Types and Handling

### tRPC Errors

| Error Code | User Message | Action |
|------------|--------------|---------|
| UNAUTHORIZED | "You are not authorized to perform this action" | - |
| FORBIDDEN | "Access denied. Please check your permissions" | - |
| NOT_FOUND | "The requested resource was not found" | - |
| CONFLICT | "This action conflicts with existing data" | - |
| TOO_MANY_REQUESTS | "Too many requests. Please try again later" | - |
| PAYLOAD_TOO_LARGE | "The request is too large" | - |
| UNPROCESSABLE_CONTENT | "Invalid data provided. Please check your input" | - |
| INTERNAL_SERVER_ERROR | "Server error. Please try again later" | - |

### Network Errors

| Error Type | User Message | Action |
|------------|--------------|---------|
| NetworkError | "Network error. Please check your connection and try again" | - |
| TimeoutError | "Request timed out. Please try again" | - |
| CORS Error | "Network configuration error. Please contact support" | - |

### Validation Errors

| Error Type | User Message | Action |
|------------|--------------|---------|
| Zod Validation | Shows first validation error message | - |
| Generic Validation | "Invalid data provided" | - |

### Authentication Errors

| Error Type | User Message | Action |
|------------|--------------|---------|
| Session Expired | "Your session has expired. Please sign in again" | Redirect to login |
| Permission Denied | "You don't have permission to perform this action" | - |
| Generic Auth Error | "Authentication error. Please sign in again" | Redirect to login |

## Usage Patterns

### 1. Mutation Error Handling

```typescript
import { useVehicleMutations } from "~/hooks/mutations";
import { useErrorHandler } from "~/hooks/useErrorHandler";

function VehicleActions() {
  const { archive, isUpdatingStatus } = useVehicleMutations();
  const { handleError } = useErrorHandler();

  const handleArchive = async (vehicleId: string) => {
    try {
      await archive(vehicleId);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Button 
      onClick={() => handleArchive("vehicle-id")}
      disabled={isUpdatingStatus}
    >
      Archive Vehicle
    </Button>
  );
}
```

### 2. Retry with Error Handling

```typescript
import { useRetry } from "~/hooks/useRetry";
import { useErrorHandler } from "~/hooks/useErrorHandler";

function DataSync() {
  const { retry, isRetrying } = useRetry();
  const { handleError } = useErrorHandler();

  const syncData = async () => {
    try {
      await retry(
        async () => {
          await syncWithServer();
        },
        {
          maxAttempts: 3,
          operationName: "Sync data",
          onFinalFailure: (error) => {
            handleError(error);
          }
        }
      );
    } catch (error) {
      // This will only be called if all retries fail
      handleError(error);
    }
  };

  return (
    <Button onClick={syncData} disabled={isRetrying}>
      {isRetrying ? "Syncing..." : "Sync Data"}
    </Button>
  );
}
```

### 3. Network-Aware Components

```typescript
import { useNetworkStatus } from "~/hooks/useNetworkStatus";

function OfflineAwareForm() {
  const { isOffline, isSlowConnection } = useNetworkStatus();

  return (
    <form>
      <input type="text" disabled={isOffline} />
      <button 
        type="submit" 
        disabled={isOffline}
        className={isSlowConnection ? "opacity-50" : ""}
      >
        {isOffline ? "Offline" : "Submit"}
      </button>
    </form>
  );
}
```

### 4. Error Boundary Usage

```typescript
import { ErrorBoundary } from "~/components/error";

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to external service
        console.error("App error:", error, errorInfo);
      }}
    >
      <Router>
        <Routes>
          <Route path="/admin" element={<AdminLayout />} />
          <Route path="/admin/vehicles" element={<VehiclesPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

## Integration with Existing Code

### 1. Update Mutation Hooks

The existing mutation hooks (`useVehicleMutations`, `useDealMutations`) already include error handling. You can enhance them by adding retry logic:

```typescript
import { useRetry } from "~/hooks/useRetry";

export function useVehicleMutations() {
  const { retry } = useRetry();
  
  const archive = useCallback(
    async (vehicleId: string) => {
      return retry(
        () => updateStatusMutation.mutateAsync({ id: vehicleId, status: "ARCHIVED" }),
        { operationName: "Archive vehicle" }
      );
    },
    [updateStatusMutation, retry]
  );
}
```

### 2. Add Network Status to Layout

```typescript
import { NetworkStatus } from "~/components/network";

export function AdminLayout() {
  return (
    <div>
      <NetworkStatus />
      {/* Rest of layout */}
    </div>
  );
}
```

### 3. Wrap Components with Error Boundaries

```typescript
import { ErrorBoundary } from "~/components/error";

export function VehiclesPage() {
  return (
    <ErrorBoundary>
      <VehicleFilters />
      <VehicleListTable />
    </ErrorBoundary>
  );
}
```

## Best Practices

### 1. Always Handle Errors

```typescript
// ❌ Bad - No error handling
const handleSave = async () => {
  await saveData();
};

// ✅ Good - Proper error handling
const handleSave = async () => {
  try {
    await saveData();
  } catch (error) {
    handleError(error);
  }
};
```

### 2. Use Retry for Network Operations

```typescript
// ❌ Bad - No retry for network operations
const fetchData = async () => {
  const response = await fetch("/api/data");
  return response.json();
};

// ✅ Good - Retry for network operations
const fetchData = async () => {
  return retry(async () => {
    const response = await fetch("/api/data");
    return response.json();
  }, { operationName: "Fetch data" });
};
```

### 3. Provide User Feedback

```typescript
// ❌ Bad - Silent failures
const handleDelete = async () => {
  try {
    await deleteItem();
  } catch (error) {
    // Silent failure
  }
};

// ✅ Good - User feedback
const handleDelete = async () => {
  try {
    await deleteItem();
    toast.success("Item deleted successfully");
  } catch (error) {
    handleError(error);
  }
};
```

### 4. Use Error Boundaries Strategically

```typescript
// ❌ Bad - No error boundaries
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminLayout />} />
      </Routes>
    </Router>
  );
}

// ✅ Good - Strategic error boundaries
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/admin" element={
            <ErrorBoundary>
              <AdminLayout />
            </ErrorBoundary>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

## Future Enhancements

1. **Error Analytics**: Track error patterns and frequency
2. **Automatic Recovery**: Automatically retry failed operations when connection is restored
3. **Offline Support**: Queue operations when offline and sync when online
4. **Error Reporting**: Integrate with external error reporting services
5. **User Preferences**: Allow users to configure retry behavior and error notifications

## Related Documentation

- [Filter Architecture](./filter-architecture.md) - Reusable filter system
- [Mutation Handlers](./mutation-handlers.md) - Centralized mutation management
- [Context API Usage](./context-api.md) - State management patterns
