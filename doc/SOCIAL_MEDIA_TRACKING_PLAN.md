# Social Media Campaign Tracking System - Implementation Plan

## Overview

This document outlines the complete implementation plan for a social media campaign tracking system that allows tracking visitors, conversions (purchases), and ROI from social media posts and reels.

---

## Business Requirements

### Goals
1. **Track Visitors**: Record every person who clicks on a trackable link from a social media post/reel
2. **Track Conversions**: Identify which visitors make purchases (referred to as "conversations" = conversions)
3. **Calculate ROI**: Compare campaign cost/budget vs revenue generated
4. **Campaign Hierarchy**: Group related posts/reels under parent campaigns (e.g., "Summer 2024 Campaign")
5. **Attribution**: Use **last-touch attribution** with a **30-day window**

### Attribution Rules
- **Last-Touch Attribution**: If a customer clicks multiple campaign links, credit goes to the most recent one
- **30-Day Window**: A visitor's session is valid for 30 days from their last visit
- **Conversion Window**: Only purchases within 30 days of clicking a campaign link are attributed to that campaign

---

## Database Schema (Normalized)

### New Tables

#### 1. `campaigns`
Main campaign tracking table with hierarchical support.

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,  -- For campaign hierarchy
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL,  -- instagram | facebook | tiktok | youtube | twitter | other
  campaign_type TEXT NOT NULL,  -- post | reel | story | video | ad
  post_url TEXT,  -- URL to the actual post/reel
  tracking_code TEXT UNIQUE NOT NULL,  -- Short code like "INSTA_SUMMER_01"
  cost DECIMAL(10, 2) DEFAULT 0,  -- Cost of creating/boosting the post
  budget DECIMAL(10, 2) DEFAULT 0,  -- Total budget allocated
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,  -- Extra data (hashtags, influencer info, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_tracking_code ON campaigns(tracking_code);
CREATE INDEX idx_campaigns_parent_id ON campaigns(parent_campaign_id);
CREATE INDEX idx_campaigns_platform ON campaigns(platform);
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);
```

**Fields Explanation:**
- `parent_campaign_id`: Links child campaigns to parent (e.g., "Summer Sale" parent with multiple reel children)
- `tracking_code`: Unique identifier for the campaign (used in URLs)
- `cost`: Actual spend on creating/boosting the content
- `budget`: Planned/allocated budget
- `platform`: Social media platform
- `campaign_type`: Type of content
- `metadata`: Flexible JSON field for hashtags, notes, etc.

---

#### 2. `campaign_visits`
Tracks each visitor who clicks a campaign link.

```sql
CREATE TABLE campaign_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,  -- Unique session identifier (stored in browser)
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,  -- Linked when customer registers/logs in
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,  -- Where they came from (should be social media platform)
  landing_page TEXT,  -- First page they visited
  country TEXT,
  city TEXT,
  device_type TEXT,  -- mobile | tablet | desktop
  visited_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),  -- Updated on each page view
  converted BOOLEAN DEFAULT false,  -- Did they make a purchase?
  conversion_at TIMESTAMP,  -- When they converted
  attributed_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,  -- The order that converted
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')  -- Attribution window expiry
);

