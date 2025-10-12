# Vehicle Filter Persistence

## Overview

Vehicle search filters in the admin interface automatically persist across browser sessions using a combination of URL parameters and localStorage. This ensures users can bookmark specific searches while also having their most recent filters remembered when they return to the page.

## How It Works

### Dual-Storage Strategy

1. **URL as Primary Source of Truth**
   - All filter state is stored in URL query parameters
   - URLs can be bookmarked and shared
   - Browser back/forward buttons work naturally
   - Example: `/admin/vehicles?search=BMW&status=PUBLISHED&makeIds=bmw-id`

2. **localStorage as Fallback**
   - Automatically saves filter state to browser localStorage
   - Restores filters when returning without URL parameters
   - Persists across browser restarts and tab closures
   - Storage key: `spokehire_vehicle_filters`

### Filter Lifecycle

#### When Filters Are Loaded

1. **User visits with URL parameters** (e.g., bookmarked link)
   - URL parameters take priority
   - Filters are applied from URL
   - No localStorage loading occurs

2. **User visits without URL parameters** (e.g., direct navigation)
   - Checks localStorage for saved filters
   - If found, applies saved filters to URL
   - User sees their last filter state restored

#### When Filters Are Saved

- Every time a filter is updated via `updateFilters()`
- Automatically saved to localStorage after URL update
- Page number is excluded from localStorage (session-specific)
- Only non-default values are saved to keep storage clean

#### When Filters Are Cleared

- User clicks "Clear Filters" button
- Both URL and localStorage are cleared
- Resets to default state (status=PUBLISHED)

## Implementation Details

### Hook: `useVehicleFilters`

**Location:** `src/hooks/useVehicleFilters.ts`

**Key Functions:**

```typescript
const { filters, updateFilters, clearFilters, hasActiveFilters } = useVehicleFilters();

// Update filters (saves to both URL and localStorage)
updateFilters({ search: "BMW", status: "PUBLISHED" });

// Clear all filters (clears both URL and localStorage)
clearFilters();

// Check if any non-default filters are active
if (hasActiveFilters) {
  // Show clear button
}
```

### Data Validation

Filters loaded from localStorage are validated using Zod schemas to prevent corruption:

```typescript
const VehicleFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "DECLINED", "ARCHIVED", "ALL"]).optional(),
  makeIds: z.array(z.string()).optional(),
  // ... other fields
});
```

**Validation Flow:**
1. Load JSON string from localStorage
2. Parse JSON
3. Validate against schema
4. If validation fails, clear corrupted data and use defaults

### Error Handling

The implementation handles several error cases gracefully:

- **JSON parse errors**: Caught and logged, corrupted data is cleared
- **Schema validation errors**: Invalid data is discarded, defaults are used
- **localStorage unavailable**: Feature degrades gracefully (URL-only mode)
- **SSR/SSG**: localStorage checks are wrapped in `typeof window !== 'undefined'`

## Usage Examples

### Scenario 1: Daily Admin Workflow

```
Day 1, 10am:
User searches: "BMW, Published status, 2020-2023"
→ Filters saved to localStorage

Day 1, 3pm:
User closes browser

Day 2, 9am:
User opens /admin/vehicles
→ Previous filters automatically restored!
```

### Scenario 2: Sharing a Search

```
User A:
Filters by "Tesla, Archived status"
Copies URL: /admin/vehicles?search=Tesla&status=ARCHIVED

User B:
Clicks shared link
→ Sees exact same filters as User A
→ Their own localStorage is not affected
```

### Scenario 3: Clearing Filters

```
User has complex filters applied
Clicks "Clear Filters"
→ URL resets to /admin/vehicles?status=PUBLISHED
→ localStorage cleared
→ Next visit starts fresh
```

## Storage Details

### What Gets Stored

```json
{
  "search": "BMW",
  "status": "PUBLISHED",
  "makeIds": ["bmw-id", "mercedes-id"],
  "yearFrom": "2020",
  "yearTo": "2023",
  "sortBy": "price",
  "sortOrder": "asc"
}
```

### What Doesn't Get Stored

- Page number (session-specific)
- Default values (keeps storage clean)
- Temporary UI state (modals, selections)

### Storage Limits

- localStorage limit: ~5-10MB (browser-dependent)
- Typical filter object: < 1KB
- No practical limit for filter persistence

## Browser Compatibility

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Private/Incognito mode (localStorage available but cleared on close)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ❌ Does NOT sync across devices (localStorage is per-browser)

## Maintenance

### Clearing Storage (Developer Tools)

```javascript
// In browser console
localStorage.removeItem('spokehire_vehicle_filters');

// Or clear all localStorage
localStorage.clear();
```

### Migration Strategy

If filter structure changes:
1. Update Zod schema
2. Old data fails validation
3. Automatically cleared
4. No manual migration needed

## Future Enhancements

Possible improvements (not currently implemented):

1. **Server-side user preferences**
   - Store in database per user
   - Sync across devices
   - Requires backend changes

2. **Multiple saved searches**
   - Save/name different filter combinations
   - Quick switching between searches
   - Requires UI for management

3. **Filter presets**
   - Admin-defined common filters
   - "Recently added", "Needs review", etc.
   - Shared across all users

## Troubleshooting

### Filters not persisting

**Check:**
1. Browser allows localStorage (not disabled in settings)
2. Not in private/incognito mode with aggressive privacy settings
3. No localStorage quota exceeded errors in console

### Filters not loading on return

**Check:**
1. URL has no parameters (localStorage only loads when URL is empty)
2. No validation errors in browser console
3. localStorage contains valid data: `localStorage.getItem('spokehire_vehicle_filters')`

### Filters from old session loading incorrectly

**Solution:**
- Clear filters manually via "Clear Filters" button
- Or clear localStorage in browser dev tools
- Old filter structure may have changed

## Related Files

- `src/hooks/useVehicleFilters.ts` - Main hook implementation
- `src/contexts/VehicleFiltersContext.tsx` - Context provider
- `src/app/admin/vehicles/_components/VehicleFilters.tsx` - UI component
- `src/app/admin/vehicles/_components/filters/FilterGrid.tsx` - Filter controls

