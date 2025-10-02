# Vehicles Management Feature

## Overview

The Vehicles Management feature provides a comprehensive interface for administrators to view, search, filter, and manage vehicle listings in the SpokeHire system.

## Feature Components

### Backend (tRPC API)

#### Vehicle Router (`src/server/api/routers/vehicle.ts`)

**Procedures:**

1. **`list`** - Get paginated list of vehicles with filters
   - Input: Pagination, search, filters (status, makeIds, modelId, collectionIds, exteriorColors, interiorColors, year range, price, owner), sorting
   - Output: Array of vehicles with relations, next cursor, total count
   - Auth: Admin only
   - Features:
     - Full-text search across name, registration, description, make, model, owner (email, name, phone)
     - Multiple filter options with OR logic (makes, collections, colors)
     - Cursor-based pagination
     - Flexible sorting

2. **`getById`** - Get single vehicle with full details
   - Input: Vehicle ID
   - Output: Complete vehicle data with all relations
   - Auth: Admin only

3. **`updateStatus`** - Update vehicle status
   - Input: Vehicle ID, new status
   - Output: Updated vehicle
   - Auth: Admin only
   - Statuses: DRAFT, PUBLISHED, DECLINED, ARCHIVED

4. **`delete`** - Soft delete vehicle (archives it)
   - Input: Vehicle ID
   - Output: Archived vehicle
   - Auth: Admin only
   - Note: Soft delete by setting status to ARCHIVED

5. **`getFilterOptions`** - Get available filter options
   - Output: List of makes, collections (with colors), exterior colors, interior colors, years, status counts
   - Auth: Admin only
   - Used to populate filter dropdowns

6. **`getModelsByMake`** - Get models for a specific make
   - Input: Make ID
   - Output: List of models
   - Auth: Admin only
   - Used for cascading make/model filters

### Frontend Components

#### Page Component

**`src/app/admin/vehicles/page.tsx`**
- Main page for vehicle list
- Client component with URL state management
- Features:
  - Search with debouncing (300ms) - searches vehicle and owner info
  - Multi-select filters with OR logic (makes, collections, colors)
  - Filters synced to URL query parameters
  - Results count display
  - Table/Card view toggle for desktop
  - Load More pagination
  - Loading and error states
  - Navigation to vehicle detail/edit pages

#### Feature Components (`src/app/admin/vehicles/_components/`)

1. **`VehicleListTable.tsx`** (Client)
   - Main table component
   - Responsive design
   - Handles loading, empty states
   - Delegates row rendering to VehicleTableRow

2. **`VehicleTableRow.tsx`** (Client)
   - Individual table row
   - Displays: image, name, make/model, year, registration, status, price, owner
   - Actions dropdown: View, Edit, Delete
   - Click row to navigate to detail page

3. **`VehicleFilters.tsx`** (Client)
   - Search input with icon (searches vehicle + owner info)
   - Status filter dropdown
   - Make multi-select filter (searchable with checkboxes)
   - Model filter (enabled when single make selected)
   - Collection multi-select filter (searchable with color indicators)
   - Exterior color multi-select filter (16 colors)
   - Interior color multi-select filter (16 colors)
   - Year range filters (from/to dropdowns)
   - Clear filters button
   - Active filters indicator

4. **`VehicleStatusBadge.tsx`** (Server)
   - Colored badge for vehicle status
   - Color mapping:
     - DRAFT: outline (gray)
     - PUBLISHED: default (primary)
     - DECLINED: destructive (red)
     - ARCHIVED: secondary (yellow/gray)

5. **`VehicleListSkeleton.tsx`** (Server)
   - Loading skeleton with 5 rows
   - Matches table structure

6. **`VehicleEmptyState.tsx`** (Server)
   - Displayed when no vehicles found
   - Different messages for "no data" vs "no results from filters"
   - Clear filters button when filters active

### Utilities

#### Types (`src/types/vehicle.ts`)
- `VehicleListItem` - Type for list view with relations
- `VehicleDetail` - Type for detail view with full relations
- `VehicleFilters` - Filter options interface
- `VehicleSort` - Sort options types
- `VehiclePagination` - Pagination options

#### Utilities (`src/lib/vehicles.ts`)
- `formatPrice()` - Format price in GBP
- `getStatusVariant()` - Get badge variant for status
- `getStatusLabel()` - Get human-readable status label
- `formatVehicleName()` - Format vehicle name with make/model
- `formatYear()` - Format year display
- `getInitials()` - Get initials for avatar fallback
- `formatOwnerName()` - Format owner name
- `truncateText()` - Truncate text to max length
- `formatRegistration()` - Format UK registration numbers
- `getVehicleImageUrl()` - Get image URL or fallback

