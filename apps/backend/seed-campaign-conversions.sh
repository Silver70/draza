#!/bin/bash

# Campaign Conversions Seeding Script
# This creates orders with campaign session IDs to generate conversions
BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Seeding Campaign Conversions..."
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if server is running
echo -e "${BLUE}Checking if backend server is running...${NC}"
if ! curl -s -f $BASE_URL/analytics/campaigns > /dev/null 2>&1; then
  echo -e "${RED}✗ Backend server is not running at $BASE_URL${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Backend server is running${NC}"

# ====================
# 1. GET REQUIRED DATA
# ====================
echo -e "\n${BLUE}[1/4] Fetching required data...${NC}"

# Get customers
echo -e "  ${BLUE}Fetching customers...${NC}"
CUSTOMERS_RESPONSE=$(curl -s -X GET $BASE_URL/customers)
CUSTOMER_IDS=$(echo "$CUSTOMERS_RESPONSE" | grep -o '"id":"[^"]*"' | head -5 | cut -d'"' -f4)

if [ -z "$CUSTOMER_IDS" ]; then
  echo -e "  ${RED}✗ No customers found. Please create customers first.${NC}"
  echo -e "  ${YELLOW}Run: curl -X POST $BASE_URL/customers -H 'Content-Type: application/json' -d '{...}'${NC}"
  exit 1
fi

CUSTOMER_COUNT=$(echo "$CUSTOMER_IDS" | wc -l)
echo -e "  ${GREEN}✓ Found $CUSTOMER_COUNT customers${NC}"

# Get product variants
echo -e "  ${BLUE}Fetching product variants...${NC}"
PRODUCTS_RESPONSE=$(curl -s -X GET $BASE_URL/products/active)
PRODUCT_IDS=$(echo "$PRODUCTS_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PRODUCT_IDS" ]; then
  echo -e "  ${RED}✗ No products found. Please create products first.${NC}"
  exit 1
fi

# Fetch variants for each product
VARIANT_IDS=""
for PRODUCT_ID in $PRODUCT_IDS; do
  VARIANTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products/$PRODUCT_ID/variants")
  PRODUCT_VARIANT_IDS=$(echo "$VARIANTS_RESPONSE" | grep -o '"id":"[^"]*"' | grep -v "\"id\":\"$PRODUCT_ID\"" | cut -d'"' -f4)
  if [ -n "$PRODUCT_VARIANT_IDS" ]; then
    VARIANT_IDS="$VARIANT_IDS $PRODUCT_VARIANT_IDS"
  fi
done

# Trim leading/trailing whitespace and convert to array
VARIANT_IDS=$(echo "$VARIANT_IDS" | xargs)

if [ -z "$VARIANT_IDS" ]; then
  echo -e "  ${RED}✗ No product variants found. Please create product variants first.${NC}"
  exit 1
fi

VARIANT_COUNT=$(echo "$VARIANT_IDS" | wc -w)
echo -e "  ${GREEN}✓ Found $VARIANT_COUNT product variants${NC}"

# Get shipping methods
echo -e "  ${BLUE}Fetching shipping methods...${NC}"
SHIPPING_RESPONSE=$(curl -s -X GET $BASE_URL/orders/shipping-methods)
SHIPPING_METHOD_ID=$(echo "$SHIPPING_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SHIPPING_METHOD_ID" ]; then
  echo -e "  ${RED}✗ No shipping methods found.${NC}"
  exit 1
fi

echo -e "  ${GREEN}✓ Found shipping method${NC}"

# Get campaign visits
echo -e "  ${BLUE}Fetching campaign visits...${NC}"
CAMPAIGNS_RESPONSE=$(curl -s -X GET $BASE_URL/analytics/campaigns)
CAMPAIGN_IDS=$(echo "$CAMPAIGNS_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CAMPAIGN_IDS" ]; then
  echo -e "  ${RED}✗ No campaigns found. Please run seed-campaigns.sh first.${NC}"
  exit 1
fi

# Array to store campaign info
declare -A CAMPAIGN_SESSIONS
declare -A CAMPAIGN_NAMES

