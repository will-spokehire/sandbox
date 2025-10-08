# Deals/Job Offers Workflow

**Status:** ✅ Implemented and Production-Ready  
**Last Updated:** January 2025  
**Version:** 2.0 (Simplified & Enhanced)

---

## Overview

The Deals Workflow feature allows administrators to send vehicle job offers to users via email. The current implementation uses a **simplified approach** where recipients are automatically determined from the selected vehicles' owners.

### Key Features
- ✅ Select vehicles and automatically send to owners
- ✅ Create new deals or add vehicles to existing deals
- ✅ Email delivery via Loops integration
- ✅ Simplified two-status system (ACTIVE/ARCHIVED)
- ✅ Email delivery tracking
- ✅ Debug mode for testing

---

## User Flow

### Quick Workflow (Simplified)

**The simplified workflow eliminates manual recipient selection:**

1. **Select Vehicles** → Go to `/admin/vehicles` and check 1-20 vehicles
2. **Click "Send Deal"** → Opens dialog
3. **Recipients Determined Automatically** → System extracts unique owners from selected vehicles
4. **Fill Deal Details** → Enter name and description
5. **Send** → Emails go directly to vehicle owners!

### Automatic Deduplication Example

**You select 5 vehicles:**
- Vehicle 1: Owner = John (john@example.com)
- Vehicle 2: Owner = Jane (jane@example.com)
- Vehicle 3: Owner = John (john@example.com) ← Same as Vehicle 1
- Vehicle 4: Owner = Bob (bob@example.com)
- Vehicle 5: Owner = Jane (jane@example.com) ← Same as Vehicle 2

**Result:**
- **3 emails sent** (not 5!)
- John gets 1 email: "Dear John, I'm contacting you regarding your Vehicle 1, Vehicle 3..."
- Jane gets 1 email: "Dear Jane, I'm contacting you regarding your Vehicle 2, Vehicle 5..."
- Bob gets 1 email: "Dear Bob, I'm contacting you regarding your Vehicle 4..."

Each recipient only sees their own vehicles in their personalized email.

### Detailed Steps

#### 1. Select Vehicles
1. Navigate to `/admin/vehicles`
2. Use checkboxes to select vehicles (1-20 limit)
3. Selected count shows in header badge
4. Click **"Send Deal"** button when ready

#### 2. Create & Send Deal
Dialog shows:
- ✅ Selected vehicles count
- ✅ **Automatically detected vehicle owners** (read-only display)
- ✅ Deal name field (required)
- ✅ Description field (optional)
- ✅ **Option to create new or add to existing deal**

Actions:
- Fill in deal name (e.g., "Classic Cars - March 2025")
- Add optional description
- Choose "Create new deal" or "Add to existing deal"
- Click **"Send Deal to Owners"**
- System creates deal and **automatically sends emails** via Loops (server-side)
- Success toast confirms deal creation and email delivery

**Email Behavior (Automatic Server-Side):**
- ✅ **Creating a new deal** → All recipients receive personalized emails automatically
- ✅ **Adding vehicles to existing deal** → Only NEW vehicle owners receive emails
- ✅ **Existing recipients are NOT re-notified** when new vehicles are added
- ✅ **Each email is personalized** → Recipients only see their own vehicles from the deal
- ✅ **Atomic operation** → Deal creation and email sending happen together on the server
- ✅ **Error handling** → If emails fail, deal is still created (emails can be manually resent)

#### 3. View Deals
1. Navigate to `/admin/deals`
2. View all deals in a table:
   - Deal name & description
   - Status badge (ACTIVE/ARCHIVED)
   - Vehicle count
   - Recipient count
   - Created date
   - Creator name
3. Toggle between active and archived deals
4. Click on a deal to view details

#### 4. View Deal Details
Navigate to `/admin/deals/[id]` to see:
- Basic deal info (name, description, status, dates)
- List of vehicles included with images
- Recipients list with delivery status
- Email tracking (sent, opened, clicked timestamps)

