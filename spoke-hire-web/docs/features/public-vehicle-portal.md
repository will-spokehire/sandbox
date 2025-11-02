# Public Vehicle Portal Feature

## Overview

A fully public-facing vehicle catalog portal accessible at `/vehicles` that allows unauthenticated users to browse and view published vehicles. The portal features comprehensive SEO optimization, modern UI, and URL-based filter persistence.

## Implementation Date

November 2, 2025

## Routes

- **`/vehicles`** - Public vehicle catalog with filters
- **`/vehicles/[id]`** - Individual vehicle detail page

## Key Features

### Public Access
- No authentication required
- Only PUBLISHED vehicles are visible
- Owner contact information hidden (email, phone)
- Location shown (country, county, city only)
- No price information displayed

### SEO Optimization
- Dynamic metadata generation for each vehicle
- Open Graph tags for social media sharing
- Twitter Card support
- JSON-LD structured data (Schema.org)
- Semantic HTML with proper heading hierarchy (h1, h2)
- Canonical URLs
- Server-side rendering for optimal SEO

### Filtering & Search
- **Search**: Full-text search across vehicle names
- **Make**: Multi-select filter
- **Model**: Single-select (enabled when one make selected)
- **Decade**: Year range filter (1920s-2020s)
- **Location**: Multi-select by country and county
- **Collections/Tags**: Multi-select with color badges
- **URL Persistence**: All filter state stored in URL for shareable links

### Responsive Design
- Mobile-first approach
- Responsive grid: 1 col (mobile), 2 (tablet), 3 (desktop), 4 (wide)
- Mobile filter sheet for better UX on small screens
- Desktop inline filters
- Touch-friendly image galleries

## Architecture

### Backend (tRPC)

#### Router: `public-vehicle.ts`
Location: `src/server/api/routers/public-vehicle.ts`

**Endpoints:**
```typescript
publicVehicle.list(params) → { vehicles, nextCursor, totalCount }
publicVehicle.getById({ id }) → VehicleDetail
publicVehicle.getFilterOptions() → FilterOptions
publicVehicle.getModelsByMake({ makeId }) → Model[]
```

**Key Features:**
- Uses `publicProcedure` (no auth required)
- Enforces `status: PUBLISHED` filter
- Excludes sensitive owner data (email, phone)
- Reuses existing `VehicleService` for business logic
- Returns sanitized vehicle data

**Security:**
- Only PUBLISHED vehicles accessible
- Owner contact info filtered out
- Admin-specific data excluded
- No price information exposed

### Frontend (Next.js)

#### Catalog Page (`/vehicles/page.tsx`)
**Type:** Server Component (for SEO)

**Structure:**
- Root `page.tsx`: Sets metadata, wraps with provider
- `page-content.tsx`: Client component with interactivity
- `loading.tsx`: Loading skeleton

**Features:**
- Hero section with title and description
- Search and filter controls
- Responsive vehicle grid
- Pagination with URL persistence
- Results count
- Empty state with clear filters option

**SEO:**
- Static metadata in `page.tsx`
- JSON-LD CollectionPage structured data
- h1: "Browse Classic & Vintage Vehicles for Hire"
- Open Graph and Twitter Card meta tags

#### Detail Page (`/vehicles/[id]/page.tsx`)
**Type:** Server Component (for dynamic SEO)

**Structure:**
- Single `page.tsx` with `generateMetadata()` async function
- Custom components in `_components/` directory
- `loading.tsx`: Loading skeleton

**Layout:**
- Back to catalog navigation
- h1: Vehicle name (Year Make Model)
- Two-column layout:
  - Left (2/3): Image gallery
  - Right (1/3): Details, specs, location, collections

**Components:**
- `PublicVehicleMediaSection`: Image gallery (no edit buttons)
- `PublicVehicleBasicInfo`: Vehicle details (no price)
- `VehicleLocation`: Location only (no contact info)
- `VehicleSpecifications`: Technical specs (reused from admin)
- `VehicleCollections`: Tags/categories (reused from admin)

**SEO:**
- Dynamic metadata per vehicle
- JSON-LD Product structured data
- Dynamic h1 with vehicle name
- Semantic HTML with aria labels
- Open Graph images (primary vehicle photo)

### Context & State Management

#### PublicVehicleFiltersContext
Location: `src/contexts/PublicVehicleFiltersContext.tsx`

**Purpose:** Manages filter state with URL persistence

**Features:**
- URL as single source of truth
- Shareable links
- Browser back/forward support
- Bookmark support

**Filter State:**
```typescript
{
  search?: string;
  makeIds?: string[];
  modelId?: string;
  collectionIds?: string[];
  yearFrom?: string;
  yearTo?: string;
  countryIds?: string[];
  counties?: string[];
  page?: number;
  sortBy?: "createdAt" | "updatedAt" | "year" | "name";
  sortOrder?: "asc" | "desc";
  viewMode?: "table" | "cards";
}
```

