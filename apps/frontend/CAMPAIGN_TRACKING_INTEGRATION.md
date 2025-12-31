# Campaign Tracking Integration Guide

This guide shows you how to integrate campaign tracking into your frontend app.

## Overview

The campaign tracking system allows you to:
- Track visitors from social media campaigns
- Automatically attribute orders to campaigns
- Manage 30-day attribution windows
- Track conversions and ROI

---

## Quick Start

### Step 1: Configure API URL

Add your backend API URL to your environment variables:

```bash
# .env or .env.local
VITE_API_URL=http://localhost:3000
```

For production:
```bash
VITE_API_URL=https://api.yourstore.com
```

---

### Step 2: Initialize Tracking in Your Root Component

Add campaign tracking to your root layout or App component:

```tsx
// app/routes/__root.tsx or similar
import { useCampaignTracking } from '@/lib/useCampaignTracking';

export function RootLayout() {
  // Automatically track campaigns on mount
  const { isFromCampaign, campaignCode } = useCampaignTracking({
    onCampaignDetected: (code) => {
      console.log('Campaign detected:', code);
      // Optional: Show welcome message, special offer, etc.
    }
  });

  return (
    <div>
      {/* Your app layout */}
      {isFromCampaign && (
        <div className="bg-blue-100 p-2 text-center">
          Welcome from our campaign! 🎉
        </div>
      )}
      <Outlet />
    </div>
  );
}
```

---

### Step 3: Update Activity on Route Changes (Optional)

To extend the 30-day attribution window, update activity when users navigate:

```tsx
// app/routes/__root.tsx
import { useCampaignActivityUpdate } from '@/lib/useCampaignTracking';
import { useLocation } from '@tanstack/react-router';

export function RootLayout() {
  const location = useLocation();

  // Update activity on route change
  useCampaignActivityUpdate();

  return <Outlet />;
}
```

Or manually on specific routes:

```tsx
import { updateCampaignActivity } from '@/lib/campaignTracking';

function ProductPage() {
  useEffect(() => {
    updateCampaignActivity();
  }, []);

  return <div>Product details...</div>;
}
```

---

### Step 4: Include Session ID in Orders

When creating orders, include the session ID for attribution:

```tsx
// In your checkout or order creation component
import { useCampaignSessionId } from '@/lib/useCampaignTracking';

function CheckoutPage() {
  const sessionId = useCampaignSessionId();

  const handleCreateOrder = async (orderData) => {
    const response = await fetch('http://localhost:3000/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderData,
        sessionId, // ✅ Include this for campaign attribution
      }),
    });

    // Handle response...
  };

  return (
    <form onSubmit={handleCreateOrder}>
      {/* Your checkout form */}
    </form>
  );
}
```

---

## Advanced Usage

### Manual Tracking

If you need more control, use the core functions directly:

```tsx
import {
  trackCampaignVisit,
  getSessionId,
  getCampaignSessionForOrder,
} from '@/lib/campaignTracking';

// Manually track a visit
const trackingCode = 'INS_SUMMER_SALE_123456';
await trackCampaignVisit(trackingCode, {
  landingPage: '/special-offer',
  referrer: 'https://instagram.com',
});

// Get current session ID
const sessionId = getSessionId();

// Get session ID for orders
const orderSessionId = getCampaignSessionForOrder();
```

---

### Check if User is from Campaign

```tsx
import { isFromCampaign, getCurrentCampaignCode } from '@/lib/campaignTracking';

function SpecialOfferBanner() {
  const fromCampaign = isFromCampaign();
  const campaignCode = getCurrentCampaignCode();

  if (!fromCampaign) return null;

  return (
    <div className="banner">
      <h2>Special Offer for {campaignCode} Visitors!</h2>
      <p>Get 15% off your first order</p>
    </div>
  );
}
```

---

### Custom Campaign Detection Logic

```tsx
import { useCampaignTracking } from '@/lib/useCampaignTracking';
import { toast } from 'sonner';

function App() {
  const { campaignCode, isFromCampaign } = useCampaignTracking({
    onCampaignDetected: (code) => {
      // Show toast notification
      toast.success(`Welcome from ${code}! Enjoy exclusive offers.`);

      // Track in analytics
      if (window.gtag) {
        window.gtag('event', 'campaign_visit', {
          campaign_code: code,
        });
      }
    }
  });

  return <div>Your app...</div>;
}
```

---

## Testing

### Test Campaign Tracking

1. **Add tracking code to URL:**
   ```
   http://localhost:5173?utm_campaign=TEST_CAMPAIGN_001
   ```

2. **Check browser console:**
   You should see: `✓ Campaign visit tracked: TEST_CAMPAIGN_001`

3. **Verify in localStorage:**
   Open DevTools → Application → Local Storage → Look for `campaign_session_id`

4. **Check backend:**
   ```bash
   curl http://localhost:3000/analytics/campaigns
   ```

### Test Order Attribution

1. **Visit with campaign code:**
   ```
   http://localhost:5173?utm_campaign=TEST_CAMPAIGN_001
   ```

2. **Create an order** (make sure sessionId is included)

3. **Check campaign analytics:**
   ```bash
   # Get the campaign ID from the list
   curl http://localhost:3000/analytics/campaigns

   # View analytics
   curl http://localhost:3000/analytics/campaigns/{campaign-id}/analytics
   ```

   You should see:
   - `totalVisits: 1`
   - `totalConversions: 1`
   - `totalRevenue: [order total]`

---

## API Reference

### Core Functions

#### `initializeCampaignTracking()`
Initializes campaign tracking on app load. Checks URL for tracking codes and tracks visits.