---

## Database Schema

### Deal Model
```prisma
model Deal {
  id          String      @id @default(cuid())
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  name        String
  description String?
  status      DealStatus  @default(ACTIVE)
  
  createdById String
  createdBy   User        @relation("DealsCreated", fields: [createdById], references: [id])
  
  vehicles    DealVehicle[]
  recipients  DealRecipient[]
}
```

### Deal Status Enum (Simplified)
```prisma
enum DealStatus {
  ACTIVE    # Deal is active/visible
  ARCHIVED  # Deal is archived/hidden
}
```

**Status Transitions:**
- New deals created as `ACTIVE`
- Users can archive/unarchive deals
- Archived deals hidden by default in list view

**Why Simplified?**
- Original 5-state system (DRAFT, SENT, ACTIVE, EXPIRED, CANCELLED) was overly complex
- Most deals follow a simple "active then archive" lifecycle
- Matches the simpler vehicles status pattern

### DealVehicle Model
```prisma
model DealVehicle {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  
  dealId    String
  deal      Deal     @relation(fields: [dealId], references: [id], onDelete: Cascade)
  
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  
  order     Int      @default(0)
}
```

### DealRecipient Model
```prisma
model DealRecipient {
  id             String           @id @default(cuid())
  createdAt      DateTime         @default(now())
  sentAt         DateTime?
  
  dealId         String
  deal           Deal             @relation(fields: [dealId], references: [id], onDelete: Cascade)
  
  userId         String
  user           User             @relation(fields: [userId], references: [id])
  
  status         RecipientStatus  @default(PENDING)
  emailSentAt    DateTime?
  emailOpenedAt  DateTime?
  emailClickedAt DateTime?
  errorMessage   String?
}

enum RecipientStatus {
  PENDING  # Email not yet sent
  SENT     # Email sent successfully
  FAILED   # Email send failed
}
```

---

## Backend API (tRPC)

### Deal Router
**Location:** `src/server/api/routers/deal.ts`

#### Procedures

**`deal.list`** - Get paginated list of deals
```typescript
Input: { limit?, cursor?, status?: "ACTIVE" | "ARCHIVED" }
Output: { deals[], nextCursor? }
Auth: Admin only
```

**`deal.getById`** - Get deal with full details
```typescript
Input: { id }
Output: Deal with vehicles and recipients
Auth: Admin only
```

**`deal.create`** - Create new deal
```typescript
Input: { 
  name: string
  description?: string
  vehicleIds: string[]
  recipientIds: string[]
}
Output: Created deal
Auth: Admin only
Validation: 1-20 vehicles, at least 1 recipient
```

**`deal.addVehiclesToDeal`** - Add vehicles to existing deal
```typescript
Input: { 
  dealId: string
  vehicleIds: string[]
  recipientIds: string[]
}
Output: Updated deal
Auth: Admin only
Features:
  - Automatic duplicate detection
  - Only adds new vehicles/recipients
  - Validates deal is ACTIVE
```

**`deal.send`** - Send deal to recipients via email
```typescript
Input: { dealId, recipientIds? }
Output: { success, total, sent, failed, results[] }
Auth: Admin only
Actions:
  - Sends emails via Loops
  - Updates recipient status
  - Keeps deal as ACTIVE
```

**`deal.archive`** - Archive a deal
```typescript
Input: { id }
Output: Updated deal
Auth: Admin only
```

**`deal.unarchive`** - Unarchive a deal
```typescript
Input: { id }
Output: Updated deal
Auth: Admin only
```

### Deal Service
**Location:** `src/server/api/services/deal.service.ts`

