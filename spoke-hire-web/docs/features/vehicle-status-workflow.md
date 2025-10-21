# Vehicle Status Workflow Feature

## Overview

Comprehensive vehicle status management system with role-based permissions, status transitions, email notifications, and validation rules. Allows users to submit vehicles for review and admins to approve or decline them with feedback.

## Implementation Date

October 21, 2025

## Status Flow Diagram

```
DRAFT ────────────────┐
  │                   │
  │ (User: Publish)   │
  ↓                   │
IN_REVIEW             │
  │                   │
  ├─→ PUBLISHED       │
  │   (Admin: Approve)│
  │                   │
  └─→ DECLINED ───────┘
      (Admin: Decline)
      
Any Status → ARCHIVED (User or Admin)
```

## Vehicle Statuses

### DRAFT
- Initial status when vehicle is created
- Not visible to public
- Owner can edit and submit for review

### IN_REVIEW
- Vehicle submitted by owner and awaiting admin review
- Admin receives email notification
- Admin can approve (→ PUBLISHED) or decline (→ DECLINED)

### PUBLISHED
- Vehicle approved by admin
- Visible to public (when implemented)
- Owner receives email notification

### DECLINED
- Vehicle rejected by admin with feedback
- Owner receives email with decline reason
- Owner can edit and resubmit for review

### ARCHIVED
- Vehicle archived by owner or admin
- Hidden from listings
- Can be restored if needed

## Permissions Matrix

| Action | User (Owner) | Admin |
|--------|-------------|-------|
| View vehicle | Own vehicles only | All vehicles |
| Create vehicle (→ DRAFT) | ✅ | ✅ |
| Submit for Review (DRAFT/DECLINED → IN_REVIEW) | ✅ | ❌ (uses direct publish) |
| Approve (IN_REVIEW → PUBLISHED) | ❌ | ✅ |
| Decline (IN_REVIEW → DECLINED) | ❌ | ✅ |
| Archive (Any → ARCHIVED) | ✅ | ✅ |
| Change to any status | ❌ | ✅ |

## Email Notifications

### Vehicle Published (to Owner)

**Trigger:** Admin approves vehicle (IN_REVIEW → PUBLISHED)

**Loops Template ID:** `vehicle-published`

**Variables:**
- `{{ownerName}}` - Vehicle owner's first name
- `{{vehicleName}}` - Full vehicle name (Make Model - Name)
- `{{vehicleUrl}}` - Link to vehicle in user dashboard
- `{{dashboardUrl}}` - Link to user's vehicles list

**Sample Content:**
```
Hi {{ownerName}},

Great news! Your vehicle "{{vehicleName}}" has been approved and is now published.

View your vehicle: {{vehicleUrl}}
Manage your vehicles: {{dashboardUrl}}
```

### Vehicle Declined (to Owner)

**Trigger:** Admin declines vehicle (IN_REVIEW → DECLINED)

**Loops Template ID:** `vehicle-declined`

**Variables:**
- `{{ownerName}}` - Vehicle owner's first name
- `{{vehicleName}}` - Full vehicle name
- `{{declinedReason}}` - Admin's feedback (minimum 10 characters)
- `{{dashboardUrl}}` - Link to user's vehicles list

**Sample Content:**
```
Hi {{ownerName}},

We've reviewed your vehicle "{{vehicleName}}" and need some changes before we can publish it.

Feedback from our team:
{{declinedReason}}

Please make the requested changes and submit for review again.
Manage your vehicles: {{dashboardUrl}}
```

### Vehicle In Review (to Admin)

**Trigger:** User submits vehicle for review (DRAFT/DECLINED → IN_REVIEW)

**Loops Template ID:** `vehicle-in-review`

**Recipient:** `ADMIN_NOTIFICATION_EMAIL` environment variable

**Variables:**
- `{{vehicleName}}` - Full vehicle name
- `{{ownerName}}` - Vehicle owner's first name
- `{{vehicleUrl}}` - Link to vehicle in admin dashboard

**Sample Content:**
```
New vehicle submitted for review:

Vehicle: {{vehicleName}}
Owner: {{ownerName}}

Review vehicle: {{vehicleUrl}}
```

## Validation Rules

