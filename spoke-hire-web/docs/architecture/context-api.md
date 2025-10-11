# Context API Usage

## Overview

The SpokeHire admin interface uses React's Context API to eliminate props drilling and provide clean, maintainable state management. This document covers the context patterns used throughout the application.

## Architecture

### Context Patterns

1. **Vehicle Filters Context** - Legacy implementation
2. **Generic Filter Context** - New reusable implementation
3. **Authentication Context** - User session management
4. **tRPC Context** - API client management

## Implementation

### 1. Vehicle Filters Context (Legacy)

**Location**: `src/contexts/VehicleFiltersContext.tsx`

The original context implementation for vehicle filters:

```typescript
import { VehicleFiltersProvider, useVehicleFiltersContext } from "~/contexts";

// Provider usage
<VehicleFiltersProvider>
  <VehiclesPageContent />
</VehicleFiltersProvider>

// Hook usage
function VehicleFilters() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useVehicleFiltersContext();
  
  return (
    <div>
      <input 
        value={filters.search ?? ""}
        onChange={(e) => updateFilters({ search: e.target.value })}
      />
    </div>
  );
}
```

**Features**:
- Vehicle-specific filter state
- URL state management
- Type-safe filter updates
- Active filter detection

### 2. Generic Filter Context (New)

**Location**: `src/contexts/FilterContext.tsx`

The new generic context implementation that can work with any filter type:

```typescript
import { FilterProvider, useFilterContext } from "~/contexts";

// Provider usage with any filter type
<FilterProvider
  schema={vehicleFiltersSchema}
  defaults={defaultVehicleFilters}
  basePath="/admin/vehicles"
>
  <VehicleFilters />
  <VehicleListTable />
</FilterProvider>

// Hook usage with type safety
function VehicleFilters() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useFilterContext<VehicleFilters>();
  
  return (
    <div>
      <input 
        value={filters.search ?? ""}
        onChange={(e) => updateFilters({ search: e.target.value })}
      />
    </div>
  );
}
```

**Features**:
- Generic implementation works with any filter type
- Type-safe with TypeScript generics
- Reusable across different list pages
- Built-in URL state management

### 3. Authentication Context

**Location**: `src/providers/auth-provider.tsx`

Manages user authentication state:

```typescript
import { useAuth, useRequireAuth, useRequireAdmin } from "~/providers/auth-provider";

// Basic auth hook
function MyComponent() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Welcome, {user.email}!</div>;
}

// Require authentication
function ProtectedComponent() {
  const { user } = useRequireAuth(); // Throws if not authenticated
  
  return <div>Protected content for {user.email}</div>;
}

// Require admin role
function AdminComponent() {
  const { user } = useRequireAdmin(); // Throws if not admin
  
  return <div>Admin content for {user.email}</div>;
}
```

**Features**:
- User session management
- Authentication state
- Role-based access control
- Automatic redirects for unauthenticated users

### 4. tRPC Context

**Location**: `src/trpc/react.tsx`

Provides tRPC client and query management:

```typescript
import { api } from "~/trpc/react";

function MyComponent() {
  const { data, isLoading, error } = api.vehicle.list.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.vehicles.map(vehicle => (
        <div key={vehicle.id}>{vehicle.name}</div>
      ))}
    </div>
  );
}
```

**Features**:
- Type-safe API calls
- Automatic caching
- Loading and error states
- Query invalidation

## Usage Patterns

### 1. Basic Context Usage

```typescript
// Context definition
const MyContext = createContext<MyContextValue | undefined>(undefined);

// Provider component
export function MyProvider({ children }: { children: ReactNode }) {
  const value = {
    // Context value
  };
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

// Hook for consuming context
export function useMyContext() {
  const context = useContext(MyContext);
  if (context === undefined) {
    throw new Error('useMyContext must be used within a MyProvider');
  }
  return context;
}
```

### 2. Generic Context Pattern

```typescript
// Generic context definition
const FilterContext = createContext<FilterContextValue<any> | undefined>(undefined);

// Generic provider
export function FilterProvider<T extends Record<string, unknown>>({
  children,
  schema,
  defaults,
  basePath,
}: FilterProviderProps<T>) {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useURLFilters(
    schema,
    defaults,
    basePath
  );

  const value: FilterContextValue<T> = {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

// Typed hook
export function useFilterContext<T extends Record<string, unknown>>() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context as FilterContextValue<T>;
}
```

### 3. Context Composition

```typescript
// Compose multiple contexts
function App() {
  return (
    <AuthProvider>
      <TRPCReactProvider>
        <FilterProvider
          schema={vehicleFiltersSchema}
          defaults={defaultVehicleFilters}
          basePath="/admin/vehicles"
        >
          <VehiclesPage />
        </FilterProvider>
      </TRPCReactProvider>
    </AuthProvider>
  );
}
```

### 4. Context with Custom Hooks

```typescript
// Context that uses custom hooks internally
export function VehicleFiltersProvider({ children }: { children: ReactNode }) {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useVehicleFilters();

  const value: VehicleFiltersContextValue = {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };

  return (
    <VehicleFiltersContext.Provider value={value}>
      {children}
    </VehicleFiltersContext.Provider>
  );
}
```

## Best Practices

### 1. Always Check Context Existence