**Key Methods:**
- `listDeals()` - List deals with pagination and status filter
- `getDealById()` - Get deal details with full relations
- `createDeal()` - Create new deal with vehicles and recipients (uses transaction)
- `addVehiclesToDeal()` - Add vehicles to existing deal (with deduplication)
- `sendDeal()` - Coordinate email sending process
- `archiveDeal()` - Archive a deal
- `unarchiveDeal()` - Unarchive a deal
- `getDealVehicles()` - Get vehicles for email content
- `getDealRecipients()` - Get recipients for sending
- `updateRecipientStatus()` - Update delivery status

**Type Safety Improvements:**
- Uses `PrismaClient` instead of `any` for db type
- Proper Prisma types: `Prisma.DealWhereInput`, `Prisma.DealRecipientWhereInput`
- Custom type `DealWithDetails` for complex return types
- Transaction handling for data consistency

### Email Service
**Location:** `src/server/api/services/email.service.ts`

**Methods:**
- `sendDealEmail()` - Send single deal email
- `sendBulkEmails()` - Send to multiple recipients
- `testConnection()` - Test Loops API connection

**Debug Mode:**
- Enabled when `DEBUG=true` or `NODE_ENV=development`
- Logs emails to console instead of sending
- Shows formatted email content with recipient and vehicle details
- Useful for testing without consuming API quota

---

## Frontend Components

### Vehicle Selection
**Location:** `src/app/admin/vehicles/page.tsx`

**Features:**
- Checkbox column in vehicle table
- "Select All" checkbox in header
- Selection count badge
- "Send Deal" button (appears when vehicles selected)
- Selection state management

### CreateDealDialog
**Location:** `src/app/admin/vehicles/_components/CreateDealDialog.tsx`

**Features:**
- **Automatic recipient detection from vehicle owners**
- Deal name and description inputs
- Mode toggle: Create new vs. Add to existing deal
- Dropdown to select existing ACTIVE deals
- Shows vehicle and recipient counts
- Real-time validation
- Loading states during creation and sending
- Success/error toasts
- Simplified UI (removed manual user search)

**Mode Options:**
1. **Create New Deal** - Enter name and description for new deal
2. **Add to Existing Deal** - Select from dropdown of ACTIVE deals

### Deals List Page
**Location:** `src/app/admin/deals/page.tsx`

**Features:**
- Table view of all deals
- Columns: Name, Status, Vehicles, Recipients, Created, Creator
- Status badges (ACTIVE/ARCHIVED) with colors
- **Archive filter toggle** (similar to vehicles page)
- URL-based filter state (`?archived=true`)
- Archive/Unarchive actions in dropdown menu
- Empty state with CTA to vehicles page
- Click to view deal details
- Optimistic updates for archive actions

### Deal Detail Page
**Location:** `src/app/admin/deals/[id]/page.tsx`

**Features:**
- Deal information card (name, description, status, dates)
- Vehicles section with images and prices
- Recipients section with delivery status icons
- Email tracking (sent, opened, clicked times)
- Error messages for failed deliveries
- **Archive/Unarchive button in header**
- Status icons: ✓ (sent), ✗ (failed), ⏱ (pending)
- Responsive design

---

## Email Integration (Loops)

### Setup

1. **Get Loops API Key:**
   - Sign up at https://loops.so
   - Get API key from dashboard
   - Add to `.env.local`:
     ```bash
     LOOPS_API_KEY=your_key_here
     ```

2. **Create Email Template:**
   - Go to Loops dashboard → Transactional Emails
   - Create new template with ID: `deal-notification`
   - Use template variables:
     - `{{userName}}` - Recipient's first name (or email username as fallback)
     - `{{dealName}}` - Deal name
     - `{{dealDescription}}` - Deal description
     - `{{vehicleNames}}` - Comma-separated list of recipient's vehicle names
     - `{{dealUrl}}` - Optional deal URL

3. **Example Template:**
   ```html
   <p>Dear {{userName}},</p>
   
   <p>I'm contacting you regarding your {{vehicleNames}}.</p>
   
   <p>Please review the following deal:</p>
   <p>{{dealDescription}}</p>
   
   <p>Just reply to let me know if you would like to participate.</p>
   
   <p>Thanks,<br>SpokeHire Team</p>
   ```

