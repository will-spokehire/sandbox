# Analytics Implementation

This document describes the analytics tracking implementation for SpokeHire, including Google Analytics 4 (GA4) and Amplitude integration.

## Overview

SpokeHire uses a dual-analytics approach:
- **Google Analytics 4 (GA4)**: Web analytics, session tracking, and basic metrics
- **Amplitude**: Product analytics, user behavior, and event tracking

Both platforms receive the same events through a unified API, ensuring consistent tracking across systems.

## Setup

### 1. Obtain Tracking IDs

**Google Analytics 4:**
1. Visit https://analytics.google.com/
2. Navigate to Admin > Data Streams
3. Select your stream
4. Copy the Measurement ID (format: G-XXXXXXXXXX)

**Amplitude:**
1. Visit https://app.amplitude.com/
2. Navigate to Settings > Projects > [Your Project] > General
3. Copy both API keys:
   - Client-side API key (for browser)
   - Server-side API key (for backend, optional)

### 2. Configure Environment Variables

Add to your `.env.local` (development) or `.env.production` (production):

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# Amplitude
NEXT_PUBLIC_AMPLITUDE_API_KEY="your-amplitude-client-key"
AMPLITUDE_SERVER_API_KEY="your-amplitude-server-key"  # Optional
```

### 3. Privacy & GDPR Compliance

Analytics tracking includes:
- Cookie consent banner (only in production)
- Opt-in/opt-out mechanism
- No tracking until consent is given
- IP address anonymization
- No PII (Personally Identifiable Information) in events

## Event Catalog

### Auto-Tracked Events

These events are automatically tracked by the analytics provider:

| Event | Description | Properties |
|-------|-------------|------------|
| `page_view` | User views a page | `path`, `title` |
| `session_start` | User starts a session | (handled by GA4/Amplitude) |

### Authentication Events

| Event | Description | Trigger Point | Properties |
|-------|-------------|---------------|------------|
| `signup_initiated` | User clicks "Create account" | SignupForm submission | - |
| `signup_code_sent` | OTP code sent to user's email | After successful OTP request | `email_domain` |
| `user_signed_up` | New user completes registration | OTP verification (new user) | `userType`, `userStatus`, `isNewUser: true` |
| `user_signed_in` | Returning user logs in | Supabase auth state change | `userType`, `userStatus` |
| `otp_verification_success` | OTP verified successfully | OTP verification (returning user) | `userType`, `userStatus`, `isNewUser: false` |
| `otp_verification_failed` | OTP verification failed | OTP verification error | `error_message` |
| `user_signed_out` | User logs out | Sign out action | - |

### Vehicle Discovery Events

| Event | Description | Trigger Point | Properties |
|-------|-------------|---------------|------------|
| `vehicle_search` | User applies search filters | PublicVehicleFilters change (debounced 1s) | `makeIds`, `modelId`, `decade`, `collectionIds`, `countryIds`, `counties`, `filterCount` |
| `vehicle_viewed` | User views vehicle details | Vehicle detail page load | `vehicleId`, `vehicleName`, `make`, `model`, `year` |

### Enquiry Funnel Events

| Event | Description | Trigger Point | Properties |
|-------|-------------|---------------|------------|
| `enquiry_started` | User opens enquiry form | Enquiry page mount | `hasVehicle`, `vehicleId` |
| `enquiry_submitted` | User submits enquiry form | Form submission | `dealType`, `hasVehicle`, `vehicleId` |
| `enquiry_success` | Enquiry saved successfully | Server-side after deal creation | `dealId`, `dealType`, `hasVehicle`, `vehicleId` |
| `enquiry_conversion` | User reaches success page | Success page mount | - |

## Implementation Details

### Client-Side Tracking

Client-side events are tracked using the unified analytics API:

```typescript
import { trackEvent } from "~/lib/analytics";

// Track a simple event
trackEvent('signup_initiated');

// Track an event with properties
trackEvent('vehicle_viewed', {
  vehicleId: 'abc123',
  vehicleName: 'Ferrari 250 GTO',
  make: 'Ferrari',
  model: '250 GTO',
  year: 1962,
});
```

### User Identification

When users authenticate, their user ID and properties are sent to analytics:

```typescript
import { identifyUser } from "~/lib/analytics";

identifyUser(userId, {
  email: user.email,         // Not sent to analytics (PII)
  userType: user.userType,   // Sent (e.g., "ADMIN", "REGISTERED")
  userStatus: user.status,   // Sent (e.g., "ACTIVE")
});
```

**Note:** Email addresses and other PII are automatically filtered out and not sent to analytics platforms.

### Page View Tracking

Page views are automatically tracked by the `AnalyticsProvider` component, which listens to Next.js router changes:

```typescript
// Automatically tracked - no code needed
// Just ensure AnalyticsProvider wraps your app in layout.tsx
```

### Server-Side Tracking

Server-side events are logged for future integration with Amplitude's HTTP API:

```typescript
// In server/api/services/deal.service.ts
console.log('[Analytics] enquiry_success', {
  dealId: deal.id,
  dealType: deal.dealType,
  hasVehicle: !!vehicleId,
  vehicleId: vehicleId ?? undefined,
});
```

**Future Enhancement:** Replace `console.log` with Amplitude HTTP API calls using `AMPLITUDE_SERVER_API_KEY`.

## Testing Analytics

### Development Mode

In development, analytics events are logged to the console instead of being sent:

```
[Analytics] GA.event { category: 'signup', action: 'signup_initiated', ... }
[Analytics] Amplitude.event { eventName: 'signup_initiated', ... }
```

### Production Testing

To test in production without affecting real data:

1. **Use GA4 DebugView:**
   - Open Chrome DevTools
   - Install Google Analytics Debugger extension
   - View events in real-time in GA4 DebugView

2. **Use Amplitude User Lookup:**
   - Navigate to Amplitude > User Lookup
   - Search for your test user ID
   - View event stream in real-time

### Cookie Consent Testing

1. **Accept Scenario:**
   - Clear cookies and localStorage
   - Visit the site
   - Click "Accept" on cookie banner
   - Verify events are sent (check browser Network tab)

2. **Decline Scenario:**
   - Clear cookies and localStorage
   - Visit the site
   - Click "Decline" on cookie banner
   - Verify NO analytics requests are sent

## Key Funnels to Monitor

### 1. User Registration Funnel

```
signup_initiated
  → signup_code_sent
    → user_signed_up