**Hook:** `usePublicVehicleFilters()`
- `filters`: Current filter state from URL
- `updateFilters(updates)`: Update one or more filters
- `clearFilters()`: Reset all filters
- `hasActiveFilters`: Boolean if any non-default filters active

### Components

#### PublicVehicleCard
Location: `src/app/vehicles/_components/PublicVehicleCard.tsx`

**Displays:**
- Primary image
- Year Make Model
- Location (city, county, country)
- Collection badges (up to 3, +N for more)
- NO price

**Features:**
- Link to detail page
- Hover effects
- Responsive images
- Semantic HTML

#### PublicVehicleGrid
Location: `src/app/vehicles/_components/PublicVehicleGrid.tsx`

**Features:**
- Responsive grid layout
- Loading skeleton (12 cards)
- Empty state with clear filters button
- Handles loading and error states

#### PublicVehicleFilters
Location: `src/app/vehicles/_components/PublicVehicleFilters.tsx`

**Filters:**
- Search input
- Make (multi-select)
- Model (single-select, dependent on make)
- Decade (multi-select, translates to yearFrom/yearTo)
- Country (multi-select)
- County (multi-select)
- Collections (multi-select with colors)

**Mobile:**
- Search bar always visible
- Filters in bottom sheet

**Desktop:**
- All filters inline in horizontal layout
- Clear all button

#### PublicVehicleMediaSection
Location: `src/app/vehicles/[id]/_components/PublicVehicleMediaSection.tsx`

**Features:**
- Main image display (3:2 aspect ratio)
- Image navigation (prev/next arrows)
- Thumbnail gallery below
- Collection badges overlay
- NO edit buttons or admin actions

#### PublicVehicleBasicInfo
Location: `src/app/vehicles/[id]/_components/PublicVehicleBasicInfo.tsx`

**Displays:**
- Make & Model
- Year
- Registration
- Engine capacity
- Number of seats
- Steering type
- Gearbox
- Colors (exterior, interior)
- Condition
- Road legal status
- Description
- NO price fields

#### VehicleLocation
Location: `src/app/vehicles/[id]/_components/VehicleLocation.tsx`

**Displays:**
- Country
- County
- City
- Postcode (first part only, e.g., "SW1" from "SW1A 1AA")
- Owner name (first + last)
- NO email, phone, or full postcode

## SEO Implementation

### Metadata

**Catalog Page:**
```typescript
title: "Browse Classic & Vintage Vehicles for Hire | SpokeHire"
description: "Discover our collection of meticulously maintained classic and vintage vehicles..."
keywords: ["classic cars", "vintage vehicles", "car hire", ...]
openGraph: { title, description, type: "website" }
twitter: { card: "summary_large_image", ... }
canonical: "/vehicles"
```

**Detail Page (Dynamic):**
```typescript
title: `${year} ${make} ${model} for Hire | SpokeHire`
description: vehicle.description ?? `Browse details of this ${year} ${make} ${model}...`
keywords: [make, model, year, "classic car hire", ...]
openGraph: { title, description, images: [primaryImage], ... }
twitter: { card: "summary_large_image", images: [primaryImage] }
canonical: `/vehicles/${id}`
```

### JSON-LD Structured Data

**Catalog Page:**
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Classic & Vintage Vehicles for Hire",
  "description": "Browse our collection of classic and vintage vehicles",
  "url": "https://spokehire.com/vehicles"
}
```

**Detail Page:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "1965 Ferrari 250 GTO",
  "description": "...",
  "brand": { "@type": "Brand", "name": "Ferrari" },
  "model": "250 GTO",
  "image": ["https://..."],
  "offers": {
    "@type": "Offer",
    "availability": "https://schema.org/InStock",
    "url": "https://spokehire.com/vehicles/abc123"
  },
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "Year", "value": "1965" },
    ...
  ]
}
```

### Semantic HTML

**Proper Heading Hierarchy:**
- h1: Page/vehicle title
- h2: Section headings (Gallery, Specifications, Location, Collections)
- Screen reader only h2 tags with `sr-only` class

**ARIA Labels:**
- `<article>` for vehicle cards and detail sections
- `<section aria-label="...">` for major page sections
- `<main>` for primary content
- `<header>` for page headers

## Performance Optimizations

### Server-Side Rendering
- All pages are Server Components by default
- SEO-critical content rendered on server
- Fast initial page load

### Image Optimization
- Next.js Image component
- Responsive sizes
- Lazy loading (off-screen images)
- Priority loading for hero images

### Caching
- Client-side: 30s stale time for vehicle lists
- Client-side: 5min stale time for filter options
- Server-side: Cache in VehicleService (60s)
- URL-based state = browser cache friendly

### Code Splitting
- Server Components don't ship JS
- Client Components only when needed (filters, interactivity)
- Filter sheet lazy-loaded on mobile

