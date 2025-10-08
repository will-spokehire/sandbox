# Changelog

All notable changes to the SpokeHire Admin Interface will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Owner contact actions (Copy Email, Copy Phone, WhatsApp Chat) across all vehicle/deal pages
- `useClipboard` custom hook for clipboard operations with toast feedback
- `OwnerContactActions` reusable component for consistent contact UI
- WhatsApp integration utilities (`getWhatsAppChatUrl`, `generateDealMessage`)
- "Send Deal via WhatsApp" action on deal detail page with templated messages
- Responsive dropdown menus for contact actions on mobile devices

### Changed
- Refactored duplicated contact action code into shared utilities
- Updated `VehicleListItem` type to include owner phone number
- Enhanced deal detail page with owner information and contact actions
- Improved vehicle card layouts with better visual hierarchy

### Documentation
- Added comprehensive Owner Contact Actions feature documentation
- Reorganized documentation structure into `docs/setup/`, `docs/features/`, and `docs/architecture/`
- Consolidated performance documentation into single comprehensive guide
- Consolidated deals documentation into single comprehensive guide
- Created comprehensive Supabase setup guide
- Added getting started guide for new developers
- Added database optimization guide with N+1 query solutions
- Added migration history documentation
- Updated README with proper project overview

---

## [2.0.0] - January 2025

### Major Changes

#### Deals Workflow Simplified
- **Automatic recipient detection** - Recipients automatically determined from vehicle owners
- **Simplified status system** - Reduced from 5 states to 2 (ACTIVE/ARCHIVED)
- **Add to existing deals** - Can now add vehicles to existing deals with automatic deduplication
- **Archive functionality** - Archive/unarchive deals throughout UI

#### Type Safety & Performance Improvements
- Replaced all `any` types with proper Prisma types
- Added `RecipientStatus` enum (PENDING, SENT, FAILED)
- Implemented transaction handling for data consistency
- Enhanced error handling throughout backend

### Added
- Archive filter toggle on deals list page
- Archive/Unarchive buttons in deal detail page
- URL-based filter state (`?archived=true`)
- Optimistic UI updates for archive actions
- Debug mode for email testing (`DEBUG=true`)
- Mode toggle: Create new deal vs. Add to existing deal
- Email tracking (sent, opened, clicked timestamps)

### Changed
- `DealStatus` enum: Now only `ACTIVE` and `ARCHIVED`
- `DealRecipient.status`: Changed from string to `RecipientStatus` enum
- All deals created as `ACTIVE` immediately (no DRAFT state)
- `createDeal` and `addVehiclesToDeal` now use database transactions
- Removed manual user selection UI in favor of automatic detection

### Removed
- `updateDealStatus()` and `markDealAsSent()` methods
- Complex status transitions
- Manual recipient selection UI
- DRAFT, SENT, EXPIRED, CANCELLED deal statuses

### Migration Required
- Run `prisma/migrations/add_recipient_status_enum.sql`
- Run `prisma/migrations/simplify_deal_status.sql`

---

## [1.5.0] - October 2025

### Performance Optimizations

#### Backend
- **Server-side caching** with 5-minute TTL for `getFilterOptions`
- **Parallel query execution** using `Promise.all()` for independent queries
- **Raw SQL for DISTINCT queries** (much faster than Prisma's distinct)
- **Optional total count** in pagination (only fetch on first page)
- **Limited relations** with `take` limits (100 media, 200 specs, 20 sources)
- **Cache invalidation** on vehicle mutations

#### Frontend
- TanStack Query staleTime: 30s for lists, 5min for filters
- Reduced unnecessary refetches
- Optimistic UI updates where applicable

#### Database
- Added 8 performance indexes:
  - `idx_vehicle_status_created` - Status + CreatedAt composite
  - `idx_vehicle_search_name` - Full-text search on name
  - `idx_vehicle_search_registration` - Full-text search on registration
  - `idx_vehicle_search_description` - Full-text search on description
  - `idx_user_search_name_email` - Full-text search on owner info
  - `idx_user_search_phone` - Full-text search on phone
  - `idx_vehicle_status_year` - Status + Year composite
  - `idx_vehicle_status_price` - Status + Price composite

### Performance Impact
- `getFilterOptions`: 3,468ms → ~300ms (90% faster)
- `getFilterOptions` (cached): 3,468ms → ~15ms (99% faster)
- `getById`: 2,388ms → ~650ms (73% faster)
- `list` (with count): ~1,500ms → ~1,000ms (33% faster)
- `list` (no count): ~1,500ms → ~700ms (53% faster)

### Migration Required
- Run `scripts/apply-performance-indexes.ts`

---

## [1.0.0] - October 2025

### Initial Release

#### Features
- **Vehicle Management**
  - CRUD operations for vehicles
  - Advanced filtering and search
  - Bulk operations with checkboxes
  - Image gallery and management
  - Status management (DRAFT, PUBLISHED, ARCHIVED)

- **Deals Workflow**
  - Create and send job offers
  - Select vehicles and recipients
  - Email delivery via Loops
  - Delivery status tracking
  - Deal detail pages

- **Authentication**
  - Supabase Auth integration
  - Email OTP (passwordless)
  - Protected admin routes
  - Row Level Security (RLS)

- **Admin Interface**
  - Dashboard with statistics
  - Vehicle list with pagination
  - Vehicle detail pages
  - Deals management
  - User management

#### Tech Stack
- Next.js 15 (App Router, React Server Components)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (New York style)
- tRPC for API
- PostgreSQL via Supabase
- Prisma ORM
- React Hook Form + Zod
- TanStack Query

#### Database
- Initial schema for vehicles, users, media
- Make and Model tables for normalized data
- Deal, DealVehicle, DealRecipient tables
- PostGIS extension for geospatial queries
- User geolocation for distance filtering

---

## Guidelines for Maintainers

### Adding New Entries

When making changes, update this changelog with:

```markdown
### Added
- New feature description

### Changed
- Modified feature description

### Deprecated
- Feature that will be removed soon

### Removed
- Removed feature description

### Fixed
- Bug fix description

### Security
- Security improvement description
```

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### When to Update

- **Immediately** when merging significant changes to main
- **Before releases** - Review and consolidate entries
- **Include migration notes** for breaking changes

---

## Links

- [Repository](https://github.com/your-org/spokehire)
- [Documentation](./docs/)
- [Issues](https://github.com/your-org/spokehire/issues)

---

**Note:** This changelog was established in January 2025. Previous changes are documented in feature-specific documentation files.