**Note:** Each recipient receives a personalized email containing ONLY their own vehicles from the deal, not all vehicles in the deal.

### Development Mode

If `LOOPS_API_KEY` is not set or `DEBUG=true`:
- Email sending is simulated
- Console logs show formatted email details
- All operations appear successful
- Useful for testing without Loops account

---

## Environment Variables

```bash
# Required for email sending in production
LOOPS_API_KEY=your_loops_api_key_here

# Debug mode - logs emails instead of sending
DEBUG="true"  # Set to "false" in production

# Automatically enabled in development
NODE_ENV=development
```

---

## Architecture

### Email Sending Flow (Server-Side)

**Modern Architecture (Current)**
```
Client → createDeal/addVehicles (tRPC)
         ↓
Server:  Create deal in database
         ↓
         Send personalized emails (automatic)
         ↓
Client ← Success response
```

**Benefits:**
- ✅ Atomic operation - deal creation + email sending happen together
- ✅ No race conditions - server handles everything reliably
- ✅ Automatic retry capability - emails sent after transaction commits
- ✅ Better error handling - deal saved even if emails fail
- ✅ Simpler client code - one mutation does everything

**Technical Details:**
- Emails are sent AFTER the database transaction commits (to avoid holding locks)
- Email failures don't fail the deal creation (but are logged)
- Manual resend endpoint available for admin intervention if needed
- All email personalization (filtering vehicles per owner) happens server-side

---

## Change History

### Version 2.1 (October 2025) - Architecture Improvements

**1. Server-Side Email Sending**
- Moved email sending from client to server
- Emails now sent automatically when deals are created/modified
- Improved reliability and error handling
- Removed client-side orchestration complexity

**2. Personalized Emails**
- Each recipient only sees their own vehicles
- Vehicle names formatted as comma-separated list
- Personalized greeting using recipient's first name
- Simplified email template format

### Version 2.0 (January 2025) - Major Simplifications

**1. Simplified Status System**
- Reduced from 5 states to 2: ACTIVE and ARCHIVED
- Removed DRAFT, SENT, EXPIRED, CANCELLED states
- All deals created as ACTIVE immediately
- Added archive/unarchive functionality throughout UI

**2. Automatic Recipient Detection**
- Recipients automatically determined from vehicle owners
- Removed manual user selection UI
- Automatic deduplication (same owner gets one email)
- Faster workflow: Select vehicles → Fill details → Send

**3. Add to Existing Deals**
- Can now add vehicles to existing ACTIVE deals
- Automatic duplicate detection for vehicles and recipients
- Mode toggle in dialog: Create new vs. Add to existing

**4. Type Safety & Performance**
- Replaced `any` types with proper Prisma types
- Added `RecipientStatus` enum (PENDING, SENT, FAILED)
- Transaction handling for data consistency
- Better error handling throughout

**5. Enhanced UI**
- Archive filter toggle on deals list page
- Archive/Unarchive buttons in detail page
- URL-based filter state
- Optimistic UI updates
- Responsive design improvements

---

## Testing

### Manual Testing Checklist

**Vehicle Selection:**
- [ ] Select individual vehicles
- [ ] Select all vehicles
- [ ] Deselect vehicles
- [ ] Selection count updates
- [ ] "Send Deal" button appears/disappears

**Create Deal:**
- [ ] Open dialog with selected vehicles
- [ ] Verify owners are auto-detected and shown
- [ ] Enter deal name and description
- [ ] Toggle between "Create new" and "Add to existing"
- [ ] Select existing deal from dropdown
- [ ] Create and send deal
- [ ] Success toast appears with correct count
- [ ] Selection clears after success

**Deals List:**
- [ ] View all active deals
- [ ] Toggle to view archived deals
- [ ] Status badges display correctly
- [ ] Counts are accurate
- [ ] Archive action works from dropdown
- [ ] Unarchive action works from dropdown
- [ ] Empty state shows when no deals
- [ ] Click to view details