## Security Considerations

### Data Filtering
- API enforces PUBLISHED status
- Owner contact info excluded in router
- Price information not included
- Admin fields filtered out

### Access Control
- Public endpoints use `publicProcedure`
- No authentication checks needed
- Rate limiting handled by Vercel/infrastructure

## File Structure

```
spoke-hire-web/src/
├── server/api/routers/
│   └── public-vehicle.ts              # Public tRPC router
│
├── hooks/
│   └── usePublicVehicleFilters.ts     # Filter hook with URL persistence
│
├── contexts/
│   └── PublicVehicleFiltersContext.tsx # Filter context provider
│
├── app/vehicles/
│   ├── page.tsx                        # Catalog page (Server Component)
│   ├── page-content.tsx                # Catalog content (Client Component)
│   ├── loading.tsx                     # Catalog loading skeleton
│   ├── _components/
│   │   ├── PublicVehicleFilters.tsx    # Filter controls
│   │   ├── PublicVehicleGrid.tsx       # Vehicle grid
│   │   └── PublicVehicleCard.tsx       # Vehicle card
│   │
│   └── [id]/
│       ├── page.tsx                    # Detail page (Server Component with dynamic metadata)
│       ├── loading.tsx                 # Detail loading skeleton
│       └── _components/
│           ├── PublicVehicleMediaSection.tsx     # Image gallery (public version)
│           ├── PublicVehicleBasicInfo.tsx        # Vehicle details (public version)
│           └── VehicleLocation.tsx               # Location display (no contact info)
```

## Testing Checklist

### Catalog Page
- [ ] Page loads without authentication
- [ ] Only PUBLISHED vehicles displayed
- [ ] Search works correctly
- [ ] Each filter type works independently
- [ ] Multiple filters work together
- [ ] Decade filter sets correct year range
- [ ] URL updates when filters change
- [ ] Browser back/forward works with filters
- [ ] Pagination works correctly
- [ ] Empty state shows when no results
- [ ] Clear filters button works
- [ ] Mobile filter sheet works
- [ ] Responsive grid layouts correctly
- [ ] Images load with proper optimization

### Detail Page
- [ ] Page loads without authentication
- [ ] Only PUBLISHED vehicles accessible
- [ ] Non-published vehicles return 404
- [ ] Invalid IDs return 404
- [ ] Vehicle name in h1
- [ ] All sections render correctly
- [ ] Images gallery navigation works
- [ ] Thumbnail selection works
- [ ] No price displayed
- [ ] No contact info displayed (email, phone)
- [ ] Location shows correctly (country, county, city)
- [ ] Only first part of postcode shown
- [ ] Collections displayed with colors
- [ ] Specifications render correctly
- [ ] Back button works

### SEO
- [ ] Catalog page has correct metadata
- [ ] Detail page generates dynamic metadata
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] JSON-LD structured data valid
- [ ] Canonical URLs correct
- [ ] Image alt texts meaningful
- [ ] Heading hierarchy correct (h1, h2)
- [ ] Semantic HTML used throughout

### Performance
- [ ] Initial page load < 3s
- [ ] Images lazy load
- [ ] Client bundle size reasonable
- [ ] No unnecessary re-renders
- [ ] Filters don't cause full page reload

## Future Enhancements

### Potential Features
1. **Distance-based filtering** - Show vehicles within X miles
2. **Sort options** - Sort by year, make, recently added
3. **Wishlist/Favorites** - Save vehicles (with local storage)
4. **Share functionality** - Easy social media sharing
5. **Similar vehicles** - Recommendations on detail page
6. **Advanced filters** - More granular options
7. **Map view** - Show vehicles on a map
8. **Request quote** - Contact form on detail page
9. **Gallery lightbox** - Full-screen image viewer
10. **SEO sitemap** - Auto-generated XML sitemap

### Optimization Opportunities
1. **Static generation** - Pre-render popular vehicles
2. **CDN caching** - Cache static assets globally
3. **Image WebP** - Modern format for smaller sizes
4. **Prefetching** - Prefetch detail pages on hover
5. **Virtual scrolling** - For very long lists
6. **Service worker** - Offline support

## Related Documentation

- [Vehicle Management](./vehicles-management.md) - Admin vehicle interface
- [Database Optimization](../architecture/database-optimization.md) - Query performance
- [API Service Layer](./api-service-layer.md) - Backend architecture

## Changelog

### November 2, 2025 - Initial Implementation
- Created public tRPC router with list, getById, getFilterOptions endpoints
- Implemented public vehicle catalog page with filters
- Built public vehicle detail page with dynamic SEO
- Added JSON-LD structured data
- Implemented URL-based filter persistence
- Created responsive UI components
- Added proper semantic HTML and accessibility
- Excluded price and contact information from public view
- Server-side rendering for optimal SEO