CREATE INDEX idx_campaign_visits_session_id ON campaign_visits(session_id);
CREATE INDEX idx_campaign_visits_campaign_id ON campaign_visits(campaign_id);
CREATE INDEX idx_campaign_visits_customer_id ON campaign_visits(customer_id);
CREATE INDEX idx_campaign_visits_expires_at ON campaign_visits(expires_at);
CREATE INDEX idx_campaign_visits_converted ON campaign_visits(converted);
```

**Fields Explanation:**
- `session_id`: Generated on first visit, stored in browser cookie/localStorage
- `customer_id`: Initially NULL, set when visitor registers or logs in
- `last_activity_at`: Updated whenever visitor browses the site (extends session)
- `expires_at`: Session expires 30 days after last activity
- `converted`: Flag indicating if this visit resulted in a purchase
- `attributed_order_id`: The specific order that was converted

---

#### 3. `campaign_conversions`
Tracks sales/revenue from campaigns.

```sql
CREATE TABLE campaign_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES campaign_visits(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  revenue DECIMAL(10, 2) NOT NULL,  -- Order total
  converted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaign_conversions_campaign_id ON campaign_conversions(campaign_id);
CREATE INDEX idx_campaign_conversions_order_id ON campaign_conversions(order_id);
CREATE INDEX idx_campaign_conversions_customer_id ON campaign_conversions(customer_id);
```

**Fields Explanation:**
- `revenue`: The order total (from orders.total)
- No `profit` or `commission` fields (not needed per user requirements)

---

#### 4. `campaign_analytics_snapshots`
Pre-aggregated analytics for faster querying (daily/hourly rollups).

```sql
CREATE TABLE campaign_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_hour INTEGER CHECK (snapshot_hour >= 0 AND snapshot_hour <= 23),  -- NULL for daily, 0-23 for hourly
  total_visits INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,  -- Distinct session_ids
  total_conversions INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,  -- Calculated: (conversions/visits) * 100
  roi DECIMAL(10, 2) DEFAULT 0,  -- Calculated: ((revenue - cost) / cost) * 100
  average_order_value DECIMAL(10, 2) DEFAULT 0,  -- revenue / conversions
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, snapshot_date, snapshot_hour)
);

