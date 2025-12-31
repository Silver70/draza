# Campaign Tracking Seeder Guide

## Quick Start

```bash
# Make sure your backend server is running on http://localhost:3000
cd apps/backend

# Run the seeder
./seed-campaigns.sh
```

## What Gets Created

The seeder creates a realistic campaign structure with:

### 1. Parent Campaign
- **Summer 2024 Sale** - Multi-platform parent campaign
  - Budget: $5,000
  - Duration: June - August 2024

### 2. Child Campaigns (4 campaigns)

#### Instagram Campaigns
1. **Summer Dress Collection Reel**
   - Cost: $250 | Budget: $300
   - 50 simulated visits

2. **Beach Vibes Summer Post**
   - Cost: $150 | Budget: $200
   - 30 simulated visits

#### TikTok Campaign
3. **Summer Outfit Transition Video**
   - Cost: $400 | Budget: $500
   - 120 simulated visits

#### Facebook Campaign
4. **Facebook Summer Collection Ad**
   - Cost: $800 | Budget: $1,000
   - 80 simulated visits

### 3. Standalone Campaign
- **Black Friday Preview** (Instagram Story)
  - Cost: $100 | Budget: $150
  - 25 simulated visits

### Total
- **6 campaigns** created
- **305 visits** simulated
- **$1,700** total cost
- **$2,150** total budget

---

## Simulated Visit Data

Each visit includes realistic data:
- **Devices**: Mobile (iPhone), Desktop (Windows), Tablet (iPad)
- **Locations**: US (New York, Los Angeles), Canada (Toronto), UK (London)
- **Referrers**: Instagram, TikTok, Facebook
- **Landing Pages**: `/products`
- **30-day attribution window**

---

## Testing Conversions

To test the complete flow including conversions, you need to:

### 1. Get a Session ID from a Visit

```bash
# List visits for a campaign
CAMPAIGN_ID="your-campaign-id"
curl -X GET "http://localhost:3000/analytics/campaigns/$CAMPAIGN_ID/visits"

# Extract a session_id from the response
SESSION_ID="session-id-from-response"
```

### 2. Create Test Order Data

You'll need:
- A customer ID (from your customers table)
- Shipping address ID
- Billing address ID
- Product variant IDs
- Shipping method ID

### 3. Create Order with Attribution

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "your-customer-id",
    "sessionId": "session-id-from-visit",
    "items": [
      {
        "productVariantId": "your-variant-id",
        "quantity": 2
      }
    ],
    "shippingAddressId": "your-address-id",
    "billingAddressId": "your-address-id",
    "shippingMethodId": "your-shipping-method-id"
  }'
```

The order will automatically be attributed to the campaign!

---

## Viewing Analytics

### All Campaigns
```bash
curl -X GET http://localhost:3000/analytics/campaigns
```

### Parent Campaign with Children Aggregation
```bash
PARENT_ID="parent-campaign-id"
curl -X GET "http://localhost:3000/analytics/campaigns/$PARENT_ID/parent-analytics"
```

### Individual Campaign Analytics
```bash
CAMPAIGN_ID="campaign-id"
curl -X GET "http://localhost:3000/analytics/campaigns/$CAMPAIGN_ID/analytics?includeTimeline=true&includeDeviceBreakdown=true&includeGeographic=true"
```

### Campaign Leaderboard
```bash
# By ROI
curl -X GET "http://localhost:3000/analytics/campaigns/leaderboard?metric=roi&limit=5"

# By Revenue
curl -X GET "http://localhost:3000/analytics/campaigns/leaderboard?metric=revenue&limit=5"

# By Conversions
curl -X GET "http://localhost:3000/analytics/campaigns/leaderboard?metric=conversions&limit=5"