Before a vehicle can be submitted for review (DRAFT/DECLINED → IN_REVIEW), it must have:

### Required Fields
- ✅ At least 1 photo
- ✅ Vehicle name
- ✅ Make
- ✅ Model
- ✅ Year
- ✅ Price
- ✅ Engine capacity
- ✅ Number of seats
- ✅ Steering type
- ✅ Gearbox
- ✅ Exterior colour
- ✅ Interior colour
- ✅ Condition

If any field is missing, the user will see a validation error listing all missing fields.

## API Endpoints

### User Endpoints (`userVehicleRouter`)

#### `submitForReview`
- **Type:** Mutation
- **Auth:** Protected (user must be owner)
- **Input:** `{ vehicleId: string }`
- **Action:** DRAFT/DECLINED → IN_REVIEW
- **Validates:** All required fields and photos
- **Sends Email:** To admin

#### `archiveMyVehicle`
- **Type:** Mutation
- **Auth:** Protected (user must be owner)
- **Input:** `{ vehicleId: string }`
- **Action:** Any status → ARCHIVED
- **Sends Email:** No

#### `getValidationErrors`
- **Type:** Query
- **Auth:** Protected (user must be owner)
- **Input:** `{ vehicleId: string }`
- **Returns:** `{ errors: string[] }`
- **Purpose:** Check what's missing before submit

### Admin Endpoints (`vehicleRouter`)

#### `approveVehicle`
- **Type:** Mutation
- **Auth:** Admin only
- **Input:** `{ vehicleId: string }`
- **Action:** IN_REVIEW → PUBLISHED
- **Sends Email:** To vehicle owner

#### `declineVehicle`
- **Type:** Mutation
- **Auth:** Admin only
- **Input:** `{ vehicleId: string, declinedReason: string }`
- **Action:** IN_REVIEW → DECLINED
- **Validates:** Reason must be ≥10 characters
- **Sends Email:** To vehicle owner with reason

#### `updateStatus`
- **Type:** Mutation
- **Auth:** Admin only
- **Input:** `{ id: string, status: VehicleStatus, declinedReason?: string }`
- **Action:** Any status → Any status
- **Sends Email:** Based on target status

## UI Components

### User Interface

#### `UserVehicleActions`
**Location:** `/user/vehicles/[id]`

- Shows current status badge
- **If DRAFT/DECLINED:** Shows "Publish" button (submits for review)
  - Disabled if validation fails
  - Shows validation errors below
- **Always:** Shows "Archive" button
- Confirmation dialogs for both actions

#### `MediaStep` (Vehicle Creation)
**Location:** `/user/vehicles/new`

- After uploading photos, shows success dialog
- Two options:
  1. "View Vehicle" - Go to vehicle page in DRAFT
  2. "Submit for Review" - Immediately submit to IN_REVIEW

#### Declined Reason Alert
**Location:** `/user/vehicles/[id]`

- Shows red alert if vehicle status is DECLINED
- Displays admin's feedback prominently
- Encourages user to make changes and resubmit

### Admin Interface

#### `VehicleStatusActions`
**Location:** `/admin/vehicles/[id]`

- Shows current status badge
- **If IN_REVIEW:** Shows prominent "Approve" and "Decline" buttons
- **Other statuses:** Shows quick action buttons:
  - Publish (if not published)
  - In Review (if not in review)
  - Archive (if not archived)

#### `DeclineVehicleDialog`
**Location:** Modal opened from VehicleStatusActions

- Text area for decline reason (minimum 10 characters)
- Shows preview: recipient email, vehicle name
- Character counter
- Confirmation required

### Reusable Components

#### `VehicleStatusBadge`
**Location:** `~/components/vehicles/VehicleStatusBadge.tsx`

Color-coded status display:
- DRAFT: Gray
- IN_REVIEW: Yellow
- PUBLISHED: Green
- DECLINED: Red
- ARCHIVED: Slate

## Database Schema Changes

### Vehicle Model

```prisma
model Vehicle {
  // ... existing fields
  status           VehicleStatus @default(DRAFT)
  declinedReason   String?  // Admin's feedback when declining
  // ... existing fields
}
```

### VehicleStatus Enum

```prisma
enum VehicleStatus {
  DRAFT
  IN_REVIEW      // NEW
  PUBLISHED
  DECLINED
  ARCHIVED
}
```

