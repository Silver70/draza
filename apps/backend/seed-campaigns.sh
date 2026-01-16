#!/bin/bash

# Campaign Tracking Test Data Seeding Script
BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Starting Campaign Data Seeding..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo -e "${BLUE}Checking if backend server is running...${NC}"
if ! curl -s -f $BASE_URL/analytics/campaigns > /dev/null 2>&1; then
  echo -e "${RED}✗ Backend server is not running at $BASE_URL${NC}"
  echo -e "${YELLOW}Please start the backend server first:${NC}"
  echo -e "  cd apps/backend"
  echo -e "  bun run dev"
  exit 1
fi
echo -e "${GREEN}✓ Backend server is running${NC}"

# Helper function to generate UUID
generate_uuid() {
  if command -v uuidgen &> /dev/null; then
    uuidgen | tr '[:upper:]' '[:lower:]'
  else
    cat /proc/sys/kernel/random/uuid
  fi
}

# ====================
# 1. CREATE PARENT CAMPAIGN
# ====================
echo -e "\n${BLUE}[1/6] Creating Parent Campaign: Summer 2024 Sale...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/analytics/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer 2024 Sale",
    "description": "Main summer campaign across all social media platforms",
    "platform": "multi",
    "campaignType": "campaign",
    "budget": 5000,
    "cost": 0,
    "startsAt": "2024-06-01T00:00:00Z",
    "endsAt": "2024-08-31T23:59:59Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  PARENT_CAMPAIGN_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✓ Parent campaign created (ID: $PARENT_CAMPAIGN_ID)${NC}"
else
  echo -e "${RED}✗ Failed to create parent campaign${NC}"
  echo "$RESPONSE"
  exit 1
fi

# ====================
# 2. CREATE INSTAGRAM REEL CAMPAIGNS
# ====================
echo -e "\n${BLUE}[2/6] Creating Instagram Campaigns...${NC}"

# Instagram Reel 1
echo -e "  ${BLUE}Creating: Summer Dress Collection Reel${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/analytics/campaigns \
  -H "Content-Type: application/json" \
  -d "{
    \"parentCampaignId\": \"$PARENT_CAMPAIGN_ID\",
    \"name\": \"Summer Dress Collection Reel\",
    \"description\": \"Showcasing our new summer dress line\",
    \"platform\": \"instagram\",
    \"campaignType\": \"reel\",
    \"postUrl\": \"https://instagram.com/p/summer-dress-001\",
    \"cost\": 250,
    \"budget\": 300
  }")