```typescript
// ✅ Good - Check if context exists
export function useMyContext() {
  const context = useContext(MyContext);
  if (context === undefined) {
    throw new Error('useMyContext must be used within a MyProvider');
  }
  return context;
}

// ❌ Bad - No context check
export function useMyContext() {
  const context = useContext(MyContext);
  return context; // Could be undefined
}
```

### 2. Use TypeScript Generics for Reusability

```typescript
// ✅ Good - Generic context
interface FilterContextValue<T extends Record<string, unknown>> {
  filters: T;
  updateFilters: (updates: Partial<T>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

// ❌ Bad - Specific context
interface VehicleFiltersContextValue {
  filters: VehicleFilters;
  updateFilters: (updates: Partial<VehicleFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}
```

### 3. Keep Context Values Stable

```typescript
// ✅ Good - Stable context value
export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  
  const value = useMemo(() => ({
    state,
    setState,
  }), [state]);
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

// ❌ Bad - Unstable context value
export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
}
```

### 4. Use Context for Global State Only

```typescript
// ✅ Good - Global state
<AuthProvider>
  <App />
</AuthProvider>

// ❌ Bad - Local state
<LocalStateProvider>
  <SingleComponent />
</LocalStateProvider>
```

### 5. Provide Convenience Hooks

```typescript
// ✅ Good - Convenience hooks
export function useVehicleFilterContext() {
  return useFilterContext<VehicleFilters>();
}

export function useDealFilterContext() {
  return useFilterContext<DealFilters>();
}

// Usage
const { filters } = useVehicleFilterContext(); // Type-safe
```

## Migration Guide

### From Props Drilling to Context

**Before (Props Drilling)**:
```typescript
// Page component
function VehiclesPage() {
  const { filters, updateFilters } = useVehicleFilters();
  
  return (
    <VehicleFilters
      search={filters.search}
      status={filters.status}
      makeIds={filters.makeIds}
      // ... 48 more props
      onSearchChange={(search) => updateFilters({ search })}
      onStatusChange={(status) => updateFilters({ status })}
      onMakeIdsChange={(makeIds) => updateFilters({ makeIds })}
      // ... 24 more callbacks
    />
  );
}

// Filter component
function VehicleFilters({ search, status, makeIds, onSearchChange, onStatusChange, onMakeIdsChange }) {
  return (
    <FilterGrid
      search={search}
      status={status}
      makeIds={makeIds}
      onSearchChange={onSearchChange}
      onStatusChange={onStatusChange}
      onMakeIdsChange={onMakeIdsChange}
    />
  );
}
```

**After (Context)**:
```typescript
// Page component
function VehiclesPage() {
  return (
    <FilterProvider
      schema={vehicleFiltersSchema}
      defaults={defaultVehicleFilters}
      basePath="/admin/vehicles"
    >
      <VehicleFilters />
    </FilterProvider>
  );
}

// Filter component
function VehicleFilters() {
  const { filters, updateFilters } = useVehicleFilterContext();
  
  return (
    <FilterGrid />
  );
}
```

## Performance Considerations

### 1. Context Value Stability

```typescript
// ✅ Good - Memoized context value
const value = useMemo(() => ({
  filters,
  updateFilters,
  clearFilters,
  hasActiveFilters,
}), [filters, updateFilters, clearFilters, hasActiveFilters]);

// ❌ Bad - New object on every render
const value = {
  filters,
  updateFilters,
  clearFilters,
  hasActiveFilters,
};
```

### 2. Context Splitting

```typescript
// ✅ Good - Split contexts by concern
<AuthProvider>
  <FilterProvider>
    <App />
  </FilterProvider>
</AuthProvider>

// ❌ Bad - Single large context
<AppProvider>
  <App />
</AppProvider>
```

### 3. Selective Context Consumption

```typescript
// ✅ Good - Only consume what you need
function MyComponent() {
  const { filters } = useVehicleFilterContext(); // Only filters
  // Component only re-renders when filters change
}

// ❌ Bad - Consume entire context
function MyComponent() {
  const context = useVehicleFilterContext(); // Everything
  // Component re-renders when any context value changes
}
```

## Common Patterns

### 1. Context with Reducer

```typescript
// Context with useReducer
const MyContext = createContext<{
  state: MyState;
  dispatch: Dispatch<MyAction>;
} | undefined>(undefined);

export function MyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(myReducer, initialState);
  
  const value = useMemo(() => ({
    state,
    dispatch,
  }), [state, dispatch]);
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}
```

### 2. Context with Custom Hooks

```typescript
// Context that uses custom hooks
export function MyProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useMyData();
  const { mutate } = useMyMutation();
  
  const value = useMemo(() => ({
    data,
    isLoading,
    error,
    mutate,
  }), [data, isLoading, error, mutate]);
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}
```

### 3. Context with External State

```typescript
// Context that manages external state
export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    // Sync with external state
    const unsubscribe = externalStore.subscribe(setState);
    return unsubscribe;
  }, []);
  
  const value = useMemo(() => ({
    state,
    setState,
  }), [state]);
  
  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}
```

## Related Documentation

- [Error Handling](../features/error-handling.md) - Comprehensive error handling system
- [Filter Architecture](../features/filter-architecture.md) - Reusable filter system
- [Mutation Handlers](../features/mutation-handlers.md) - Centralized mutation management