#### Hooks (`src/hooks/useDebounce.ts`)
- `useDebounce()` - Debounce hook for search input
- Default delay: 300ms
- Prevents excessive API calls during typing

## Data Flow

1. **Initial Load**
   - Page component fetches vehicles using tRPC query
   - Reads initial filters from URL query parameters
   - Displays loading skeleton while fetching

2. **Search**
   - User types in search input
   - Input is debounced (300ms)
   - Debounced value updates URL params
   - tRPC query refetches with new search term

3. **Filtering**
   - User selects filter (status, make, model)
   - Filter state updates immediately
   - URL params update
   - tRPC query refetches with new filters

4. **Actions**
   - View: Navigate to `/admin/vehicles/[id]` (TODO)
   - Edit: Navigate to `/admin/vehicles/[id]/edit` (TODO)
   - Delete: Show confirmation, call delete mutation (TODO)

## URL State Management

All filters are synced to URL query parameters for:
- Shareable links
- Browser back/forward navigation
- Bookmark-able filtered views

**Query Parameters:**
- `search` - Search term (vehicle and owner info)
- `status` - Vehicle status filter (default: PUBLISHED)
- `makeIds` - Comma-separated make IDs (OR logic)
- `modelId` - Model filter
- `collectionIds` - Comma-separated collection IDs (OR logic)
- `exteriorColors` - Comma-separated colors (OR logic)
- `interiorColors` - Comma-separated colors (OR logic)
- `yearFrom` - Year range start
- `yearTo` - Year range end

Example: `/admin/vehicles?search=john@example.com&status=PUBLISHED&makeIds=bmw-id,audi-id&collectionIds=classic-id&exteriorColors=Red,Blue&yearFrom=2000&yearTo=2020`

## UI/UX Features

### Responsive Design
- Desktop (≥ 768px): Table or Card view (user toggle)
- Mobile (< 768px): Card-based layout with stacked information
- Touch-friendly tap targets (min 44x44px)
- Filter row wraps on smaller screens

### Loading States
- Skeleton loader with 5 rows
- Matches table structure
- Smooth transition to real data

### Empty States
- No vehicles: Encourages adding first vehicle
- No results: Suggests clearing filters
- Different messages for each scenario

### Error Handling
- Toast notifications for errors
- User-friendly error messages
- Non-blocking (page stays functional)

### Performance
- Debounced search (prevents excessive API calls)
- Cursor-based pagination (efficient for large datasets)
- Only fetches needed relations
- URL state (no unnecessary refetches on navigation)

## Database Schema

### Main Vehicle Fields
- `id` - Unique identifier (CUID)
- `name` - Vehicle name/title
- `makeId` - Reference to Make table
- `modelId` - Reference to Model table
- `year` - Manufacturing year
- `registration` - Registration number
- `engineCapacity` - Engine size (CC)
- `numberOfSeats` - Number of seats
- `steeringId` - Reference to SteeringType
- `gearbox` - Gearbox type
- `exteriorColour` - Exterior color
- `interiorColour` - Interior color
- `condition` - Vehicle condition
- `isRoadLegal` - Road legal status
- `price` - Price (Decimal)
- `status` - Status enum (DRAFT, PUBLISHED, DECLINED, ARCHIVED)
- `description` - Text description
- `ownerId` - Reference to User (owner)

### Relations
- `make` - Make details
- `model` - Model details
- `owner` - Owner/user details
- `steering` - Steering type details
- `media` - Vehicle images/videos
- `sources` - Data source tracking
- `specifications` - Additional specs
- `collections` - Vehicle collections

## Future Enhancements

### Planned Features
1. **Vehicle Detail Page** - Full vehicle view with all info
2. **Vehicle Edit Page** - Edit vehicle details
3. **Delete Confirmation** - Modal dialog for delete action
4. **Bulk Actions** - Select and act on multiple vehicles
5. **Advanced Filters** - Year range, price range, more fields
6. **Export** - Export filtered vehicles to CSV/Excel
7. **Sorting** - Click column headers to sort
8. **Mobile Cards** - Card layout for mobile devices
9. **Image Gallery** - View all vehicle images
10. **Status Change** - Inline status update with confirmation

### Technical Improvements
1. **Infinite Scroll** - Replace "Load More" with auto-loading
2. **Virtual Scrolling** - For very large lists
3. **Image Optimization** - Lazy loading, blur placeholders
4. **Caching** - Better query caching strategy
5. **Prefetching** - Prefetch likely next pages
6. **Search Highlighting** - Highlight search terms in results

## Testing Checklist