for CAMPAIGN_ID in $CAMPAIGN_IDS; do
  VISITS_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/campaigns/$CAMPAIGN_ID/visits")
  SESSION_IDS=$(echo "$VISITS_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

  if [ -n "$SESSION_IDS" ]; then
    CAMPAIGN_SESSIONS[$CAMPAIGN_ID]="$SESSION_IDS"
    CAMPAIGN_NAME=$(echo "$CAMPAIGNS_RESPONSE" | grep -B5 "\"id\":\"$CAMPAIGN_ID\"" | grep '"name"' | head -1 | cut -d'"' -f4)
    CAMPAIGN_NAMES[$CAMPAIGN_ID]="$CAMPAIGN_NAME"
  fi
done

echo -e "  ${GREEN}✓ Found ${#CAMPAIGN_SESSIONS[@]} campaigns with visits${NC}"

# ====================
# 2. GET/CREATE ADDRESSES
# ====================
echo -e "\n${BLUE}[2/4] Getting/creating customer addresses...${NC}"

# Associative arrays to store addresses for each customer
declare -A CUSTOMER_SHIPPING_ADDRESSES
declare -A CUSTOMER_BILLING_ADDRESSES

# Sample cities for variation
CITIES=("Malé" "New York" "London" "Dubai" "Singapore")
STATES=("Kaafu" "NY" "Greater London" "Dubai" "Central")
COUNTRIES=("Maldives" "USA" "UK" "UAE" "Singapore")
POSTAL_CODES=("20026" "10001" "SW1A 1AA" "00000" "018956")

CUSTOMER_INDEX=0
for CUSTOMER_ID in $CUSTOMER_IDS; do
  # Get customer's existing addresses
  ADDRESSES_RESPONSE=$(curl -s -X GET "$BASE_URL/customers/$CUSTOMER_ID/addresses")
  # Get the address ID from inside the "addresses" array
  # First grep gets the addresses array, second grep gets all IDs, we take the first one (which is the address ID, not customer ID)
  ADDRESS_ID=$(echo "$ADDRESSES_RESPONSE" | grep -o '"addresses":\[[^]]*\]' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$ADDRESS_ID" ]; then
    # Customer already has an address
    CUSTOMER_SHIPPING_ADDRESSES[$CUSTOMER_ID]=$ADDRESS_ID
    CUSTOMER_BILLING_ADDRESSES[$CUSTOMER_ID]=$ADDRESS_ID
  else
    # Create address for this customer
    CITY_INDEX=$((CUSTOMER_INDEX % 5))
    CITY="${CITIES[$CITY_INDEX]}"
    STATE="${STATES[$CITY_INDEX]}"
    COUNTRY="${COUNTRIES[$CITY_INDEX]}"
    POSTAL="${POSTAL_CODES[$CITY_INDEX]}"

    CREATE_ADDRESS_RESPONSE=$(curl -s -X POST "$BASE_URL/customers/$CUSTOMER_ID/addresses" \
      -H "Content-Type: application/json" \
      -d "{
        \"streetAddress\": \"123 Main Street\",
        \"apartment\": \"Apt $((CUSTOMER_INDEX + 1))\",
        \"city\": \"$CITY\",
        \"state\": \"$STATE\",
        \"postalCode\": \"$POSTAL\",
        \"country\": \"$COUNTRY\",
        \"isDefault\": true
      }")

    NEW_ADDRESS_ID=$(echo "$CREATE_ADDRESS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$NEW_ADDRESS_ID" ]; then
      CUSTOMER_SHIPPING_ADDRESSES[$CUSTOMER_ID]=$NEW_ADDRESS_ID
      CUSTOMER_BILLING_ADDRESSES[$CUSTOMER_ID]=$NEW_ADDRESS_ID
    else
      echo -e "  ${RED}✗ Failed to create address for customer $CUSTOMER_ID${NC}"
      continue
    fi
  fi

  CUSTOMER_INDEX=$((CUSTOMER_INDEX + 1))
done

echo -e "  ${GREEN}✓ Prepared addresses for ${#CUSTOMER_SHIPPING_ADDRESSES[@]} customers${NC}"

# ====================
# 3. CREATE ORDERS WITH CAMPAIGN ATTRIBUTION
# ====================
echo -e "\n${BLUE}[3/4] Creating orders with campaign attribution...${NC}"

TOTAL_ORDERS_CREATED=0
CONVERSIONS_PER_CAMPAIGN=0

# Convert campaign IDs and customer IDs to arrays
CAMPAIGN_IDS_ARRAY=($CAMPAIGN_IDS)
CUSTOMER_IDS_ARRAY=($CUSTOMER_IDS)
VARIANT_IDS_ARRAY=($VARIANT_IDS)

for CAMPAIGN_ID in "${CAMPAIGN_IDS_ARRAY[@]}"; do
  CAMPAIGN_NAME="${CAMPAIGN_NAMES[$CAMPAIGN_ID]}"
  SESSION_IDS="${CAMPAIGN_SESSIONS[$CAMPAIGN_ID]}"

  if [ -z "$SESSION_IDS" ]; then
    continue
  fi

  echo -e "\n  ${BLUE}Creating conversions for: $CAMPAIGN_NAME${NC}"

  # Convert sessions to array
  SESSION_IDS_ARRAY=($SESSION_IDS)

  # Create 3-8 orders per campaign (random)
  NUM_CONVERSIONS=$((RANDOM % 6 + 3))

  for i in $(seq 1 $NUM_CONVERSIONS); do
    # Get random session from this campaign
    SESSION_INDEX=$((RANDOM % ${#SESSION_IDS_ARRAY[@]}))
    SESSION_ID="${SESSION_IDS_ARRAY[$SESSION_INDEX]}"

    # Get random customer
    CUSTOMER_INDEX=$((RANDOM % ${#CUSTOMER_IDS_ARRAY[@]}))
    CUSTOMER_ID="${CUSTOMER_IDS_ARRAY[$CUSTOMER_INDEX]}"

    # Get customer's addresses
    SHIPPING_ADDRESS_ID="${CUSTOMER_SHIPPING_ADDRESSES[$CUSTOMER_ID]}"
    BILLING_ADDRESS_ID="${CUSTOMER_BILLING_ADDRESSES[$CUSTOMER_ID]}"

    # Skip if customer has no address
    if [ -z "$SHIPPING_ADDRESS_ID" ]; then
      echo -e "    ${YELLOW}⊘ Skipping - customer has no address${NC}"
      continue
    fi

    # Get random variant
    VARIANT_INDEX=$((RANDOM % ${#VARIANT_IDS_ARRAY[@]}))
    VARIANT_ID="${VARIANT_IDS_ARRAY[$VARIANT_INDEX]}"

    # Random quantity (1-3)
    QUANTITY=$((RANDOM % 3 + 1))

    # Debug: Show what we're sending (only in dev)
    if [ -n "$DEBUG" ]; then
      echo -e "    ${YELLOW}Debug: Customer=$CUSTOMER_ID, Address=$SHIPPING_ADDRESS_ID, Variant=$VARIANT_ID${NC}"
    fi

    # Create order
    ORDER_RESPONSE=$(curl -s -X POST $BASE_URL/orders \
      -H "Content-Type: application/json" \
      -d "{
        \"customerId\": \"$CUSTOMER_ID\",
        \"sessionId\": \"$SESSION_ID\",
        \"shippingAddressId\": \"$SHIPPING_ADDRESS_ID\",
        \"billingAddressId\": \"$BILLING_ADDRESS_ID\",
        \"items\": [
          {
            \"productVariantId\": \"$VARIANT_ID\",
            \"quantity\": $QUANTITY
          }
        ],
        \"shippingMethodId\": \"$SHIPPING_METHOD_ID\"
      }")

    if echo "$ORDER_RESPONSE" | grep -q "success.*true"; then
      ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | grep -o '"orderNumber":"[^"]*"' | cut -d'"' -f4)
      ORDER_TOTAL=$(echo "$ORDER_RESPONSE" | grep -o '"total":"[^"]*"' | head -1 | cut -d'"' -f4)
      echo -e "    ${GREEN}✓ Order $ORDER_NUMBER created (\$$ORDER_TOTAL)${NC}"
      TOTAL_ORDERS_CREATED=$((TOTAL_ORDERS_CREATED + 1))
    else
      ERROR=$(echo "$ORDER_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
      echo -e "    ${RED}✗ Failed: $ERROR${NC}"
    fi

    # Small delay to avoid overwhelming the server
    sleep 0.1
  done
done

echo -e "\n  ${GREEN}✓ Created $TOTAL_ORDERS_CREATED orders with campaign attribution${NC}"

# ====================
# 4. VERIFY CONVERSIONS
# ====================
echo -e "\n${BLUE}[4/4] Verifying conversions...${NC}"

OVERVIEW_RESPONSE=$(curl -s -X GET $BASE_URL/analytics/campaigns/overview)
TOTAL_CONVERSIONS=$(echo "$OVERVIEW_RESPONSE" | grep -o '"totalConversions":[0-9]*' | cut -d':' -f2)
TOTAL_REVENUE=$(echo "$OVERVIEW_RESPONSE" | grep -o '"totalRevenue":"[^"]*"' | cut -d'"' -f4)
CONVERSION_RATE=$(echo "$OVERVIEW_RESPONSE" | grep -o '"conversionRate":"[^"]*"' | cut -d'"' -f4)

echo -e "\n=========================================="
echo -e "${GREEN}Campaign Conversions Seeding Complete!${NC}"
echo -e "=========================================="

echo -e "\n${BLUE}Summary:${NC}"
echo -e "  Orders Created: ${GREEN}$TOTAL_ORDERS_CREATED${NC}"
echo -e "  Total Conversions: ${GREEN}$TOTAL_CONVERSIONS${NC}"
echo -e "  Total Revenue: ${GREEN}\$$TOTAL_REVENUE${NC}"
echo -e "  Conversion Rate: ${GREEN}$CONVERSION_RATE%${NC}"

echo -e "\n${BLUE}Campaign Performance:${NC}"

for CAMPAIGN_ID in "${CAMPAIGN_IDS_ARRAY[@]}"; do
  CAMPAIGN_NAME="${CAMPAIGN_NAMES[$CAMPAIGN_ID]}"

  ANALYTICS_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/campaigns/$CAMPAIGN_ID/analytics")

  VISITS=$(echo "$ANALYTICS_RESPONSE" | grep -o '"totalVisits":[0-9]*' | cut -d':' -f2)
  CONVERSIONS=$(echo "$ANALYTICS_RESPONSE" | grep -o '"totalConversions":[0-9]*' | cut -d':' -f2)
  REVENUE=$(echo "$ANALYTICS_RESPONSE" | grep -o '"totalRevenue":"[^"]*"' | cut -d'"' -f4)
  ROI=$(echo "$ANALYTICS_RESPONSE" | grep -o '"roi":"[^"]*"' | cut -d'"' -f4)

  if [ "$CONVERSIONS" != "0" ]; then
    echo -e "\n  ${GREEN}$CAMPAIGN_NAME${NC}"
    echo -e "    Visits: $VISITS | Conversions: ${GREEN}$CONVERSIONS${NC} | Revenue: ${GREEN}\$$REVENUE${NC} | ROI: ${GREEN}$ROI%${NC}"
  fi
done

echo -e "\n${BLUE}Test Commands:${NC}"
echo ""
echo "# View campaigns overview:"
echo "curl -X GET $BASE_URL/analytics/campaigns/overview"
echo ""
echo "# View campaign leaderboard:"
echo "curl -X GET '$BASE_URL/analytics/campaigns/leaderboard?metric=revenue&limit=10'"
echo ""
echo "# View specific campaign analytics:"
if [ ${#CAMPAIGN_IDS_ARRAY[@]} -gt 0 ]; then
  echo "curl -X GET '$BASE_URL/analytics/campaigns/${CAMPAIGN_IDS_ARRAY[0]}/analytics?includeTimeline=true&includeProducts=true'"
fi

echo -e "\n${YELLOW}Note:${NC} All conversions are now tracked with realistic order data!"
echo ""