```

**Drop-off points to monitor:**
- Email delivery issues (code_sent → signed_up)
- OTP validation errors

### 2. Vehicle Discovery Funnel

```
vehicle_search
  → vehicle_viewed
    → enquiry_started
```

**Insights:**
- Most searched makes/models
- Filter usage patterns
- Conversion from search to view

### 3. Enquiry Conversion Funnel

```
enquiry_started
  → enquiry_submitted
    → enquiry_success
      → enquiry_conversion
```

**Drop-off points to monitor:**
- Form abandonment (started → submitted)
- Server errors (submitted → success)

## Privacy Considerations

### Data We Track

✅ **Safe to track:**
- User IDs (hashed identifiers)
- User types (ADMIN, REGISTERED, etc.)
- Event names and timestamps
- Aggregated counts and filters
- Vehicle IDs (not personal data)

❌ **Never tracked:**
- Email addresses
- Names (first/last)
- Phone numbers
- Addresses or postcodes
- Payment information

### GDPR Compliance

- Cookie consent required before tracking
- Clear privacy policy linked in banner
- Easy opt-out mechanism
- Data retention configured in GA4/Amplitude
- User can withdraw consent at any time

### Data Retention

Configure in your analytics platforms:

**GA4:**
- Admin > Data Settings > Data Retention
- Recommended: 14 months

**Amplitude:**
- Settings > Organization Settings > Data Retention
- Free tier: 1 year, Paid: configurable

## Troubleshooting

### Events Not Appearing in GA4

1. Check GA4 Measurement ID is correct in `.env`
2. Verify `NODE_ENV=production`
3. Ensure cookie consent was accepted
4. Check browser console for errors
5. Wait 24-48 hours for data processing

### Events Not Appearing in Amplitude

1. Check Amplitude API key is correct in `.env`
2. Verify `NODE_ENV=production`
3. Ensure cookie consent was accepted
4. Check browser Network tab for `api.amplitude.com` requests
5. Events appear immediately in Amplitude (unlike GA4)

### Cookie Banner Not Showing

1. Verify `NODE_ENV=production` (banner only shows in production)
2. Clear cookies and localStorage
3. Check browser console for React errors

### Tracking in Development

Events are logged to console in development:
- Set `NODE_ENV=development`
- Open browser DevTools console
- Look for `[Analytics]` prefixed logs

**Note:** React 18's Strict Mode intentionally double-mounts components in development, which can cause events to fire twice. This is **expected behavior in development only**. To prevent duplicate events, we use `useRef` guards:

```typescript
const hasTrackedRef = useRef(false);

useEffect(() => {
  if (!hasTrackedRef.current) {
    hasTrackedRef.current = true;
    trackEvent('my_event', { /* properties */ });
  }
}, []);
```

In production (without Strict Mode), events fire only once.

## Architecture

### File Structure

```
src/
├── lib/
│   └── analytics/
│       ├── analytics-config.ts    # Configuration & consent
│       ├── google-analytics.ts    # GA4 integration
│       ├── amplitude.ts           # Amplitude integration
│       └── index.ts               # Unified API
├── components/
│   └── analytics/
│       ├── CookieBanner.tsx       # GDPR consent banner
│       └── AnalyticsProvider.tsx  # Route tracking
└── app/
    └── layout.tsx                  # GA4 scripts + providers
```

### Data Flow

```
User Action
    ↓
trackEvent() call
    ↓
Check consent & environment
    ↓
├─→ Google Analytics (gtag.js)
└─→ Amplitude (browser SDK)
```

## Adding New Events

### 1. Define the Event

Add to this documentation with:
- Event name (use snake_case)
- Description
- Trigger point
- Properties (if any)

### 2. Implement Tracking

```typescript
import { trackEvent } from "~/lib/analytics";

// In your component or hook
trackEvent('new_event_name', {
  property1: 'value1',
  property2: 'value2',
});
```

### 3. Test in Development

- Run `npm run dev`
- Trigger the event
- Check console for `[Analytics]` logs

### 4. Verify in Production

- Deploy to production
- Accept cookie consent
- Trigger the event
- Verify in GA4 Real-time + Amplitude User Lookup

## Resources

### Documentation
- [Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Amplitude Browser SDK](https://www.docs.developers.amplitude.com/data/sdks/browser-2/)
- [react-ga4](https://github.com/codler/react-ga4)
- [react-cookie-consent](https://github.com/Mastermindzh/react-cookie-consent)

### SpokeHire Analytics Dashboards
- GA4: https://analytics.google.com/ (add your property link)
- Amplitude: https://app.amplitude.com/ (add your project link)

## Support

For analytics questions or issues:
1. Check this documentation
2. Review browser console for errors
3. Test in GA4 DebugView or Amplitude User Lookup
4. Contact the development team

