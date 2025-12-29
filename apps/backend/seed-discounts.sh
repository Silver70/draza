#!/bin/bash

# Discount Test Data Seeding Script
BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Starting Discount Data Seeding..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ====================
# 1. STORE-WIDE DISCOUNT
# ====================
echo -e "\n${BLUE}[1/7] Creating Store-Wide 15% Off Discount...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/discounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Store-Wide 15% Off",
    "description": "Site-wide discount for all products",
    "discountType": "percentage",
    "value": 15,
    "scope": "store_wide",
    "isActive": true,
    "priority": 10,
    "startsAt": "2025-01-01T00:00:00Z",
    "endsAt": "2025-12-31T23:59:59Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ Store-wide discount created${NC}"
else
  echo -e "${RED}✗ Failed to create store-wide discount${NC}"
  echo "$RESPONSE"
fi

# ====================
# 2. CODE-BASED 10% DISCOUNT
# ====================
echo -e "\n${BLUE}[2/7] Creating Welcome 10% Off Code-Based Discount...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/discounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Discount",
    "description": "10% off for new customers",
    "discountType": "percentage",
    "value": 10,
    "scope": "code",
    "isActive": true,
    "priority": 50,
    "startsAt": "2025-01-01T00:00:00Z",
    "endsAt": "2025-12-31T23:59:59Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  DISCOUNT_10_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✓ Welcome discount created (ID: $DISCOUNT_10_ID)${NC}"

  # Create code WELCOME10
  echo -e "  ${BLUE}Creating code: WELCOME10${NC}"
  CODE_RESPONSE=$(curl -s -X POST $BASE_URL/discounts/$DISCOUNT_10_ID/codes \
    -H "Content-Type: application/json" \
    -d '{
      "code": "WELCOME10",
      "usageLimit": 100,
      "minimumOrderValue": 50,
      "isActive": true
    }')

  if echo "$CODE_RESPONSE" | grep -q "success"; then
    echo -e "  ${GREEN}✓ Code WELCOME10 created (Min order: \$50, Limit: 100 uses)${NC}"
  else
    echo -e "  ${RED}✗ Failed to create WELCOME10${NC}"
  fi

  # Create code SAVE10
  echo -e "  ${BLUE}Creating code: SAVE10${NC}"
  CODE_RESPONSE=$(curl -s -X POST $BASE_URL/discounts/$DISCOUNT_10_ID/codes \
    -H "Content-Type: application/json" \
    -d '{
      "code": "SAVE10",
      "usageLimit": 50,
      "minimumOrderValue": 30,
      "isActive": true
    }')

  if echo "$CODE_RESPONSE" | grep -q "success"; then
    echo -e "  ${GREEN}✓ Code SAVE10 created (Min order: \$30, Limit: 50 uses)${NC}"
  else
    echo -e "  ${RED}✗ Failed to create SAVE10${NC}"
  fi
else
  echo -e "${RED}✗ Failed to create welcome discount${NC}"
  echo "$RESPONSE"
fi

# ====================
# 3. $20 FIXED DISCOUNT
# ====================
echo -e "\n${BLUE}[3/7] Creating \$20 Fixed Amount Discount...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/discounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Holiday Special",
    "description": "$20 off your order",
    "discountType": "fixed_amount",
    "value": 20,
    "scope": "code",
    "isActive": true,
    "priority": 60,
    "startsAt": "2025-01-01T00:00:00Z",
    "endsAt": "2025-12-31T23:59:59Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  DISCOUNT_20_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✓ Holiday discount created (ID: $DISCOUNT_20_ID)${NC}"

  # Create code HOLIDAY20
  echo -e "  ${BLUE}Creating code: HOLIDAY20${NC}"
  CODE_RESPONSE=$(curl -s -X POST $BASE_URL/discounts/$DISCOUNT_20_ID/codes \
    -H "Content-Type: application/json" \
    -d '{
      "code": "HOLIDAY20",
      "usageLimit": 200,
      "minimumOrderValue": 100,
      "isActive": true
    }')

  if echo "$CODE_RESPONSE" | grep -q "success"; then
    echo -e "  ${GREEN}✓ Code HOLIDAY20 created (Min order: \$100, Limit: 200 uses)${NC}"
  else
    echo -e "  ${RED}✗ Failed to create HOLIDAY20${NC}"
  fi
