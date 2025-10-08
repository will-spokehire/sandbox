# Deals Workflow Enhancements

## Overview
Enhanced the deals workflow to support both creating new deals and adding vehicles to existing draft deals. Added debug mode for email testing.

## Features Implemented

### 1. Create New Deal or Add to Existing Deal
Users can now choose between:
- **Create new deal**: Enter a new deal name and description
- **Add to existing deal**: Select from a list of existing draft deals

#### UI Components
- Radio button group to toggle between modes
- Dropdown selector for existing deals (shows vehicle and recipient counts)
- Conditional form fields based on selected mode

#### Backend Support
- New `addVehiclesToDeal` service method in `DealService`
- New `addVehiclesToDeal` tRPC procedure
- Automatic duplicate detection for vehicles and recipients
- Validates deal is in DRAFT status before adding vehicles

### 2. Simplified Deal Statistics Display
- Removed detailed owner list from the dialog
- Shows only summary statistics:
  - Number of vehicles selected
  - Number of unique owners

### 3. Email Debug Mode
- Emails are logged to console instead of being sent when:
  - `DEBUG=true` environment variable is set, OR
  - `NODE_ENV=development` (automatic in development)
- Console output includes:
  - Recipient email
  - Deal name and description
  - Full vehicle details (make, model, year, price, registration, image URL)
- Production mode sends actual emails (set `DEBUG=false`)

## Technical Changes

### Backend

#### Services (`src/server/api/services/deal.service.ts`)
- Added `AddVehiclesToDealParams` interface
- Added `addVehiclesToDeal()` method:
  - Validates deal exists and is in DRAFT status
  - Validates all vehicles exist
  - Gets current max order for proper vehicle ordering
  - Checks for duplicate vehicles and recipients
  - Adds only new vehicles and recipients to the deal
  - Returns updated deal with full details

#### Email Service (`src/server/api/services/email.service.ts`)
- Added `isDebugMode` property
- Debug mode checks `DEBUG` env var or `NODE_ENV=development`
- Enhanced console logging with formatted output:
  ```
  ================================================================================
  📧 [EMAIL DEBUG] Email Details:
  ================================================================================
  To: owner@example.com
  Deal Name: Classic Cars Collection
  ...
  ```

#### tRPC Router (`src/server/api/routers/deal.ts`)
- Added `addVehiclesToDealInputSchema` validation schema
- Added `addVehiclesToDeal` procedure:
  - Input: `dealId`, `vehicleIds[]`, `recipientIds[]`
  - Calls `DealService.addVehiclesToDeal()`
  - Returns updated deal

### Frontend

#### Dialog Component (`src/app/admin/vehicles/_components/CreateDealDialog.tsx`)
- Added mode state: `"existing"` | `"new"`
- Added `selectedDealId` state
- Fetch existing draft deals via `api.deal.list.useQuery()`
- Added `addVehiclesMutation` for adding vehicles to existing deals
- Updated submit handler to branch based on mode
- Added UI components:
  - `RadioGroup` for mode selection
  - `Select` dropdown for existing deals
  - Conditional rendering of form fields
- Updated button text and disabled state based on mode

#### UI Components Added
- Installed `radio-group` component from shadcn/ui

### Environment Configuration (`env.example.txt`)
Added email configuration:
```bash
# Loops API Key for sending transactional emails
LOOPS_API_KEY=""

# Debug Mode - logs emails to console instead of sending
DEBUG="true"
```

## User Flow

### Creating a New Deal
1. Select vehicles from the vehicles list
2. Click "Send Deal" button
3. In dialog:
   - See vehicle and owner count
   - Choose "Create new deal"
   - Enter deal name and description
   - Click "Send Deal to Owners"
4. System creates deal and sends emails to vehicle owners

### Adding to Existing Deal
1. Select vehicles from the vehicles list
2. Click "Send Deal" button
3. In dialog:
   - See vehicle and owner count
   - Choose "Add to existing deal"
   - Select a draft deal from dropdown
   - Click "Add & Send to Owners"
4. System adds vehicles and owners to existing deal and sends emails

## Validation

### Backend Validation
- Deal must exist
- Deal must be in DRAFT status for adding vehicles
- All vehicles must exist
- All recipients must exist
- Automatic deduplication of vehicles and recipients

### Frontend Validation
- Must select at least one vehicle
- Must have vehicle owners
- When using existing deal mode: must select a deal
- When creating new deal: name is required (1-255 characters)

## API Endpoints

### New Procedure
```typescript
api.deal.addVehiclesToDeal
  Input: {
    dealId: string (cuid)
    vehicleIds: string[] (1-20 items)
    recipientIds: string[] (1-100 items)
  }
  Returns: DealWithDetails
```

## Database Changes
No new database schema changes required. Uses existing:
- `Deal` model
- `DealVehicle` model (with `order` field)
- `DealRecipient` model

## Benefits
1. **Flexibility**: Users can group vehicles into deals over time
2. **Efficiency**: No need to select all vehicles at once
3. **Organization**: Keep related deals together
4. **Testing**: Debug mode prevents accidental emails during development
5. **UX**: Simplified dialog with clear statistics

## Future Enhancements
- Edit deal name/description after creation
- Remove vehicles from deals
- Preview deal content before sending
- Bulk deal operations
- Deal templates

