# Frontend Campaign Tracking - Quick Start

## 📦 What Was Created

Three files in `src/lib/`:

1. **`campaignTracking.ts`** - Core tracking utilities
2. **`useCampaignTracking.ts`** - React hooks for easy integration
3. **`CampaignTrackingExample.tsx`** - Example components

Plus comprehensive documentation:
- **`CAMPAIGN_TRACKING_INTEGRATION.md`** - Full integration guide

---

## 🚀 Quick Integration (5 Minutes)

### Step 1: Add Environment Variable

```bash
# .env.local
VITE_API_URL=http://localhost:3000
```

### Step 2: Add to Root Component

```tsx
// In your app root or layout
import { useCampaignTracking } from '@/lib/useCampaignTracking';

function App() {
  useCampaignTracking(); // That's it! ✅

  return <YourApp />;
}
```

### Step 3: Include Session ID in Orders

```tsx
import { useCampaignSessionId } from '@/lib/useCampaignTracking';

function Checkout() {
  const sessionId = useCampaignSessionId();

  const createOrder = async (data) => {
    await fetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        sessionId, // ✅ Enables campaign attribution
      })
    });
  };
}
```

### Done! 🎉

Now when users visit your site with a campaign link like:
```
https://yourstore.com?utm_campaign=INS_SUMMER_001
```

The system will:
- ✅ Track the visit
- ✅ Store session ID for 30 days
- ✅ Automatically attribute orders to the campaign
- ✅ Track conversions and ROI

---

## 📊 Test It

1. **Visit with campaign code:**
   ```
   http://localhost:5173?utm_campaign=TEST_CAMPAIGN
   ```

2. **Check browser console:**
   ```
   ✓ Campaign visit tracked: TEST_CAMPAIGN
   ```

3. **Check localStorage:**
   - Open DevTools → Application → Local Storage
   - Look for `campaign_session_id`

4. **Create an order** and check backend:
   ```bash
   curl http://localhost:3000/analytics/campaigns/{id}/analytics
   ```

---

## 📚 Learn More

- **Full integration guide:** `CAMPAIGN_TRACKING_INTEGRATION.md`
- **Example components:** `src/lib/CampaignTrackingExample.tsx`
- **Backend documentation:** `apps/backend/docs/IMPLEMENTATION_SUMMARY.md`

---

## 🎯 Features

✅ Automatic campaign detection from URL
✅ 30-day attribution window
✅ Last-touch attribution model
✅ Session management with localStorage
✅ TypeScript support
✅ React hooks for easy integration
✅ Zero configuration needed (just add to root)
✅ Works with TanStack Router
✅ Device type detection
✅ Referrer tracking

---

## 🔑 Key Functions

```tsx
// Hooks (Recommended)
useCampaignTracking()          // Main hook - add to root
useCampaignSessionId()         // Get sessionId for orders
useCampaignActivityUpdate()    // Update activity on route change

// Core Functions (Advanced)
initializeCampaignTracking()   // Initialize manually
trackCampaignVisit()           // Track visit manually
updateCampaignActivity()       // Update activity
getSessionId()                 // Get current session
getCampaignSessionForOrder()   // Get sessionId for orders
isFromCampaign()              // Check if from campaign
getCurrentCampaignCode()       // Get current campaign code
```

---

## 💡 Optional: Show Special Offers

```tsx
function App() {
  const { isFromCampaign, campaignCode } = useCampaignTracking();

  return (
    <>
      {isFromCampaign && (
        <div className="bg-blue-500 text-white p-4">
          Welcome from {campaignCode}! Get 15% off 🎉
        </div>
      )}
      <YourApp />
    </>
  );
}
```

---

## ⚡ Performance

- Lightweight: ~2KB gzipped
- No external dependencies
- Runs asynchronously (doesn't block rendering)
- Uses localStorage (persists across sessions)
- Single API call per visit

---

## 🛠️ Troubleshooting

**Campaign not detected?**
- Check URL has `?utm_campaign=CODE`
- Verify `VITE_API_URL` is set
- Check browser console for errors

**Orders not attributed?**
- Ensure `sessionId` is included in order creation
- Check session hasn't expired (30 days)
- Verify visit was tracked (check backend)

---

## Need Help?

Check the full integration guide in `CAMPAIGN_TRACKING_INTEGRATION.md` for:
- Complete API reference
- Advanced usage examples
- Troubleshooting guide
- Best practices

Happy tracking! 🚀