if echo "$RESPONSE" | grep -q "success"; then
  INSTA_REEL_1_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  INSTA_REEL_1_CODE=$(echo "$RESPONSE" | grep -o '"trackingCode":"[^"]*"' | head -1 | cut -d'"' -f4)
  INSTA_REEL_1_URL=$(echo "$RESPONSE" | grep -o '"trackingUrl":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "  ${GREEN}✓ Instagram Reel 1 created${NC}"
  echo -e "    Code: ${YELLOW}$INSTA_REEL_1_CODE${NC}"
else
  echo -e "  ${RED}✗ Failed to create Instagram Reel 1${NC}"
fi

# Instagram Post
echo -e "  ${BLUE}Creating: Beach Vibes Post${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/analytics/campaigns \
  -H "Content-Type: application/json" \
  -d "{
    \"parentCampaignId\": \"$PARENT_CAMPAIGN_ID\",
    \"name\": \"Beach Vibes Summer Post\",
    \"description\": \"Static post featuring beach collection\",
    \"platform\": \"instagram\",
    \"campaignType\": \"post\",
    \"postUrl\": \"https://instagram.com/p/beach-vibes-001\",
    \"cost\": 150,
    \"budget\": 200
  }")

if echo "$RESPONSE" | grep -q "success"; then
  INSTA_POST_1_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  INSTA_POST_1_CODE=$(echo "$RESPONSE" | grep -o '"trackingCode":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "  ${GREEN}✓ Instagram Post created${NC}"
  echo -e "    Code: ${YELLOW}$INSTA_POST_1_CODE${NC}"
else
  echo -e "  ${RED}✗ Failed to create Instagram Post${NC}"
fi

# ====================
# 3. CREATE TIKTOK CAMPAIGNS
# ====================
echo -e "\n${BLUE}[3/6] Creating TikTok Campaigns...${NC}"

# TikTok Video 1
echo -e "  ${BLUE}Creating: TikTok Outfit Transition${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/analytics/campaigns \
  -H "Content-Type: application/json" \
  -d "{
    \"parentCampaignId\": \"$PARENT_CAMPAIGN_ID\",
    \"name\": \"Summer Outfit Transition\",
    \"description\": \"Viral outfit transition video\",
    \"platform\": \"tiktok\",
    \"campaignType\": \"video\",
    \"postUrl\": \"https://tiktok.com/@brand/video/123\",
    \"cost\": 400,
    \"budget\": 500
  }")

if echo "$RESPONSE" | grep -q "success"; then
  TIKTOK_1_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  TIKTOK_1_CODE=$(echo "$RESPONSE" | grep -o '"trackingCode":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "  ${GREEN}✓ TikTok Video created${NC}"
  echo -e "    Code: ${YELLOW}$TIKTOK_1_CODE${NC}"
else
  echo -e "  ${RED}✗ Failed to create TikTok Video${NC}"
fi

# ====================
# 4. CREATE FACEBOOK CAMPAIGNS
# ====================
echo -e "\n${BLUE}[4/6] Creating Facebook Campaign...${NC}"

echo -e "  ${BLUE}Creating: Facebook Ad Campaign${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/analytics/campaigns \
  -H "Content-Type: application/json" \
  -d "{
    \"parentCampaignId\": \"$PARENT_CAMPAIGN_ID\",
    \"name\": \"Facebook Summer Collection Ad\",
    \"description\": \"Paid ad targeting 25-45 age group\",
    \"platform\": \"facebook\",
    \"campaignType\": \"ad\",
    \"postUrl\": \"https://facebook.com/ads/summer-001\",
    \"cost\": 800,
    \"budget\": 1000
  }")

if echo "$RESPONSE" | grep -q "success"; then
  FB_AD_1_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  FB_AD_1_CODE=$(echo "$RESPONSE" | grep -o '"trackingCode":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "  ${GREEN}✓ Facebook Ad created${NC}"
  echo -e "    Code: ${YELLOW}$FB_AD_1_CODE${NC}"
else
  echo -e "  ${RED}✗ Failed to create Facebook Ad${NC}"
fi

# ====================
# 5. SIMULATE CAMPAIGN VISITS
# ====================
echo -e "\n${BLUE}[5/6] Simulating Campaign Visits...${NC}"

# Function to simulate visits
simulate_visits() {
  local campaign_code=$1
  local num_visits=$2
  local campaign_name=$3

  echo -e "  ${BLUE}Simulating $num_visits visits for: $campaign_name${NC}"

  for i in $(seq 1 $num_visits); do
    SESSION_ID=$(generate_uuid)

    # Simulate different devices
    if [ $((i % 3)) -eq 0 ]; then
      USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    elif [ $((i % 3)) -eq 1 ]; then
      USER_AGENT="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
    else
      USER_AGENT="Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)"
    fi

    # Simulate different countries
    if [ $((i % 4)) -eq 0 ]; then
      COUNTRY="US"
      CITY="New York"
    elif [ $((i % 4)) -eq 1 ]; then
      COUNTRY="CA"
      CITY="Toronto"
    elif [ $((i % 4)) -eq 2 ]; then
      COUNTRY="GB"
      CITY="London"
    else
      COUNTRY="US"
      CITY="Los Angeles"
    fi

    curl -s -X POST $BASE_URL/analytics/campaigns/track-visit \
      -H "Content-Type: application/json" \
      -d "{
        \"trackingCode\": \"$campaign_code\",
        \"sessionId\": \"$SESSION_ID\",
        \"landingPage\": \"/products\",
        \"userAgent\": \"$USER_AGENT\",
        \"referrer\": \"https://instagram.com\",
        \"country\": \"$COUNTRY\",
        \"city\": \"$CITY\"
      }" > /dev/null
  done

  echo -e "  ${GREEN}✓ Created $num_visits visits${NC}"
}

# Simulate visits for each campaign
if [ -n "$INSTA_REEL_1_CODE" ]; then
  simulate_visits "$INSTA_REEL_1_CODE" 50 "Instagram Reel 1"
fi

if [ -n "$INSTA_POST_1_CODE" ]; then
  simulate_visits "$INSTA_POST_1_CODE" 30 "Instagram Post"
fi

if [ -n "$TIKTOK_1_CODE" ]; then
  simulate_visits "$TIKTOK_1_CODE" 120 "TikTok Video"
fi

if [ -n "$FB_AD_1_CODE" ]; then
  simulate_visits "$FB_AD_1_CODE" 80 "Facebook Ad"
fi

# ====================
# 6. CREATE STANDALONE CAMPAIGN (NO PARENT)
# ====================
echo -e "\n${BLUE}[6/6] Creating Standalone Campaign...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/analytics/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Black Friday Preview",
    "description": "Early access to Black Friday deals",
    "platform": "instagram",
    "campaignType": "story",
    "cost": 100,
    "budget": 150,
    "startsAt": "2024-11-15T00:00:00Z",
    "endsAt": "2024-11-30T23:59:59Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  STANDALONE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  STANDALONE_CODE=$(echo "$RESPONSE" | grep -o '"trackingCode":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✓ Standalone campaign created${NC}"
  echo -e "  Code: ${YELLOW}$STANDALONE_CODE${NC}"

  # Add some visits
  simulate_visits "$STANDALONE_CODE" 25 "Black Friday Preview"
else
  echo -e "${RED}✗ Failed to create standalone campaign${NC}"
fi

# ====================
# SUMMARY
# ====================
echo -e "\n${BLUE}Fetching campaign overview...${NC}"
OVERVIEW=$(curl -s -X GET $BASE_URL/analytics/campaigns/overview)

echo -e "\n=========================================="
echo -e "${GREEN}Campaign Seeding Complete!${NC}"
echo -e "==========================================\n"

echo -e "${BLUE}Created Campaigns:${NC}"
echo -e "  ${GREEN}Parent Campaign:${NC}"
echo -e "    • Summer 2024 Sale (ID: $PARENT_CAMPAIGN_ID)"
echo -e "\n  ${GREEN}Child Campaigns:${NC}"
if [ -n "$INSTA_REEL_1_CODE" ]; then
  echo -e "    • Instagram Reel: Summer Dress Collection"
  echo -e "      Code: ${YELLOW}$INSTA_REEL_1_CODE${NC} | Visits: 50"
fi
if [ -n "$INSTA_POST_1_CODE" ]; then
  echo -e "    • Instagram Post: Beach Vibes"
  echo -e "      Code: ${YELLOW}$INSTA_POST_1_CODE${NC} | Visits: 30"
fi
if [ -n "$TIKTOK_1_CODE" ]; then
  echo -e "    • TikTok Video: Outfit Transition"
  echo -e "      Code: ${YELLOW}$TIKTOK_1_CODE${NC} | Visits: 120"
fi
if [ -n "$FB_AD_1_CODE" ]; then
  echo -e "    • Facebook Ad: Summer Collection"
  echo -e "      Code: ${YELLOW}$FB_AD_1_CODE${NC} | Visits: 80"
fi

echo -e "\n  ${GREEN}Standalone Campaigns:${NC}"
if [ -n "$STANDALONE_CODE" ]; then
  echo -e "    • Black Friday Preview (Instagram Story)"
  echo -e "      Code: ${YELLOW}$STANDALONE_CODE${NC} | Visits: 25"
fi

echo -e "\n${YELLOW}Total Simulated Visits: 305${NC}"

echo -e "\n${BLUE}Test Commands:${NC}"
echo ""
echo "# View all campaigns:"
echo "curl -X GET $BASE_URL/analytics/campaigns"
echo ""
echo "# View parent campaign analytics:"
echo "curl -X GET $BASE_URL/analytics/campaigns/$PARENT_CAMPAIGN_ID/parent-analytics"
echo ""
echo "# View individual campaign analytics:"
if [ -n "$INSTA_REEL_1_ID" ]; then
  echo "curl -X GET '$BASE_URL/analytics/campaigns/$INSTA_REEL_1_ID/analytics?includeTimeline=true&includeDeviceBreakdown=true&includeGeographic=true'"
fi
echo ""
echo "# View campaign leaderboard by ROI:"
echo "curl -X GET '$BASE_URL/analytics/campaigns/leaderboard?metric=roi&limit=5'"
echo ""
echo "# View campaigns overview:"
echo "curl -X GET $BASE_URL/analytics/campaigns/overview"
echo ""
echo "# Track a new visit (use one of the tracking codes above):"
echo "SESSION_ID=\$(uuidgen | tr '[:upper:]' '[:lower:]')"
if [ -n "$INSTA_REEL_1_CODE" ]; then
  echo "curl -X POST $BASE_URL/analytics/campaigns/track-visit \\"
  echo "  -H 'Content-Type: application/json' \\"
  echo "  -d '{
    \"trackingCode\": \"$INSTA_REEL_1_CODE\",
    \"sessionId\": \"'\$SESSION_ID'\",
    \"landingPage\": \"/products/summer-dress\",
    \"userAgent\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)\",
    \"referrer\": \"https://instagram.com\",
    \"country\": \"US\",
    \"city\": \"New York\"
  }'"
fi

echo -e "\n${YELLOW}Note:${NC} To simulate conversions, create orders with the session IDs from the visits above."
echo -e "The orders will automatically be attributed to the campaigns!"

echo ""