**Deal Details:**
- [ ] All deal info displays correctly
- [ ] Vehicles show with images
- [ ] Recipients show with correct status icons
- [ ] Email tracking timestamps show
- [ ] Error messages display if failed
- [ ] Archive/Unarchive button works

**Email Testing:**
- [ ] Set DEBUG=true
- [ ] Send deal and check console logs
- [ ] Verify email content format
- [ ] Test with LOOPS_API_KEY (production)
- [ ] Verify email delivery in Loops dashboard

---

## Security & Permissions

- All deal endpoints require **admin authentication**
- Only admins can create, send, archive deals
- Users referenced in deals must exist in database
- Vehicles must exist and be accessible
- Email addresses are validated
- Rate limiting handled by Loops
- Input validation with Zod schemas

---

## Performance Considerations

- Vehicle selection limited to 20 vehicles per deal
- Email sending is sequential (one at a time)
- Deal list paginated (50 per page)
- Images optimized via Next.js Image component
- Database indexes on frequently queried fields
- Transaction handling ensures data consistency

---

## Future Enhancements

### Planned
- WhatsApp integration (Twilio/WhatsApp Business API)
- Deal templates for quick creation
- Scheduled sending with time zone support
- Analytics dashboard (open rates, click rates)
- Response management and tracking

### Under Consideration
- Bulk deal operations
- Deal duplication
- Custom email templates per deal
- Deal expiration dates
- Recipient response workflow

---

## Troubleshooting

### Emails Not Sending

**Check:**
1. `LOOPS_API_KEY` is set in `.env.local`
2. Loops account is active
3. Template ID `deal-notification` exists in Loops
4. Template has correct variables
5. `DEBUG` is not set to `true` in production

**Fix:**
- Verify API key is correct
- Create template in Loops dashboard
- Check Loops API status
- Set `DEBUG=false` in production

### Recipients Not Showing

**Check:**
1. Selected vehicles have owners
2. Owners have valid email addresses
3. Vehicles query is returning data

**Fix:**
- Ensure vehicles have owners assigned
- Check owner data in database
- Verify vehicle selection query

### Deal Creation Fails

**Check:**
1. At least 1 vehicle selected (max 20)
2. Vehicles have owners
3. Admin authentication active
4. Database connection working

**Fix:**
- Select required items
- Verify admin login
- Check database connection
- Review console for errors

### Archive/Unarchive Not Working

**Check:**
1. Deal exists and ID is valid
2. User has admin permissions
3. No database connection issues

**Fix:**
- Verify deal ID
- Check admin authentication
- Review server logs

---

## Related Files

### Backend
- `/src/server/api/routers/deal.ts` - Deal router
- `/src/server/api/services/deal.service.ts` - Deal business logic
- `/src/server/api/services/email.service.ts` - Loops email integration
- `/src/server/api/errors/app-errors.ts` - DealNotFoundError

### Frontend
- `/src/app/admin/vehicles/page.tsx` - Vehicle selection
- `/src/app/admin/vehicles/_components/CreateDealDialog.tsx` - Deal creation dialog
- `/src/app/admin/deals/page.tsx` - Deals list page
- `/src/app/admin/deals/[id]/page.tsx` - Deal detail page

### Database
- `/prisma/schema.prisma` - Deal models and enums
- `/prisma/migrations/add_recipient_status_enum.sql` - RecipientStatus enum migration
- `/prisma/migrations/simplify_deal_status.sql` - Status simplification migration

### Documentation
- `/docs/features/deals-workflow.md` - This file
- `/prisma/migrations/MIGRATION_MANUAL_STEPS.md` - Migration guide

---

**Status:** ✅ Production-Ready  
**Version:** 2.0 (Simplified & Enhanced)  
**Last Updated:** January 2025  
**Contributors:** Development Team
