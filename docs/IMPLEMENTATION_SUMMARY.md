# Social Media Campaign Tracking - Implementation Summary

## Overview

Successfully implemented a complete social media campaign tracking system integrated into the existing analytics module. The system tracks visitors, conversions (purchases), and ROI from social media posts and reels.

---

## What Was Built

### 1. Database Schema ✅
**Location:** `/apps/backend/src/shared/db/campaign.ts`

Created 4 new tables:
- **campaigns** - Stores campaign information with hierarchical support
- **campaign_visits** - Tracks each visitor click with 30-day expiration
- **campaign_conversions** - Records purchases from campaigns
- **campaign_analytics_snapshots** - Pre-aggregated metrics for performance

Modified existing tables:
- **orders** - Added `campaign_id` and `visit_id` fields
- **customers** - Added `acquisition_campaign_id` field

**Migration:** `0004_burly_namor.sql` (successfully pushed to database)

---

### 2. TypeScript Types & Validation ✅
**Location:** `/apps/backend/src/modules/analytics/analytics.types.ts`

Added comprehensive types:
- `Campaign`, `CampaignVisit`, `CampaignConversion`
- `CampaignAnalytics`, `ParentCampaignAnalytics`, `CampaignSummary`

Zod validation schemas:
- `createCampaignSchema`, `updateCampaignSchema`
- `trackVisitSchema`, `updateActivitySchema`
- Query schemas for filtering and analytics

---

### 3. Repository Layer ✅
**Location:** `/apps/backend/src/modules/analytics/repo/campaigns.repo.ts`

Implemented database queries for:
- Campaign CRUD operations
- Visit tracking and activity updates
- Conversion recording
- Analytics aggregations (metrics, timeline, device/geo breakdown)
- Campaign leaderboard
- Auto-generated tracking codes

---

### 4. Service Layer ✅
**Location:** `/apps/backend/src/modules/analytics/services/campaigns.service.ts`

Business logic for:
- Campaign management (create, update, delete, activate/deactivate)
- Visit tracking with device detection
- Last-touch attribution (30-day window)
- Comprehensive analytics with optional breakdowns
- Parent campaign aggregation
- Campaigns overview

---

### 5. API Routes ✅
**Location:** `/apps/backend/src/modules/analytics/analytics.routes.ts`

Added 15+ new endpoints:

**Campaign Management:**
- `POST /analytics/campaigns` - Create campaign
- `GET /analytics/campaigns` - List campaigns with filters
- `GET /analytics/campaigns/:id` - Get campaign by ID
- `GET /analytics/campaigns/:id/children` - Get child campaigns
- `PUT /analytics/campaigns/:id` - Update campaign
- `DELETE /analytics/campaigns/:id` - Delete campaign
- `PUT /analytics/campaigns/:id/activate` - Activate campaign
- `PUT /analytics/campaigns/:id/deactivate` - Deactivate campaign

**Visit Tracking:**
- `POST /analytics/campaigns/track-visit` - Track visitor (frontend)
- `POST /analytics/campaigns/update-activity` - Update activity
- `GET /analytics/campaigns/:id/visits` - Get all visits

**Analytics:**
- `GET /analytics/campaigns/:id/analytics` - Comprehensive analytics
- `GET /analytics/campaigns/:id/conversions` - All conversions
- `GET /analytics/campaigns/:id/parent-analytics` - Parent + children
- `GET /analytics/campaigns/leaderboard` - Top campaigns
- `GET /analytics/campaigns/overview` - All campaigns overview

---

### 6. Order Integration ✅
**Location:** `/apps/backend/src/modules/orders/services/orders.service.ts`

Modified order creation to:
- Accept optional `sessionId` parameter
- Automatically attribute orders to campaigns
- Handle last-touch attribution (most recent visit within 30 days)
- Mark visits as converted
- Create conversion records
- Track first acquisition campaign for customers

**Updated schema:** Added `sessionId` to `createOrderSchema`

---

## How It Works

### Creating a Campaign

