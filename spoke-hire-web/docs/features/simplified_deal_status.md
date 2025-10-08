# Simplified Deal Status System

## Overview
Simplified the deal status system from 5 states (DRAFT, SENT, ACTIVE, EXPIRED, CANCELLED) to just 2 states (ACTIVE, ARCHIVED), matching the vehicles approach. Added archive/unarchive functionality throughout the UI.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)
**Updated `DealStatus` enum:**
```prisma
enum DealStatus {
  ACTIVE
  ARCHIVED
}
```

**Updated `Deal` model:**
- Changed default status from `DRAFT` to `ACTIVE`
- All new deals are now created as `ACTIVE`

### 2. Backend Services

#### Deal Service (`src/server/api/services/deal.service.ts`)
**Removed:**
- `updateDealStatus()` method
- `markDealAsSent()` method
- Complex status transitions

**Added:**
- `archiveDeal()` - Archives a deal by setting status to `ARCHIVED`
- `unarchiveDeal()` - Unarchives a deal by setting status to `ACTIVE`

**Updated:**
- `addVehiclesToDeal()` - Now prevents adding vehicles to `ARCHIVED` deals (instead of `DRAFT` check)
- `deleteDeal()` - Now soft deletes by archiving the deal

#### Deal Router (`src/server/api/routers/deal.ts`)
**Updated validation schemas:**
- `listDealsInputSchema` - Status filter now accepts only `ACTIVE` or `ARCHIVED`
- `updateDealStatusInputSchema` - Simplified to only `ACTIVE` or `ARCHIVED`

**Added procedures:**
- `archive` - Archive a specific deal
- `unarchive` - Unarchive a specific deal

**Updated:**
- `send` procedure - Removed the `markDealAsSent` call since deals stay `ACTIVE` after sending

### 3. Frontend Components

#### Deals List Page (`src/app/admin/deals/page.tsx`)
**Added:**
- Archive filter toggle button (similar to vehicles page)
- URL-based filter state using `?archived=true`
- Archive/Unarchive actions in dropdown menu
- Mutations for archive/unarchive with optimistic updates

**Updated:**
- Status badge variants (only `ACTIVE` and `ARCHIVED`)
- Results count text to show "active" or "archived"
- Empty state messages

**Features:**
- Toggle between active and archived deals
- Archive button in dropdown for active deals
- Unarchive button in dropdown for archived deals
- Real-time updates after archive/unarchive actions

#### Deal Detail Page (`src/app/admin/deals/[id]/page.tsx`)
**Added:**
- Archive/Unarchive button in header (next to UserMenu)
- Button shows `Archive` icon for active deals
- Button shows `ArchiveRestore` icon for archived deals
- Responsive design - icon only on mobile, text + icon on desktop

**Updated:**
- Status badge variants (only `ACTIVE` and `ARCHIVED`)
- Added mutations for archive/unarchive with cache invalidation

#### Create Deal Dialog (`src/app/admin/vehicles/_components/CreateDealDialog.tsx`)
**Updated:**
- Now fetches only `ACTIVE` deals when in "Add to existing deal" mode
- Updated placeholder text from "Select a draft deal..." to "Select an active deal..."
- All new deals are created with `ACTIVE` status by default

### 4. Database Migration

**Migration file:** `prisma/migrations/simplify_deal_status.sql`

**Migration steps:**
1. Create temporary column for status conversion
2. Convert existing values:
   - `DRAFT`, `SENT`, `ACTIVE` → `ACTIVE`
   - `EXPIRED`, `CANCELLED` → `ARCHIVED`
3. Drop old status column and enum
4. Create new `DealStatus` enum with only `ACTIVE` and `ARCHIVED`
5. Recreate status column with new enum
6. Copy converted values back
7. Drop temporary column
8. Recreate indexes

**Data preservation:**
- Existing draft and sent deals become active
- Expired and cancelled deals become archived
- No data loss

## User Workflow

### Viewing Deals
1. Navigate to `/admin/deals`
2. By default, see all **active deals**
3. Click "Show Archived" to view **archived deals**
4. Click "Show Active" to return to active deals view

### Archiving a Deal
**From List Page:**
1. Find deal in the list
2. Click the ⋯ (more) button
3. Select "Archive"
4. Deal moves to archived view

**From Detail Page:**
1. View deal details
2. Click "Archive" button in header
3. Deal is archived
4. Status badge updates to "Archived"

### Unarchiving a Deal
**From List Page:**
1. Toggle to "Show Archived" view
2. Find archived deal
3. Click the ⋯ (more) button
4. Select "Unarchive"
5. Deal moves back to active view

**From Detail Page:**
1. View archived deal details
2. Click "Unarchive" button in header
3. Deal becomes active
4. Status badge updates to "Active"

### Adding Vehicles to Deals
- Can only add vehicles to **active** deals
- Archived deals cannot be modified
- Must unarchive first if you want to add more vehicles

## UI/UX Improvements

1. **Consistent with Vehicles:** Uses the same archive/unarchive pattern as the vehicles page
2. **Clear Visual Feedback:** Toast notifications for all archive/unarchive actions
3. **Status Badges:**
   - `ACTIVE` - Blue/default variant
   - `ARCHIVED` - Gray/secondary variant
4. **Responsive Design:** Archive buttons adapt to screen size
5. **URL State:** Archive filter persists in URL for bookmarking/sharing

## Technical Benefits

1. **Simpler State Machine:** Only 2 states instead of 5 reduces complexity
2. **No Status Transitions:** Deals don't change status when sent
3. **Clearer Intent:** Archive/unarchive is more intuitive than status updates
4. **Matches Vehicles:** Consistent patterns across the app
5. **Less Code:** Removed unnecessary status management logic

## Breaking Changes

⚠️ **Important:** This is a breaking change for existing deals with these statuses:
- `DRAFT` → Converted to `ACTIVE`
- `SENT` → Converted to `ACTIVE`
- `EXPIRED` → Converted to `ARCHIVED`
- `CANCELLED` → Converted to `ARCHIVED`

The migration handles this automatically, but any code relying on the old status values will need to be updated.

## API Changes

### Removed Endpoints
- `deal.updateStatus` - Use `archive` or `unarchive` instead

### Modified Endpoints
- `deal.list` - `status` filter now only accepts `ACTIVE` or `ARCHIVED`
- `deal.addVehiclesToDeal` - Rejects archived deals instead of draft check

### New Endpoints
- `deal.archive` - Archives a deal
- `deal.unarchive` - Unarchives a deal

## Files Changed

1. `prisma/schema.prisma` - Updated DealStatus enum
2. `src/server/api/services/deal.service.ts` - Simplified status management
3. `src/server/api/routers/deal.ts` - Updated procedures and validation
4. `src/app/admin/deals/page.tsx` - Added archive filtering
5. `src/app/admin/deals/[id]/page.tsx` - Added archive/unarchive button
6. `src/app/admin/vehicles/_components/CreateDealDialog.tsx` - Updated to use ACTIVE deals
7. `prisma/migrations/simplify_deal_status.sql` - Database migration script

## Testing Checklist

- [x] Database migration executes successfully
- [x] Prisma client regenerated
- [x] No linter errors
- [ ] Active deals display in default view
- [ ] Archived deals display when filter toggled
- [ ] Archive action works from list page
- [ ] Archive action works from detail page
- [ ] Unarchive action works from list page
- [ ] Unarchive action works from detail page
- [ ] Cannot add vehicles to archived deals
- [ ] Can add vehicles to active deals
- [ ] Status badges display correctly
- [ ] Toast notifications appear
- [ ] URL filter state persists

