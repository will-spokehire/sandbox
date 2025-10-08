# Deals/Job Offers Workflow

## Overview

The Deals Workflow feature allows administrators to send vehicle job offers to users via email. Administrators can select multiple vehicles, create a deal with a name and description, choose recipients, and send the deal via email using Loops.

**Date Created:** October 7, 2025  
**Status:** ✅ Completed (Phase 1)

---

## Features

### Phase 1 (Implemented)
- ✅ Database schema for deals, deal vehicles, and deal recipients
- ✅ Backend API (tRPC) for deal CRUD operations
- ✅ Loops email service integration
- ✅ Vehicle selection UI with checkboxes
- ✅ Deal creation dialog
- ✅ Deals list page
- ✅ Deal detail page with vehicles and recipients tracking
- ✅ Email delivery status tracking

### Future Enhancements
- WhatsApp integration for deal sending
- Deal templates
- Scheduled sending
- Advanced analytics dashboard
- Response/feedback management

---

## User Flow

### 1. Select Vehicles
1. Navigate to `/admin/vehicles`
2. Use checkboxes to select vehicles (1-20 vehicles)
3. Selected count shows in header badge
4. Click "Send Deal" button when ready

### 2. Create & Send Deal
1. Deal dialog opens with:
   - Selected vehicles count
   - Deal name field (required)
   - Description field (optional)
   - User recipient selection
2. Search and select recipients
3. Click "Send Deal" to create and send immediately
4. System sends emails via Loops
5. Success toast shows delivery results

### 3. View Deals
1. Navigate to `/admin/deals`
2. View all deals in a table:
   - Deal name & description
   - Status badge
   - Vehicle count
   - Recipient count
   - Created date
   - Creator name
3. Click on a deal to view details