```typescript
POST /analytics/campaigns

{
  "name": "Summer Sale Instagram Reel",
  "platform": "instagram",
  "campaignType": "reel",
  "postUrl": "https://instagram.com/p/xyz",
  "cost": 250.00,
  "budget": 300.00
}

Response:
{
  "success": true,
  "data": {
    "campaign": { ... },
    "trackingUrl": "https://yourstore.com?utm_campaign=INS_SUMMER_SALE_INSTA_123456"
  }
}
```

### Tracking a Visit (Frontend Integration)

```javascript
// In your frontend app initialization
const urlParams = new URLSearchParams(window.location.search);
const trackingCode = urlParams.get('utm_campaign');

if (trackingCode) {
  const sessionId = getOrCreateSessionId(); // from localStorage

  fetch('/analytics/campaigns/track-visit', {
    method: 'POST',
    body: JSON.stringify({
      trackingCode,
      sessionId,
      landingPage: window.location.pathname,
      userAgent: navigator.userAgent,
      referrer: document.referrer
    })
  });
}
```

### Creating an Order with Attribution

```typescript
POST /orders

{
  "customerId": "...",
  "sessionId": "session-abc-123", // Include session ID
  "items": [...],
  "shippingAddressId": "...",
  "billingAddressId": "...",
  "shippingMethodId": "..."
}

// Backend automatically:
// 1. Creates the order
// 2. Finds active visits for session
// 3. Attributes to most recent campaign (last-touch)
// 4. Marks visit as converted
// 5. Creates conversion record
```

### Viewing Analytics

```typescript
GET /analytics/campaigns/{id}/analytics?includeTimeline=true&includeProducts=true

Response:
{
  "success": true,
  "data": {
    "campaign": { ... },
    "metrics": {
      "totalVisits": 1250,
      "uniqueVisitors": 980,
      "totalConversions": 45,
      "conversionRate": "3.60",
      "totalRevenue": "6750.00",
      "averageOrderValue": "150.00",
      "roi": "2600.00", // ((6750 - 250) / 250) * 100
      "costPerVisit": "0.20",
      "costPerConversion": "5.56"
    },
    "timeline": [...],
    "topProducts": [...],
    "deviceBreakdown": [...],
    "geographicBreakdown": [...]
  }
}
```

---

## Key Features Implemented

### ✅ Hierarchical Campaigns
- Parent campaigns (e.g., "Summer 2024 Sale")
- Child campaigns (individual posts/reels)
- Aggregate analytics across children

### ✅ Last-Touch Attribution
- 30-day rolling window
- Credit goes to most recent campaign
- Automatic session extension on activity

### ✅ Comprehensive Tracking
- Visitor tracking with device detection
- Geographic tracking (country, city)
- Referrer tracking
- Landing page tracking

### ✅ Rich Analytics
- Real-time metrics calculation
- Timeline/trend analysis
- Top products from campaigns
- Device breakdown
- Geographic breakdown
- Campaign leaderboard
- ROI calculation

### ✅ Automatic Code Generation
- Platform-based prefixes (INS, TIK, FB, etc.)
- Sanitized campaign names
- Timestamp suffixes for uniqueness

---

## Database Indexes

Added for optimal query performance:
- `campaigns.tracking_code` (UNIQUE)
- `campaigns.parent_campaign_id`
- `campaigns.platform`
- `campaigns.is_active`
- `campaign_visits.session_id`
- `campaign_visits.campaign_id`
- `campaign_visits.customer_id`
- `campaign_visits.expires_at`
- `campaign_visits.converted`

---

## Attribution Logic

### Session Management
1. Visitor clicks tracking link with `utm_campaign=TRACKING_CODE`
2. Frontend generates UUID session ID (stored in localStorage)
3. Backend creates `campaign_visit` record with 30-day expiration
4. On each page view, `last_activity_at` and `expires_at` are updated