else
  echo -e "${RED}✗ Failed to create holiday discount${NC}"
  echo "$RESPONSE"
fi

# ====================
# 4. 5% EARLY BIRD CODE
# ====================
echo -e "\n${BLUE}[4/7] Creating 5% Early Bird Discount...${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/discounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Early Bird Special",
    "description": "5% off with early bird code",
    "discountType": "percentage",
    "value": 5,
    "scope": "code",
    "isActive": true,
    "priority": 40,
    "startsAt": "2025-01-01T00:00:00Z",
    "endsAt": "2025-12-31T23:59:59Z"
  }')

if echo "$RESPONSE" | grep -q "success"; then
  DISCOUNT_5_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo -e "${GREEN}✓ Early bird discount created (ID: $DISCOUNT_5_ID)${NC}"

  # Create code EARLYBIRD
  echo -e "  ${BLUE}Creating code: EARLYBIRD${NC}"
  CODE_RESPONSE=$(curl -s -X POST $BASE_URL/discounts/$DISCOUNT_5_ID/codes \
    -H "Content-Type: application/json" \
    -d '{
      "code": "EARLYBIRD",
      "usageLimit": null,
      "minimumOrderValue": null,
      "isActive": true
    }')

  if echo "$CODE_RESPONSE" | grep -q "success"; then
    echo -e "  ${GREEN}✓ Code EARLYBIRD created (No restrictions)${NC}"
  else
    echo -e "  ${RED}✗ Failed to create EARLYBIRD${NC}"
  fi
else
  echo -e "${RED}✗ Failed to create early bird discount${NC}"
  echo "$RESPONSE"
fi

# ====================
# 5. GET PRODUCTS FOR PRODUCT-SPECIFIC DISCOUNT
# ====================
echo -e "\n${BLUE}[5/7] Fetching products for product-specific discount...${NC}"
PRODUCTS_RESPONSE=$(curl -s -X GET $BASE_URL/products/active)