### 4. View Deal Details
1. Navigate to `/admin/deals/[id]`
2. View deal information:
   - Basic deal info (name, description, status, dates)
   - List of vehicles included with images
   - Recipients list with delivery status
   - Email tracking (sent, opened, clicked)

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
  status      DealStatus  @default(DRAFT)
  
  createdById String
  createdBy   User        @relation("DealsCreated", fields: [createdById], references: [id])
  
  vehicles    DealVehicle[]
  recipients  DealRecipient[]
}
```

### Deal Status Enum
- `DRAFT` - Deal created but not sent
- `SENT` - Deal has been sent to recipients
- `ACTIVE` - Deal is active (future use)
- `EXPIRED` - Deal has expired (future use)
- `CANCELLED` - Deal was cancelled

### DealVehicle Model
Many-to-many relationship between deals and vehicles:
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
Tracks who received the deal and delivery status:
```prisma
model DealRecipient {
  id             String    @id @default(cuid())
  createdAt      DateTime  @default(now())
  sentAt         DateTime?
  
  dealId         String
  deal           Deal      @relation(fields: [dealId], references: [id], onDelete: Cascade)
  
  userId         String
  user           User      @relation(fields: [userId], references: [id])
  
  status         String    @default("pending")
  emailSentAt    DateTime?
  emailOpenedAt  DateTime?
  emailClickedAt DateTime?
  errorMessage   String?
}
```

---

## Backend API (tRPC)

### Deal Router (`src/server/api/routers/deal.ts`)

#### Procedures

**`deal.list`** - Get paginated list of deals
- Input: `{ limit?, cursor?, status? }`
- Output: `{ deals[], nextCursor? }`
- Auth: Admin only

**`deal.getById`** - Get deal with full details
- Input: `{ id }`
- Output: Deal with vehicles and recipients
- Auth: Admin only

**`deal.create`** - Create new deal
- Input: `{ name, description?, vehicleIds[], recipientIds[] }`
- Output: Created deal
- Auth: Admin only
- Validation: 1-20 vehicles, at least 1 recipient

**`deal.send`** - Send deal to recipients via email
- Input: `{ dealId, recipientIds? }`
- Output: `{ success, total, sent, failed, results[] }`
- Auth: Admin only
- Sends emails via Loops
- Updates recipient status
- Marks deal as SENT

**`deal.getAvailableUsers`** - Get users for recipient selection
- Input: `{ search?, limit?, userType? }`
- Output: Array of users
- Auth: Admin only
- Filters: By search term, user type (OWNER_ONLY by default)

---

## Services

### DealService (`src/server/api/services/deal.service.ts`)

Business logic for deal management:
- `listDeals()` - List deals with pagination
- `getDealById()` - Get deal details
- `createDeal()` - Create new deal with vehicles and recipients
- `sendDeal()` - Coordinate sending process
- `updateDealStatus()` - Update deal status
- `deleteDeal()` - Soft delete (set to CANCELLED)
- `getDealVehicles()` - Get vehicles for email
- `getDealRecipients()` - Get recipients for sending
- `updateRecipientStatus()` - Update delivery status
- `markDealAsSent()` - Update deal after sending

### EmailService (`src/server/api/services/email.service.ts`)

Handles email sending via Loops:
- `sendDealEmail()` - Send single deal email
- `sendBulkEmails()` - Send to multiple recipients
- `testConnection()` - Test Loops API connection

**Configuration:**
- Requires `LOOPS_API_KEY` environment variable
- Uses Loops transactional email API
- Template ID: `deal-notification` (must be created in Loops dashboard)

---

## Frontend Components

### Vehicle Selection
**Location:** `src/app/admin/vehicles/page.tsx`

Features:
- Checkbox column in vehicle table
- "Select All" checkbox in header
- Selection count badge
- "Send Deal" button (appears when vehicles selected)
- Selection state management

### CreateDealDialog
**Location:** `src/app/admin/vehicles/_components/CreateDealDialog.tsx`

Features:
- Deal name and description inputs
- User recipient selection with search
- Selected users display as removable badges
- Real-time user search
- Validation (required fields, at least 1 recipient)
- Loading states during creation and sending
- Success/error toasts

### Deals List Page
**Location:** `src/app/admin/deals/page.tsx`

Features:
- Table view of all deals
- Columns: Name, Status, Vehicles, Recipients, Created, Creator
- Status badges with colors
- Empty state with CTA to vehicles page
- Click to view deal details

### Deal Detail Page
**Location:** `src/app/admin/deals/[id]/page.tsx`

Features:
- Deal information card (name, description, status, dates)
- Vehicles section with images and prices
- Recipients section with delivery status
- Email tracking (sent, opened, clicked times)
- Error messages for failed deliveries
- Status icons (checkmark, X, clock)

---

## Email Integration (Loops)

### Setup

1. **Get Loops API Key:**
   - Sign up at https://loops.so
   - Get API key from dashboard
   - Add to `.env.local`: `LOOPS_API_KEY=your_key_here`

2. **Create Email Template:**
   - Go to Loops dashboard → Transactional Emails
   - Create new template with ID: `deal-notification`
   - Use template variables:
     - `{{dealName}}` - Deal name
     - `{{dealDescription}}` - Deal description
     - `{{vehiclesCount}}` - Number of vehicles
     - `{{vehicles}}` - Array of vehicle objects
     - Each vehicle has: `name`, `year`, `make`, `model`, `price`, `registration`, `imageUrl`

3. **Example Template:**
   ```html
   <h2>New Job Offer: {{dealName}}</h2>
   <p>{{dealDescription}}</p>
   <p>We have {{vehiclesCount}} vehicles available for you:</p>
   
   {{#each vehicles}}
     <div style="border: 1px solid #ccc; padding: 16px; margin: 16px 0;">
       {{#if this.imageUrl}}
         <img src="{{this.imageUrl}}" alt="{{this.name}}" style="max-width: 300px;" />
       {{/if}}
       <h3>{{this.name}}</h3>
       <p>{{this.make}} {{this.model}} ({{this.year}})</p>
       <p><strong>Price:</strong> {{this.price}}</p>
       {{#if this.registration}}
         <p><strong>Registration:</strong> {{this.registration}}</p>
       {{/if}}
     </div>
   {{/each}}
   ```

### Development Mode

If `LOOPS_API_KEY` is not set:
- Email sending is simulated
- Console logs show what would be sent
- All operations appear successful
- Useful for testing without Loops account

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
- [ ] Enter deal name and description
- [ ] Search for users
- [ ] Select multiple recipients
- [ ] Remove selected recipients
- [ ] Validation errors show correctly
- [ ] Create and send deal
- [ ] Success toast appears
- [ ] Selection clears after success

**Deals List:**
- [ ] View all deals
- [ ] Status badges display correctly
- [ ] Counts are accurate
- [ ] Empty state shows when no deals
- [ ] Click to view details

**Deal Details:**
- [ ] All deal info displays correctly
- [ ] Vehicles show with images
- [ ] Recipients show with status icons
- [ ] Email tracking timestamps show
- [ ] Error messages display if failed

---

## Environment Variables

```bash
# Required for email sending
LOOPS_API_KEY=your_loops_api_key_here

# Optional: If not set, email sending is simulated
```

---

## Security & Permissions

- All deal endpoints require **admin authentication**
- Only admins can create and send deals
- Users referenced in deals must exist in database
- Vehicles must exist and be accessible
- Email addresses are validated
- Rate limiting handled by Loops

---

## Error Handling

### Common Errors

**"Vehicle not found"**
- Cause: Selected vehicle was deleted
- Solution: Clear selection and reselect vehicles

**"User not found"**
- Cause: Selected user was deleted
- Solution: Remove user from selection

**"Failed to send email"**
- Cause: Loops API error, invalid API key, network issue
- Solution: Check LOOPS_API_KEY, check Loops status
- Email marked as "failed" with error message

**"Deal not found"**
- Cause: Deal ID invalid or deal was deleted
- Solution: Return to deals list

---

## Performance Considerations

- Vehicle selection limited to 20 vehicles per deal
- Recipient selection limited to 100 users per search
- Email sending is sequential (one at a time)
- Deal list paginated (50 per page)
- Images optimized via Next.js Image component
- Database indexes on frequently queried fields

---

## Future Enhancements

### WhatsApp Integration
- Add Twilio/WhatsApp Business API
- Support sending via WhatsApp in addition to email
- Require approved message templates
- Track WhatsApp delivery status

### Deal Templates
- Save deal configurations as templates
- Quick create from template
- Template library

### Scheduled Sending
- Schedule deal to send at specific time
- Recurring deals
- Time zone support

### Analytics Dashboard
- Email open rates
- Click-through rates
- Response tracking
- Deal performance metrics

### Response Management
- Track user responses
- In-app messaging
- Response workflow

---

## Migration Guide

If you have an existing database, run:

```bash
npm run db:push
```

This will create the new tables:
- `Deal`
- `DealVehicle`
- `DealRecipient`

And update existing tables:
- `User` (adds relations)
- `Vehicle` (adds relations)

---

## Troubleshooting

### Emails not sending

1. Check `LOOPS_API_KEY` is set correctly
2. Verify Loops account is active
3. Check template ID is `deal-notification`
4. Test Loops API with `testConnection()` method

### Recipients not showing

1. Ensure users have `status: ACTIVE`
2. Check `userType` filter (defaults to OWNER_ONLY)
3. Search query may be too specific

### Deal creation fails

1. Check at least 1 vehicle selected (max 20)
2. Check at least 1 recipient selected (max 100)
3. Verify admin authentication
4. Check database connection

---

## API Reference

See the full tRPC API documentation in the code:
- `src/server/api/routers/deal.ts` - Router definitions
- `src/server/api/services/deal.service.ts` - Business logic
- `src/server/api/services/email.service.ts` - Email handling

---

**Last Updated:** October 7, 2025  
**Version:** 1.0.0 (Phase 1)  
**Contributors:** Development Team