```tsx
await initializeCampaignTracking({
  onTrackingDetected: (code) => console.log(code),
});
```

#### `trackCampaignVisit(trackingCode, options)`
Manually track a campaign visit.

```tsx
await trackCampaignVisit('INS_SUMMER_001', {
  landingPage: '/products',
  referrer: 'https://instagram.com',
});
```

#### `updateCampaignActivity()`
Updates visit activity, extending the 30-day attribution window.

```tsx
await updateCampaignActivity();
```

#### `getSessionId()`
Returns the current session ID or null if none exists.

```tsx
const sessionId = getSessionId(); // "uuid-string" or null
```

#### `getCampaignSessionForOrder()`
Returns session ID for order attribution (returns undefined if no session).

```tsx
const sessionId = getCampaignSessionForOrder(); // "uuid" or undefined
```

#### `isFromCampaign()`
Checks if the current session came from a campaign.

```tsx
const fromCampaign = isFromCampaign(); // true or false
```

#### `getCurrentCampaignCode()`
Returns the tracking code of the current campaign.

```tsx
const code = getCurrentCampaignCode(); // "INS_SUMMER_001" or null
```

#### `clearCampaignSession()`
Clears the campaign session (useful for testing).

```tsx
clearCampaignSession();
```

---

### React Hooks

#### `useCampaignTracking(options)`
Main hook for campaign tracking.

```tsx
const {
  isFromCampaign,    // boolean
  campaignCode,      // string | null
  sessionId,         // string | null
  isTracking,        // boolean
  wasTracked,        // boolean
} = useCampaignTracking({
  trackOnMount: true,
  onCampaignDetected: (code) => { /* callback */ }
});
```

#### `useCampaignActivityUpdate()`
Hook to update activity on component mount.

```tsx
useCampaignActivityUpdate(); // Call in route components
```

#### `useCampaignSessionId()`
Hook to get session ID for orders.

```tsx
const sessionId = useCampaignSessionId(); // string | undefined
```

---

## Complete Integration Example

```tsx
// app/routes/__root.tsx
import { useCampaignTracking, useCampaignActivityUpdate } from '@/lib/useCampaignTracking';
import { Outlet } from '@tanstack/react-router';
import { toast } from 'sonner';

export function RootLayout() {
  // Track campaigns on app load
  const { isFromCampaign, campaignCode } = useCampaignTracking({
    onCampaignDetected: (code) => {
      toast.success(`Welcome! Enjoy special offers from ${code}`);
    }
  });

  // Update activity on route changes
  useCampaignActivityUpdate();

  return (
    <div>
      {isFromCampaign && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 text-center">
          🎉 Exclusive offer for {campaignCode} visitors - Get 15% off!
        </div>
      )}
      <Outlet />
    </div>
  );
}
```

```tsx
// app/routes/checkout.tsx
import { useCampaignSessionId } from '@/lib/useCampaignTracking';

export function CheckoutPage() {
  const sessionId = useCampaignSessionId();

  const createOrder = async (formData) => {
    const orderData = {
      customerId: formData.customerId,
      shippingAddressId: formData.shippingAddressId,
      billingAddressId: formData.billingAddressId,
      items: formData.items,
      shippingMethodId: formData.shippingMethodId,
      sessionId, // ✅ Campaign attribution
    };

    const response = await fetch('http://localhost:3000/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (result.success) {
      toast.success('Order created successfully!');
      // Order is now attributed to the campaign
    }
  };

  return <div>Checkout form...</div>;
}
```

---

## How It Works

1. **User clicks campaign link:**
   ```
   https://yourstore.com?utm_campaign=INS_SUMMER_001
   ```

2. **Frontend detects tracking code** and calls backend:
   ```tsx
   POST /analytics/campaigns/track-visit
   {
     "trackingCode": "INS_SUMMER_001",
     "sessionId": "uuid-generated",
     "landingPage": "/",
     "userAgent": "Mozilla/5.0...",
     "referrer": "https://instagram.com"
   }
   ```

3. **Backend creates visit record** with 30-day expiration

4. **User browses site** - Activity updates extend the window

5. **User creates order** with `sessionId`:
   ```tsx
   POST /orders
   {
     "customerId": "...",
     "sessionId": "uuid-from-visit",
     "items": [...]
   }
   ```

6. **Backend automatically:**
   - Finds the visit by sessionId
   - Attributes order to campaign (last-touch)
   - Creates conversion record
   - Updates analytics

7. **View results:**
   ```bash
   GET /analytics/campaigns/{id}/analytics
   ```

---

## Troubleshooting

### Tracking code not detected
- Check URL has `?utm_campaign=CODE`
- Check browser console for errors
- Verify API_URL is correct in environment

### Orders not attributed
- Ensure `sessionId` is included when creating orders
- Check if session has expired (30 days)
- Verify visit was created (check backend logs)

### Session not persisting
- Check localStorage is enabled
- Check for browser privacy modes blocking localStorage
- Verify session hasn't expired

---

## Best Practices

1. **Always include sessionId in orders** - Even if it's undefined, it won't break anything
2. **Update activity on key pages** - Product pages, checkout, etc.
3. **Don't track admin/internal users** - Add logic to skip tracking for admin routes
4. **Test thoroughly** - Use multiple tracking codes to verify attribution
5. **Monitor analytics** - Check campaigns regularly to ensure tracking works

---

## Next Steps

1. ✅ Add tracking to your root component
2. ✅ Include sessionId in order creation
3. ✅ Test with a campaign link
4. 🚀 Build a campaign analytics dashboard
5. 🚀 Show special offers to campaign visitors
6. 🚀 A/B test different campaign landing pages

Happy tracking! 🎯