if echo "$PRODUCTS_RESPONSE" | grep -q "success"; then
  # Extract first two product IDs
  PRODUCT_IDS=$(echo "$PRODUCTS_RESPONSE" | grep -o '"id":"[^"]*"' | head -2 | cut -d'"' -f4 | tr '\n' ',' | sed 's/,$//')

  if [ -n "$PRODUCT_IDS" ]; then
    echo -e "${GREEN}✓ Found products${NC}"

    # Create product-specific discount
    echo -e "  ${BLUE}Creating 25% Product-Specific Discount...${NC}"
    RESPONSE=$(curl -s -X POST $BASE_URL/discounts \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Featured Product Sale",
        "description": "25% off selected products",
        "discountType": "percentage",
        "value": 25,
        "scope": "product",
        "isActive": true,
        "priority": 100,
        "startsAt": "2025-01-01T00:00:00Z",
        "endsAt": "2025-12-31T23:59:59Z"
      }')

    if echo "$RESPONSE" | grep -q "success"; then
      PRODUCT_DISCOUNT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
      echo -e "  ${GREEN}✓ Product discount created (ID: $PRODUCT_DISCOUNT_ID)${NC}"

      # Add products to discount
      IFS=',' read -ra PRODUCT_ARRAY <<< "$PRODUCT_IDS"
      PRODUCT_JSON="[\"${PRODUCT_ARRAY[0]}\""
      if [ ${#PRODUCT_ARRAY[@]} -gt 1 ]; then
        PRODUCT_JSON+=",\"${PRODUCT_ARRAY[1]}\""
      fi
      PRODUCT_JSON+="]"

      PRODUCT_RESPONSE=$(curl -s -X POST $BASE_URL/discounts/$PRODUCT_DISCOUNT_ID/products \
        -H "Content-Type: application/json" \
        -d "{\"productIds\": $PRODUCT_JSON}")

      if echo "$PRODUCT_RESPONSE" | grep -q "success"; then
        echo -e "  ${GREEN}✓ Products added to discount${NC}"
      else
        echo -e "  ${RED}✗ Failed to add products${NC}"
      fi
    else
      echo -e "  ${RED}✗ Failed to create product discount${NC}"
    fi
  else
    echo -e "${RED}✗ No products found. Skipping product-specific discount.${NC}"
  fi
else
  echo -e "${RED}✗ Failed to fetch products${NC}"
fi

# ====================
# 6. GET COLLECTIONS FOR COLLECTION-SPECIFIC DISCOUNT
# ====================
echo -e "\n${BLUE}[6/7] Fetching collections for collection-specific discount...${NC}"
COLLECTIONS_RESPONSE=$(curl -s -X GET $BASE_URL/products/collections)

if echo "$COLLECTIONS_RESPONSE" | grep -q "success"; then
  # Extract first collection ID
  COLLECTION_ID=$(echo "$COLLECTIONS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$COLLECTION_ID" ]; then
    echo -e "${GREEN}✓ Found collection${NC}"

    # Create collection-specific discount
    echo -e "  ${BLUE}Creating 20% Collection Discount...${NC}"
    RESPONSE=$(curl -s -X POST $BASE_URL/discounts \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Collection Clearance",
        "description": "20% off entire collection",
        "discountType": "percentage",
        "value": 20,
        "scope": "collection",
        "isActive": true,
        "priority": 75,
        "startsAt": "2025-01-01T00:00:00Z",
        "endsAt": "2025-12-31T23:59:59Z"
      }')

    if echo "$RESPONSE" | grep -q "success"; then
      COLLECTION_DISCOUNT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
      echo -e "  ${GREEN}✓ Collection discount created (ID: $COLLECTION_DISCOUNT_ID)${NC}"

      # Add collection to discount
      COLLECTION_RESPONSE=$(curl -s -X POST $BASE_URL/discounts/$COLLECTION_DISCOUNT_ID/collections \
        -H "Content-Type: application/json" \
        -d "{\"collectionIds\": [\"$COLLECTION_ID\"]}")

      if echo "$COLLECTION_RESPONSE" | grep -q "success"; then
        echo -e "  ${GREEN}✓ Collection added to discount${NC}"
      else
        echo -e "  ${RED}✗ Failed to add collection${NC}"
      fi
    else
      echo -e "  ${RED}✗ Failed to create collection discount${NC}"
    fi
  else
    echo -e "${RED}✗ No collections found. Skipping collection-specific discount.${NC}"
  fi
else
  echo -e "${RED}✗ Failed to fetch collections${NC}"
fi

# ====================
# 7. SUMMARY
# ====================
echo -e "\n${BLUE}[7/7] Fetching all discounts...${NC}"
ALL_DISCOUNTS=$(curl -s -X GET $BASE_URL/discounts)

echo -e "\n=========================================="
echo -e "${GREEN}Discount Seeding Complete!${NC}"
echo -e "==========================================\n"

echo -e "${BLUE}Available Discount Codes:${NC}"
echo -e "  • ${GREEN}WELCOME10${NC}  - 10% off (min order: \$50)"
echo -e "  • ${GREEN}SAVE10${NC}     - 10% off (min order: \$30)"
echo -e "  • ${GREEN}HOLIDAY20${NC}  - \$20 off (min order: \$100)"
echo -e "  • ${GREEN}EARLYBIRD${NC}  - 5% off (no minimum)"

echo -e "\n${BLUE}Test Commands:${NC}"
echo "# Validate a discount code:"
echo "curl -X POST $BASE_URL/discounts/validate-code \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"code\": \"WELCOME10\", \"orderTotal\": 100}'"

echo -e "\n# Get all active discounts:"
echo "curl -X GET $BASE_URL/discounts/active"

echo -e "\n# View all discount codes:"
echo "curl -X GET $BASE_URL/discounts | jq '.'"

echo ""