- [x] Backend API procedures work correctly
- [x] Frontend components render without errors
- [x] Search functionality works with debouncing
- [x] Filters work correctly
- [x] URL state management works
- [x] Loading states display properly
- [x] Empty states display correctly
- [ ] Error handling works
- [x] Responsive design (mobile card layout implemented)
- [x] Dark mode compatibility
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Vehicle detail page navigation (TODO)
- [ ] Vehicle edit page navigation (TODO)
- [ ] Delete confirmation (TODO)

## Known Issues

1. ~~**Mobile Layout**~~ - ✅ Fixed: Card layout implemented for mobile
2. ~~**Pagination**~~ - ✅ Fixed: Load More button now functional with cursor-based pagination
3. **Delete Function** - Shows toast but doesn't actually delete (TODO)
4. **Detail/Edit Pages** - Not yet implemented (navigation shows 404)

## Dependencies

- Next.js 15 (App Router)
- tRPC (API layer)
- Prisma (Database ORM)
- shadcn/ui (UI components)
- Lucide React (Icons)
- Sonner (Toast notifications)
- Next Image (Image optimization)

## File Structure

```
src/
├── app/
│   └── admin/
│       ├── page.tsx (updated with vehicles card)
│       └── vehicles/
│           ├── page.tsx (main vehicles list page)
│           └── _components/
│               ├── VehicleListTable.tsx
│               ├── VehicleTableRow.tsx
│               ├── VehicleFilters.tsx
│               ├── VehicleStatusBadge.tsx
│               ├── VehicleListSkeleton.tsx
│               ├── VehicleEmptyState.tsx
│               └── index.ts
├── components/
│   └── ui/ (shadcn components)
├── server/
│   └── api/
│       ├── routers/
│       │   ├── vehicle.ts (NEW)
│       │   └── auth.ts (existing)
│       └── root.ts (updated)
├── types/
│   └── vehicle.ts (NEW)
├── lib/
│   └── vehicles.ts (NEW)
└── hooks/
    └── useDebounce.ts (NEW)
```

## Related Documentation

- [Admin Authentication](./admin-auth.md)
- [Database Schema](../../prisma/schema.prisma)
- [Agent Rules](../../agents.md)

---

**Last Updated:** October 2, 2025  
**Status:** ✅ Comprehensive filtering system complete with multi-select, search, and view toggles. Detail/edit pages TODO.

## Recent Updates

### October 2, 2025

#### Initial Implementation
- ✅ Added mobile-first responsive design
- ✅ Implemented card layout for mobile devices
- ✅ Added Supabase storage domain to Next.js config
- ✅ Updated to use `publishedUrl` for images with fallback to `originalUrl`
- ✅ Filter images by `READY` status only
- ✅ Made statistics cards responsive (2-column on mobile)
- ✅ Improved header for mobile with icon-only back button
- ✅ Fixed placeholder image with SVG data URI (no more 404s)
- ✅ Implemented "Load More" pagination with cursor-based loading
- ✅ Shows remaining count on Load More button
- ✅ Loading spinner while fetching more vehicles

#### Enhanced Filtering
- ✅ Replaced statistics cards with simple results count
- ✅ Set default status filter to "Published"
- ✅ Added location display (Postcode, City, Country) from owner data
- ✅ Separated Location and Owner columns in table view
- ✅ Added desktop view toggle (Table/Cards)
- ✅ Reused mobile card component for desktop cards view

#### Advanced Filters
- ✅ **Year Range Filter:** Dropdown selects for year from/to (1900-2026)
- ✅ **Make Multi-Select:** Searchable dropdown with checkboxes, OR logic
- ✅ **Collection Multi-Select:** Searchable with color indicators, OR logic
  - 9 collections created from catalog data
  - 926 collection assignments across 708 vehicles
  - Collections: Classic (627), American (89), Convertibles (88), Modern (84), 4x4 (27), Vans (20), Service Vehicles (13), Motorbikes (6), Emergency Vehicles (1)
- ✅ **Enhanced Search:** Now searches owner email, first name, last name, phone
- ✅ **Color Filters:** Multi-select for exterior and interior colors
  - 16 colors each: Beige, Black, Blue, Brown, Cream, Gold, Green, Grey, Maroon, Orange, Pink, Purple, Red, Silver, White, Yellow
  - OR logic within each color type
  - Top colors: Blue (159), Red (129), Black (107), Green (81), White (81)

#### Technical Improvements
- ✅ URL persistence for all filter states
- ✅ OR logic for multi-select filters (makes, collections, colors)
- ✅ AND logic between different filter types
- ✅ Cursor-based pagination with filter reset on filter change
- ✅ Created update-vehicle-collections.ts script for data migration
- ✅ Added Command and Popover components from shadcn/ui