### Conversion Flow
1. Order is created with optional `sessionId`
2. System finds all active visits for that session
3. Selects most recent visit (last-touch attribution)
4. Creates `campaign_conversion` record
5. Marks visit as converted
6. Links order to campaign via `campaign_id` and `visit_id`
7. If first order, sets `customer.acquisition_campaign_id`

### Multi-Touch Scenario
```
Day 1:  Click Campaign A → Visit A (expires Day 31)
Day 10: Click Campaign B → Visit B (expires Day 40)
Day 15: Click Campaign C → Visit C (expires Day 45)
Day 20: Purchase → Campaign C gets credit (most recent)
```

---

## Configuration

### Environment Variables
Add to `.env`:
```bash
FRONTEND_URL=https://yourstore.com
```

Used for generating tracking URLs.

---

## Testing Guide

### 1. Create a Campaign
```bash
curl -X POST http://localhost:3000/analytics/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Instagram Reel",
    "platform": "instagram",
    "campaignType": "reel",
    "cost": 100
  }'
```

### 2. Track a Visit
```bash
curl -X POST http://localhost:3000/analytics/campaigns/track-visit \
  -H "Content-Type: application/json" \
  -d '{
    "trackingCode": "INS_TEST_INSTAGRAM_REEL_123456",
    "sessionId": "00000000-0000-0000-0000-000000000001",
    "landingPage": "/products/summer-dress",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://instagram.com"
  }'
```

### 3. Create an Order
```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-uuid",
    "sessionId": "00000000-0000-0000-0000-000000000001",
    "items": [...]
    "shippingAddressId": "address-uuid",
    "billingAddressId": "address-uuid",
    "shippingMethodId": "shipping-uuid"
  }'
```

### 4. View Analytics
```bash
curl http://localhost:3000/analytics/campaigns/{campaign-id}/analytics?includeTimeline=true
```

---

## Next Steps (Future Enhancements)

1. **Frontend Implementation**
   - Create campaign management UI
   - Build analytics dashboard
   - Add tracking script to app

2. **Advanced Features**
   - Influencer commission tracking
   - A/B testing support
   - Multi-currency support
   - Email campaign integration

3. **Optimization**
   - Redis caching for frequently accessed analytics
   - Background job for snapshot generation
   - Data retention policies

4. **Integration**
   - Social media API integration
   - Google Analytics integration
   - Facebook Pixel integration

---

## Files Created/Modified

### Created:
- `/apps/backend/src/shared/db/campaign.ts`
- `/apps/backend/src/modules/analytics/repo/campaigns.repo.ts`
- `/apps/backend/src/modules/analytics/services/campaigns.service.ts`
- `/apps/backend/drizzle/migrations/0004_burly_namor.sql`
- `/docs/SOCIAL_MEDIA_TRACKING_PLAN.md`
- `/docs/IMPLEMENTATION_SUMMARY.md` (this file)

### Modified:
- `/apps/backend/src/shared/db/schema.ts` - Added campaign export
- `/apps/backend/src/shared/db/order.ts` - Added campaign fields
- `/apps/backend/src/shared/db/customer.ts` - Added acquisition_campaign_id
- `/apps/backend/src/modules/analytics/analytics.types.ts` - Added campaign types
- `/apps/backend/src/modules/analytics/analytics.routes.ts` - Added campaign routes
- `/apps/backend/src/modules/analytics/repo/index.ts` - Exported campaigns repo
- `/apps/backend/src/modules/analytics/services/index.ts` - Exported campaigns service
- `/apps/backend/src/modules/orders/services/orders.service.ts` - Added attribution
- `/apps/backend/src/modules/orders/orders.types.ts` - Added sessionId field

---

## Summary

The social media campaign tracking system is **fully implemented** and ready for use. All database tables, APIs, and business logic are in place. The system supports:

- Creating trackable links for social media posts
- Tracking visitors with 30-day attribution windows
- Automatic conversion tracking on purchases
- Comprehensive analytics including ROI, conversion rates, and revenue
- Hierarchical campaign organization
- Last-touch attribution model

The only remaining work is building the frontend UI for campaign management and displaying analytics dashboards.