CREATE INDEX idx_snapshots_campaign_date ON campaign_analytics_snapshots(campaign_id, snapshot_date);
```

**Fields Explanation:**
- `snapshot_hour`: NULL for daily snapshots, 0-23 for hourly granularity
- `roi`: ROI percentage calculated as ((revenue - cost) / cost) * 100
- Unique constraint ensures one snapshot per campaign per period

---

### Modified Tables

#### `orders` Table
Add campaign attribution fields.

```sql
ALTER TABLE orders ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN visit_id UUID REFERENCES campaign_visits(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_campaign_id ON orders(campaign_id);
CREATE INDEX idx_orders_visit_id ON orders(visit_id);
```

---

#### `customers` Table
Track first acquisition campaign (optional but useful).

```sql
ALTER TABLE customers ADD COLUMN acquisition_campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX idx_customers_acquisition_campaign ON customers(acquisition_campaign_id);
```

---

## Database Relationships Diagram

```
┌─────────────────┐
│   campaigns     │ (Parent)
│  (parent=NULL)  │
└────────┬────────┘
         │ 1:Many (parent_campaign_id)
         │
         ▼
┌─────────────────┐
│   campaigns     │ (Children)
│  (parent_id=X)  │
└────────┬────────┘
         │ 1:Many
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────────────┐
│ campaign_visits  │  │   orders     │  │ campaign_conversions │
└──────┬───────────┘  └──────┬───────┘  └──────────────────────┘
       │                     │
       │ Many:1              │ Many:1
       ▼                     ▼
┌──────────────────┐  ┌──────────────┐
│    customers     │  │    orders    │
└──────────────────┘  └──────────────┘
```

---

## How It Works: End-to-End Flow

### 1. Creating a Parent Campaign

```
POST /campaigns

Request:
{
  "name": "Summer 2024 Sale",
  "description": "Main summer campaign across all platforms",
  "platform": "multi",
  "campaign_type": "campaign",
  "budget": 5000.00,
  "starts_at": "2024-06-01T00:00:00Z",
  "ends_at": "2024-08-31T23:59:59Z"
}

Response:
{
  "success": true,
  "data": {
    "id": "parent-uuid",
    "name": "Summer 2024 Sale",
    "tracking_code": "SUMMER_2024",
    "is_active": true
  }
}
```

---

### 2. Creating Child Campaign (Specific Post/Reel)

```
POST /campaigns

Request:
{
  "parent_campaign_id": "parent-uuid",
  "name": "Summer Dress Reel - Instagram",
  "platform": "instagram",
  "campaign_type": "reel",
  "post_url": "https://instagram.com/p/xyz123",
  "cost": 250.00,
  "budget": 300.00
}

Response:
{
  "success": true,
  "data": {
    "id": "child-uuid",
    "parent_campaign_id": "parent-uuid",
    "name": "Summer Dress Reel - Instagram",
    "tracking_code": "INSTA_SUMMER_DRESS_01",
    "tracking_url": "https://yourstore.com?utm_campaign=INSTA_SUMMER_DRESS_01",
    "is_active": true
  }
}
```

**Use this URL in your Instagram bio or post caption!**

---

### 3. Visitor Clicks the Trackable Link

**User Action:**
Clicks: `https://yourstore.com?utm_campaign=INSTA_SUMMER_DRESS_01`

**Frontend (Auto-triggered):**
```javascript
// On app load, check for campaign parameter
const urlParams = new URLSearchParams(window.location.search);
const trackingCode = urlParams.get('utm_campaign');

if (trackingCode) {
  const sessionId = getOrCreateSessionId(); // From localStorage or generate new

  // Call backend to record visit
  fetch('/campaigns/track-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tracking_code: trackingCode,
      session_id: sessionId,
      landing_page: window.location.pathname,
      user_agent: navigator.userAgent,
      referrer: document.referrer
    })
  });
}
```

**Backend API:**
```
POST /campaigns/track-visit

Request:
{
  "tracking_code": "INSTA_SUMMER_DRESS_01",
  "session_id": "session-abc-123",
  "landing_page": "/products/summer-dress",
  "user_agent": "Mozilla/5.0 (iPhone...)",
  "referrer": "https://instagram.com"
}

Backend Logic:
1. Find campaign by tracking_code
2. Check if session_id already has an active visit (within 30 days)
   - If yes: Update last_activity_at and expires_at (extend by 30 days)
   - If no: Create new campaign_visit record
3. Extract device_type from user_agent
4. Extract country/city from IP (optional - use geolocation service)

Response:
{
  "success": true,
  "data": {
    "visit_id": "visit-uuid",
    "campaign_id": "child-uuid",
    "expires_at": "2024-07-15T10:30:00Z"  // 30 days from now
  }
}
```

---

### 4. Visitor Browses the Site (Activity Tracking)

**Frontend (On page navigation):**
```javascript
// Update activity on each page view
const sessionId = localStorage.getItem('campaign_session_id');

if (sessionId) {
  fetch('/campaigns/update-activity', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId })
  });
}
```

**Backend:**
```
POST /campaigns/update-activity

Request:
{
  "session_id": "session-abc-123"
}

Backend Logic:
1. Find campaign_visit by session_id where expires_at > NOW()
2. Update last_activity_at = NOW()
3. Update expires_at = NOW() + 30 days (reset window)

Response:
{
  "success": true
}
```

---

### 5. Visitor Makes a Purchase (Conversion)

**Frontend (Order creation):**
```javascript
const sessionId = localStorage.getItem('campaign_session_id');

fetch('/orders', {
  method: 'POST',
  body: JSON.stringify({
    customer_id: customerId,
    session_id: sessionId,  // Include session_id!
    items: [...],
    shipping_address_id: addressId,
    // ... rest of order data
  })
});
```

**Backend (Modified order creation flow):**
```
POST /orders

Request:
{
  "customer_id": "customer-uuid",
  "session_id": "session-abc-123",  // NEW FIELD
  "items": [...],
  "shipping_address_id": "address-uuid",
  "billing_address_id": "address-uuid"
}

Backend Logic (in orders.service.ts):
1. Create order as usual (calculate tax, shipping, etc.)
2. **NEW: Campaign Attribution Logic**

   IF session_id is provided:
     a. Find ALL campaign_visits for this session_id where expires_at > NOW()
     b. Sort by visited_at DESC (most recent first)
     c. Select the FIRST one (last-touch attribution)
     d. If found:
        - Set orders.campaign_id = visit.campaign_id
        - Set orders.visit_id = visit.id
        - Create campaign_conversions record:
          {
            campaign_id: visit.campaign_id,
            visit_id: visit.id,
            order_id: new_order.id,
            customer_id: customer.id,
            revenue: order.total
          }
        - Update campaign_visits:
          {
            converted: true,
            conversion_at: NOW(),
            attributed_order_id: new_order.id,
            customer_id: customer.id (if not already set)
          }
        - IF customer.acquisition_campaign_id is NULL:
          {
            Set customer.acquisition_campaign_id = visit.campaign_id
          }

Response:
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "order_number": "ORD-12345",
    "campaign_id": "child-uuid",  // Attributed!
    "total": 150.00,
    ...
  }
}
```

---

### 6. Last-Touch Attribution Example

**Scenario:**
- Day 1: User clicks Campaign A → Creates visit_1 (expires Day 31)
- Day 10: User clicks Campaign B → Creates visit_2 (expires Day 40)
- Day 15: User clicks Campaign C → Creates visit_3 (expires Day 45)
- Day 20: User makes purchase

**Attribution Logic:**
```sql
-- Find all active visits for session
SELECT * FROM campaign_visits
WHERE session_id = 'session-abc-123'
  AND expires_at > NOW()
ORDER BY visited_at DESC
LIMIT 1;

-- Result: visit_3 (Campaign C) - most recent
-- Credit goes to Campaign C
```

---

### 7. View Campaign Analytics

#### Individual Campaign Performance

```
GET /campaigns/{id}/analytics?start_date=2024-06-01&end_date=2024-06-30

Response:
{
  "success": true,
  "data": {
    "campaign": {
      "id": "child-uuid",
      "name": "Summer Dress Reel - Instagram",
      "tracking_code": "INSTA_SUMMER_DRESS_01",
      "platform": "instagram",
      "cost": 250.00,
      "budget": 300.00,
      "parent_campaign": {
        "id": "parent-uuid",
        "name": "Summer 2024 Sale"
      }
    },
    "metrics": {
      "total_visits": 1250,
      "unique_visitors": 980,
      "total_conversions": 45,  // "conversations" in user's terms
      "conversion_rate": 3.6,   // (45/1250) * 100
      "total_revenue": 6750.00,
      "average_order_value": 150.00,  // 6750 / 45
      "roi": 2600,              // ((6750 - 250) / 250) * 100
      "cost_per_visit": 0.20,   // 250 / 1250
      "cost_per_conversion": 5.56  // 250 / 45
    },
    "timeline": [
      {
        "date": "2024-06-01",
        "visits": 120,
        "conversions": 5,
        "revenue": 750.00
      },
      {
        "date": "2024-06-02",
        "visits": 95,
        "conversions": 3,
        "revenue": 450.00
      }
      // ... rest of timeline
    ],
    "top_products": [
      {
        "product_id": "prod-uuid",
        "product_name": "Summer Dress",
        "quantity_sold": 15,
        "revenue": 2250.00
      }
    ],
    "device_breakdown": [
      { "device_type": "mobile", "visits": 900, "conversions": 35 },
      { "device_type": "desktop", "visits": 300, "conversions": 8 },
      { "device_type": "tablet", "visits": 50, "conversions": 2 }
    ],
    "geographic_breakdown": [
      { "country": "US", "visits": 800, "conversions": 30, "revenue": 4500.00 },
      { "country": "CA", "visits": 250, "conversions": 10, "revenue": 1500.00 }
    ]
  }
}
```

---

#### Parent Campaign (Aggregate)

```
GET /campaigns/{parent-id}/analytics?include_children=true

Response:
{
  "success": true,
  "data": {
    "campaign": {
      "id": "parent-uuid",
      "name": "Summer 2024 Sale",
      "total_budget": 5000.00,
      "total_cost": 4200.00,
      "child_count": 8
    },
    "metrics": {
      "total_visits": 15000,
      "unique_visitors": 12000,
      "total_conversions": 450,
      "conversion_rate": 3.0,
      "total_revenue": 67500.00,
      "average_order_value": 150.00,
      "roi": 1507,  // ((67500 - 4200) / 4200) * 100
      "cost_per_conversion": 9.33
    },
    "children": [
      {
        "id": "child-1-uuid",
        "name": "Summer Dress Reel - Instagram",
        "platform": "instagram",
        "visits": 1250,
        "conversions": 45,
        "revenue": 6750.00,
        "roi": 2600
      },
      {
        "id": "child-2-uuid",
        "name": "Beach Collection - TikTok",
        "platform": "tiktok",
        "visits": 3200,
        "conversions": 120,
        "revenue": 18000.00,
        "roi": 3500
      }
      // ... more children
    ],
    "platform_breakdown": [
      { "platform": "instagram", "visits": 5000, "conversions": 150, "revenue": 22500 },
      { "platform": "tiktok", "visits": 8000, "conversions": 250, "revenue": 37500 },
      { "platform": "facebook", "visits": 2000, "conversions": 50, "revenue": 7500 }
    ]
  }
}
```

---

#### Campaign Leaderboard

```
GET /campaigns/leaderboard?metric=roi&limit=10

Response:
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "campaign_id": "child-2-uuid",
      "name": "Beach Collection - TikTok",
      "platform": "tiktok",
      "cost": 500.00,
      "revenue": 18000.00,
      "roi": 3500,
      "conversions": 120
    },
    {
      "rank": 2,
      "campaign_id": "child-1-uuid",
      "name": "Summer Dress Reel - Instagram",
      "platform": "instagram",
      "cost": 250.00,
      "revenue": 6750.00,
      "roi": 2600,
      "conversions": 45
    }
    // ... top 10
  ]
}
```

---

## API Endpoints

### Campaign Management

```
POST   /campaigns                          Create new campaign
GET    /campaigns                          List all campaigns (with filters)
GET    /campaigns/:id                      Get campaign details
GET    /campaigns/:id/children             Get child campaigns
PUT    /campaigns/:id                      Update campaign
DELETE /campaigns/:id                      Delete campaign
PUT    /campaigns/:id/activate             Activate campaign
PUT    /campaigns/:id/deactivate           Deactivate campaign
```

### Visit Tracking

```
POST   /campaigns/track-visit              Record a visitor (called by frontend)
POST   /campaigns/update-activity          Update last activity time
GET    /campaigns/:id/visits               Get all visits for a campaign
GET    /campaigns/:id/visits/active        Get active visits (not expired)
```

### Analytics & Reporting

```
GET    /campaigns/:id/analytics            Campaign performance metrics
GET    /campaigns/:id/conversions          All conversions for a campaign
GET    /campaigns/:id/timeline             Time-series data (daily/hourly)
GET    /campaigns/:id/products             Top products from this campaign
GET    /campaigns/leaderboard              Top performing campaigns
GET    /campaigns/analytics/overview       All campaigns overview
GET    /campaigns/analytics/platform       Breakdown by platform
```

### Integration Endpoints

```
GET    /orders/:id/campaign-source         Check campaign attribution for order
GET    /customers/:id/acquisition          First campaign that acquired customer
GET    /customers/:id/campaign-history     All campaigns customer interacted with
```

---

## Module Structure

Following your existing architecture:

```
/src/modules/campaigns/
├── campaigns.types.ts              # Zod schemas & TypeScript types
├── campaigns.routes.ts             # API endpoint definitions
├── services/
│   ├── campaigns.service.ts        # Campaign CRUD logic
│   ├── tracking.service.ts         # Visit tracking & attribution
│   └── analytics.service.ts        # Analytics calculations & aggregations
└── repo/
    ├── campaigns.repo.ts           # Campaign database queries
    ├── visits.repo.ts              # Visit tracking queries
    └── conversions.repo.ts         # Conversion tracking queries
```

---

## Implementation Steps

### Phase 1: Database Setup
1. Create migration file with all 4 new tables
2. Add `campaign_id` and `visit_id` to `orders` table
3. Add `acquisition_campaign_id` to `customers` table
4. Run migration

### Phase 2: Backend Module
1. Create `/src/modules/campaigns` directory structure
2. Define TypeScript types and Zod schemas
3. Implement repository layer (database queries)
4. Implement service layer (business logic)
5. Create API routes
6. Add routes to main app

### Phase 3: Order Integration
1. Modify `orders.service.ts` to accept `session_id`
2. Implement attribution logic in order creation
3. Handle conversion tracking
4. Update customer acquisition tracking

### Phase 4: Analytics Service
1. Implement real-time analytics calculations
2. Create daily snapshot aggregation job (cron)
3. Build analytics endpoints
4. Add leaderboard and comparison features

### Phase 5: Frontend Integration
1. Create campaign tracking utility
2. Add tracking script to app initialization
3. Modify order creation to include `session_id`
4. Build campaign management UI
5. Build analytics dashboard

### Phase 6: Testing & Optimization
1. Test full flow: link click → browse → purchase
2. Test multi-touch scenarios (multiple campaign clicks)
3. Test 30-day expiration logic
4. Optimize queries with proper indexes
5. Load testing for high-traffic campaigns

---

## Key Technical Decisions

### 1. Session Management
- **Session ID**: Generated client-side using `crypto.randomUUID()`
- **Storage**: localStorage (persists across browser sessions)
- **Expiration**: Server-side 30-day rolling window
- **Activity Tracking**: Update `last_activity_at` on each page view

### 2. Attribution Model
- **Last-Touch**: Credit goes to the most recent campaign within 30 days
- **Query**: `ORDER BY visited_at DESC LIMIT 1`
- **Fallback**: If no active visits, no attribution

### 3. Performance Optimization
- **Indexes**: On `tracking_code`, `session_id`, `campaign_id`, `expires_at`
- **Snapshots**: Daily/hourly pre-aggregated analytics
- **Caching**: Can add Redis for frequently accessed analytics

### 4. Data Retention
- **Visits**: Keep forever (or implement cleanup after 1 year)
- **Conversions**: Keep forever (financial records)
- **Snapshots**: Keep forever (historical data)

---

## Example Use Cases

### Use Case 1: Instagram Reel Campaign
1. Create parent campaign: "Summer 2024 Sale"
2. Create child campaign: "Beach Dress Reel #1" (cost: $200)
3. Get tracking URL: `yourstore.com?utm_campaign=INSTA_BEACH_DRESS_01`
4. Post reel on Instagram with link in bio
5. Monitor real-time: visitors, conversions, revenue
6. After 30 days: ROI = 1500% ($3000 revenue - $200 cost)

### Use Case 2: Multi-Platform Campaign
1. Create parent: "Black Friday 2024"
2. Create children:
   - "BF Instagram Reel" (cost: $500)
   - "BF TikTok Video" (cost: $300)
   - "BF Facebook Ad" (cost: $700)
3. Track each platform separately
4. Compare performance across platforms
5. Reallocate budget to best-performing platform

### Use Case 3: A/B Testing Content
1. Create parent: "Product Launch"
2. Create two children:
   - "Launch Video A - Emotional" (cost: $250)
   - "Launch Video B - Features" (cost: $250)
3. Post both, track separately
4. Compare conversion rates
5. Scale up the winner

---

## Terminology Clarification

| User's Term | Technical Term | Definition |
|-------------|---------------|------------|
| Conversations | Conversions | Visitors who made a purchase |
| Trackable Link | Campaign URL | URL with tracking parameter (utm_campaign) |
| Visitors | Visits | Unique session that clicked campaign link |
| ROI | Return on Investment | ((Revenue - Cost) / Cost) × 100 |

---

## Next Steps

1. **Review this plan** - Confirm it matches your vision
2. **Prioritize features** - Which phase to start with?
3. **Database migration** - Create and test schema
4. **Backend implementation** - Build core tracking logic
5. **Frontend integration** - Add tracking to your app
6. **Analytics UI** - Build dashboard for viewing results

---

## Questions?

This plan is ready for implementation. Let me know if you want to:
- Proceed with implementation
- Modify any part of the schema
- Add additional features
- Start with a specific phase

I'm ready to start coding when you are!
