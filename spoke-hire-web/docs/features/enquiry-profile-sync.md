# User Enquiry Profile Sync & Recipient Management

## Overview

When users submit enquiries through the platform, the system automatically syncs their profile information and manages deal recipients to enable email notifications.

## Key Features

### 1. Profile Synchronization
When a user submits an enquiry, their profile is automatically updated with any missing information:
- First Name
- Last Name
- Phone Number
- Company Name (optional)

**Implementation:**
- Only updates fields that are currently empty in the user's profile
- Prevents overwriting existing profile data
- Logs which fields were updated for audit purposes

### 2. Automatic Recipient Management
When a user creates an enquiry with a vehicle attached:
- The vehicle owner is automatically added as a deal recipient
- Recipient status is set to `PENDING`
- Enables admin to send email notifications via "Send Email to Pending" button

**Previously:** When users added vehicles to deals, recipients were not created, preventing email notifications.

**Now:** Vehicle owners are automatically added as recipients, ensuring email functionality works consistently whether vehicles are added by users or admins.

## Technical Details

### Service Layer
**File:** `src/server/api/services/deal.service.ts`

**Method:** `createUserEnquiry()`

**Flow:**
1. User submits enquiry (optionally with vehicle)
2. System updates user profile with missing fields
3. If vehicle is included:
   - Validates vehicle exists
   - Fetches vehicle owner ID
   - Adds owner as recipient with `PENDING` status
4. Creates deal with vehicle and recipient relations
5. Sends email notifications:
   - Admin notification (deal details)
   - User confirmation

### Database Schema

**DealRecipient Table:**
```prisma
model DealRecipient {
  id             String          @id @default(cuid())
  dealId         String
  userId         String
  status         RecipientStatus @default(PENDING)
  emailSentAt    DateTime?
  emailOpenedAt  DateTime?
  emailClickedAt DateTime?
  errorMessage   String?
  
  @@unique([dealId, userId])
}
```

**RecipientStatus Enum:**
- `PENDING` - Ready to receive email
- `SENT` - Email successfully sent
- `FAILED` - Email sending failed

## Email Notification Workflow

### Admin Dashboard
**File:** `src/app/admin/deals/[id]/page.tsx`

**Button:** "Send Email to Pending (X)"
- Counts recipients with `PENDING` status
- Sends deal details to all pending recipients
- Updates status to `SENT` or `FAILED` based on result

### When to Use
1. **User creates enquiry with vehicle:**
   - Recipient automatically created → Button shows count
   - Admin can immediately send notifications
   
2. **Admin manually adds vehicle:**
   - Recipient created when vehicle added → Button shows count
   - Admin can send notifications when ready

## Code Example

```typescript
// Creating enquiry with vehicle
const result = await api.deal.createUserEnquiry.mutate({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+44 20 1234 5678",
  dealType: "PRODUCTION",
  vehicleId: "clx123...", // Vehicle owner will be added as recipient
});

// Result: Deal created with vehicle and owner as PENDING recipient
```

## Related Files

- `src/server/api/services/deal.service.ts` - Business logic
- `src/server/api/repositories/deal.repository.ts` - Data access
- `src/server/api/repositories/user.repository.ts` - Profile sync
- `src/app/admin/deals/[id]/page.tsx` - Admin UI
- `prisma/schema.prisma` - Database schema

## Testing

**Scenario 1: User enquiry with vehicle**
1. User submits enquiry with vehicle attached
2. Verify recipient created with vehicle owner ID
3. Verify "Send Email to Pending" button shows count > 0
4. Admin sends email → Status changes to SENT

**Scenario 2: User enquiry without vehicle**
1. User submits enquiry without vehicle
2. No recipients created initially
3. Admin manually adds vehicle → Owner added as recipient
4. "Send Email to Pending" button shows count > 0

## Changelog

### 2025-11-08
- **Fixed:** User-created enquiries with vehicles now properly create recipient records
- **Added:** Automatic vehicle owner lookup and recipient creation
- **Enhanced:** Logging for recipient creation in enquiries

---

**Last Updated:** November 8, 2025