## Environment Variables

```bash
# Admin notification email for vehicle reviews
ADMIN_NOTIFICATION_EMAIL="admin@spokehire.com"

# Loops template IDs (create these in Loops dashboard)
LOOPS_VEHICLE_PUBLISHED_ID="vehicle-published"
LOOPS_VEHICLE_DECLINED_ID="vehicle-declined"
LOOPS_VEHICLE_IN_REVIEW_ID="vehicle-in-review"

# For local testing
EMAIL_DEBUG="true"  # Logs emails to console
TEST_EMAIL_OVERRIDE="test@example.com"  # Redirect all emails
```

## Testing Locally

### Setup
1. Set environment variables in `.env.local`:
   ```bash
   EMAIL_DEBUG="true"
   TEST_EMAIL_OVERRIDE="your-test-email@example.com"
   ADMIN_NOTIFICATION_EMAIL="admin@example.com"
   ```

2. Run database migration:
   ```bash
   cd spoke-hire-web
   npm run db:push
   ```

### Test Scenarios

#### As User
1. **Create Vehicle in DRAFT**
   - Go to `/user/vehicles/new`
   - Fill in all fields
   - Upload at least one photo
   - Click "Continue" then "Submit for Review"
   - ✅ Check console for IN_REVIEW email to admin

2. **View Declined Vehicle**
   - Have admin decline a vehicle
   - Go to vehicle page
   - ✅ See red alert with decline reason
   - ✅ Check console for declined email

3. **Resubmit After Decline**
   - Edit declined vehicle
   - Click "Publish" button
   - ✅ Check console for IN_REVIEW email

4. **Archive Vehicle**
   - Click "Archive" button
   - Confirm
   - ✅ Vehicle status changes to ARCHIVED

#### As Admin
1. **Approve Vehicle**
   - Open vehicle in IN_REVIEW status
   - Click "Approve" button
   - ✅ Check console for published email to owner

2. **Decline Vehicle**
   - Open vehicle in IN_REVIEW status
   - Click "Decline" button
   - Enter reason (min 10 chars)
   - Confirm
   - ✅ Check console for declined email with reason

3. **Change Any Status**
   - Can change from any status to any status
   - Uses quick action buttons

## Architecture

### Service Layer

#### `VehicleStatusService`
**Location:** `~/server/api/services/vehicle-status.service.ts`

**Responsibilities:**
- Validate status transitions
- Check permissions
- Validate vehicle completeness
- Handle status changes
- Send email notifications

**Key Methods:**
- `canUserChangeStatus()` - Permission checking
- `validateVehicleForPublish()` - Field validation
- `changeVehicleStatus()` - Main status change method
- `sendStatusChangeEmails()` - Email notification logic

#### `EmailService` Extensions
**Location:** `~/server/api/services/email.service.ts`

**New Methods:**
- `sendVehiclePublishedEmail()`
- `sendVehicleDeclinedEmail()`
- `sendVehicleInReviewEmail()`

All methods support:
- Debug mode (EMAIL_DEBUG=true)
- Test email override (TEST_EMAIL_OVERRIDE)
- Error handling without failing status change

### Service Factory

Updated to include `VehicleStatusService`:
```typescript
ServiceFactory.createVehicleStatusService(db)
```

## Future Enhancements

- [ ] Status change history tracking
- [ ] Multiple admin approvers
- [ ] Scheduled publishing
- [ ] Bulk status changes
- [ ] Email templates in dashboard
- [ ] Notification preferences per user

## Change Log

### October 21, 2025 - Initial Implementation
- Added IN_REVIEW status to enum
- Added declinedReason field to Vehicle model
- Created VehicleStatusService for business logic
- Extended EmailService with vehicle status notifications
- Added user endpoints: submitForReview, archiveMyVehicle, getValidationErrors
- Added admin endpoints: approveVehicle, declineVehicle
- Created UserVehicleActions component
- Created DeclineVehicleDialog component
- Updated MediaStep to allow immediate submission
- Created VehicleStatusBadge component
- Updated admin VehicleStatusActions for workflow
- Updated environment variable documentation

---

**Last Updated:** October 21, 2025
**Feature Status:** ✅ Complete and ready for testing