# By Visits
curl -X GET "http://localhost:3000/analytics/campaigns/leaderboard?metric=visits&limit=5"
```

### Campaigns Overview
```bash
curl -X GET http://localhost:3000/analytics/campaigns/overview
```

---

## What to Expect

### Without Conversions (Immediately After Seeding)
All campaigns will show:
- **Visits**: The simulated numbers (50, 30, 120, 80, 25)
- **Conversions**: 0
- **Revenue**: $0.00
- **ROI**: 0% (or negative because cost but no revenue)
- **Conversion Rate**: 0%

### After Creating Test Orders with Session IDs
Campaigns with orders will show:
- **Conversions**: Number of orders attributed
- **Revenue**: Total from attributed orders
- **ROI**: ((Revenue - Cost) / Cost) × 100
- **Conversion Rate**: (Conversions / Visits) × 100
- **Average Order Value**: Revenue / Conversions

---

## Example Analytics Response

```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "...",
      "name": "Summer Dress Collection Reel",
      "platform": "instagram",
      "cost": "250.00",
      "trackingCode": "INS_SUMMER_DRESS_COLLECTION_123456"
    },
    "metrics": {
      "totalVisits": 50,
      "uniqueVisitors": 50,
      "totalConversions": 5,
      "conversionRate": "10.00",
      "totalRevenue": "750.00",
      "averageOrderValue": "150.00",
      "roi": "200.00",
      "costPerVisit": "5.00",
      "costPerConversion": "50.00"
    },
    "deviceBreakdown": [
      { "deviceType": "mobile", "visits": 33, "conversions": 3 },
      { "deviceType": "desktop", "visits": 17, "conversions": 2 }
    ],
    "geographicBreakdown": [
      { "country": "US", "visits": 38, "conversions": 4, "revenue": "600.00" },
      { "country": "CA", "visits": 12, "conversions": 1, "revenue": "150.00" }
    ]
  }
}
```

---

## Cleanup

To remove all seeded campaigns:

```bash
# Get all campaigns
curl -X GET http://localhost:3000/analytics/campaigns | jq '.data[].id' | while read id; do
  # Remove quotes
  id=$(echo $id | tr -d '"')
  # Delete campaign
  curl -X DELETE "http://localhost:3000/analytics/campaigns/$id"
done
```

Or truncate the tables directly in PostgreSQL:
```sql
TRUNCATE TABLE campaign_visits, campaign_conversions, campaign_analytics_snapshots, campaigns CASCADE;
```

---

## Troubleshooting

### Script Fails to Create Campaigns
- Ensure backend server is running on `http://localhost:3000`
- Check if database migrations were applied
- Verify no validation errors in the response

### No Tracking Codes Shown
- Check if the API response contains the campaign data
- Look for errors in the curl responses
- Verify the database has the campaigns table

### Visits Not Showing in Analytics
- Ensure session IDs are valid UUIDs
- Check if tracking codes match exactly
- Verify visits were created (check `campaign_visits` table)

### Orders Not Being Attributed
- Make sure you're passing the correct `sessionId` when creating orders
- Verify the session exists and hasn't expired (30-day window)
- Check that the order was created successfully

---

## Advanced: Custom Seeding

### Add More Visits to Existing Campaign

```bash
# Get tracking code from the seeder output
TRACKING_CODE="INS_SUMMER_DRESS_COLLECTION_123456"

# Generate a unique session ID
SESSION_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

# Track visit
curl -X POST http://localhost:3000/analytics/campaigns/track-visit \
  -H "Content-Type: application/json" \
  -d "{
    \"trackingCode\": \"$TRACKING_CODE\",
    \"sessionId\": \"$SESSION_ID\",
    \"landingPage\": \"/products/summer-dress\",
    \"userAgent\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)\",
    \"referrer\": \"https://instagram.com\",
    \"country\": \"US\",
    \"city\": \"Miami\"
  }"
```

### Create a New Campaign

```bash
curl -X POST http://localhost:3000/analytics/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Custom Campaign",
    "description": "Testing custom campaign",
    "platform": "instagram",
    "campaignType": "reel",
    "cost": 100,
    "budget": 150
  }'
```

---

## Next Steps

1. **Run the seeder**: `./seed-campaigns.sh`
2. **Explore the data**: Use the test commands provided
3. **Create test orders**: To see conversion tracking in action
4. **Build a dashboard**: Use the analytics endpoints to visualize data

Happy testing! 🎉
