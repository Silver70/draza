#!/bin/bash

# Shipping and Tax Jurisdictions Seeding Script
# Seeds data directly into the database

echo "=========================================="
echo "Starting Shipping & Tax Data Seeding..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Organization ID
ORG_ID="NmSyPuZ4BXhpj5jhTFha8Hsq9DxZFW8L"

# Get DATABASE_URL from .env file
if [ -f .env ]; then
  export $(cat .env | grep DATABASE_URL | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL not found in .env file${NC}"
  exit 1
fi

echo -e "${BLUE}Using organization ID: ${ORG_ID}${NC}\n"

# ====================
# 1. SEED SHIPPING METHODS
# ====================
echo -e "${BLUE}[1/2] Seeding Shipping Methods...${NC}\n"

# Standard Shipping - Flat Rate
echo -e "  ${BLUE}Creating Standard Shipping (Flat Rate)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO shipping_methods (organization_id, name, display_name, description, carrier, calculation_type, base_rate, estimated_days_min, estimated_days_max, is_active, display_order)
VALUES (
  '$ORG_ID',
  'standard_shipping',
  'Standard Shipping',
  'Delivery in 5-7 business days',
  'usps',
  'flat_rate',
  5.99,
  5,
  7,
  true,
  1
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ Standard Shipping created (\$5.99 flat rate, 5-7 days)${NC}"
else
  echo -e "  ${RED}✗ Failed to create Standard Shipping${NC}"
fi

# Express Shipping - Flat Rate
echo -e "  ${BLUE}Creating Express Shipping (Flat Rate)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO shipping_methods (organization_id, name, display_name, description, carrier, calculation_type, base_rate, estimated_days_min, estimated_days_max, is_active, display_order)
VALUES (
  '$ORG_ID',
  'express_shipping',
  'Express Shipping',
  'Delivery in 2-3 business days',
  'fedex',
  'flat_rate',
  14.99,
  2,
  3,
  true,
  2
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ Express Shipping created (\$14.99 flat rate, 2-3 days)${NC}"
else
  echo -e "  ${RED}✗ Failed to create Express Shipping${NC}"
fi

# Overnight Shipping - Flat Rate
echo -e "  ${BLUE}Creating Overnight Shipping (Flat Rate)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO shipping_methods (organization_id, name, display_name, description, carrier, calculation_type, base_rate, estimated_days_min, estimated_days_max, is_active, display_order)
VALUES (
  '$ORG_ID',
  'overnight_shipping',
  'Overnight Shipping',
  'Next business day delivery',
  'fedex',
  'flat_rate',
  24.99,
  1,
  1,
  true,
  3
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ Overnight Shipping created (\$24.99 flat rate, 1 day)${NC}"
else
  echo -e "  ${RED}✗ Failed to create Overnight Shipping${NC}"
fi

# Free Shipping - Free Threshold
echo -e "  ${BLUE}Creating Free Shipping (Free over \$100)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO shipping_methods (organization_id, name, display_name, description, carrier, calculation_type, base_rate, free_shipping_threshold, estimated_days_min, estimated_days_max, is_active, display_order)
VALUES (
  '$ORG_ID',
  'free_shipping',
  'Free Shipping',
  'Free shipping on orders over \$100, otherwise \$7.99',
  'usps',
  'free_threshold',
  7.99,
  100.00,
  5,
  7,
  true,
  0
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ Free Shipping created (Free over \$100, otherwise \$7.99)${NC}"
else
  echo -e "  ${RED}✗ Failed to create Free Shipping${NC}"
fi

# ====================
# 2. SEED TAX JURISDICTIONS
# ====================
echo -e "\n${BLUE}[2/2] Seeding Tax Jurisdictions...${NC}\n"

# California State Tax
echo -e "  ${BLUE}Creating California State Tax (7.25%)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO tax_jurisdictions (organization_id, name, type, country, state_code, rate, is_active, description)
VALUES (
  '$ORG_ID',
  'California',
  'state',
  'USA',
  'CA',
  0.0725,
  true,
  'California state sales tax'
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ California State Tax created (7.25%)${NC}"
else
  echo -e "  ${RED}✗ Failed to create California State Tax${NC}"
fi

# New York State Tax
echo -e "  ${BLUE}Creating New York State Tax (4%)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO tax_jurisdictions (organization_id, name, type, country, state_code, rate, is_active, description)
VALUES (
  '$ORG_ID',
  'New York',
  'state',
  'USA',
  'NY',
  0.04,
  true,
  'New York state sales tax'
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ New York State Tax created (4%)${NC}"
else
  echo -e "  ${RED}✗ Failed to create New York State Tax${NC}"
fi

# Texas State Tax
echo -e "  ${BLUE}Creating Texas State Tax (6.25%)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO tax_jurisdictions (organization_id, name, type, country, state_code, rate, is_active, description)
VALUES (
  '$ORG_ID',
  'Texas',
  'state',
  'USA',
  'TX',
  0.0625,
  true,
  'Texas state sales tax'
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ Texas State Tax created (6.25%)${NC}"
else
  echo -e "  ${RED}✗ Failed to create Texas State Tax${NC}"
fi

# Florida State Tax
echo -e "  ${BLUE}Creating Florida State Tax (6%)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO tax_jurisdictions (organization_id, name, type, country, state_code, rate, is_active, description)
VALUES (
  '$ORG_ID',
  'Florida',
  'state',
  'USA',
  'FL',
  0.06,
  true,
  'Florida state sales tax'
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ Florida State Tax created (6%)${NC}"
else
  echo -e "  ${RED}✗ Failed to create Florida State Tax${NC}"
fi

# Illinois State Tax
echo -e "  ${BLUE}Creating Illinois State Tax (6.25%)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO tax_jurisdictions (organization_id, name, type, country, state_code, rate, is_active, description)
VALUES (
  '$ORG_ID',
  'Illinois',
  'state',
  'USA',
  'IL',
  0.0625,
  true,
  'Illinois state sales tax'
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ Illinois State Tax created (6.25%)${NC}"
else
  echo -e "  ${RED}✗ Failed to create Illinois State Tax${NC}"
fi

# Los Angeles County Tax (additional)
echo -e "  ${BLUE}Creating Los Angeles County Tax (1%)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO tax_jurisdictions (organization_id, name, type, country, state_code, county_name, rate, is_active, description)
VALUES (
  '$ORG_ID',
  'Los Angeles County',
  'county',
  'USA',
  'CA',
  'Los Angeles',
  0.01,
  true,
  'Los Angeles County additional sales tax'
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ Los Angeles County Tax created (1%)${NC}"
else
  echo -e "  ${RED}✗ Failed to create Los Angeles County Tax${NC}"
fi

# New York City Tax (additional)
echo -e "  ${BLUE}Creating New York City Tax (4.5%)...${NC}"
psql "$DATABASE_URL" -c "
INSERT INTO tax_jurisdictions (organization_id, name, type, country, state_code, city_name, rate, is_active, description)
VALUES (
  '$ORG_ID',
  'New York City',
  'city',
  'USA',
  'NY',
  'New York',
  0.045,
  true,
  'New York City additional sales tax'
)
ON CONFLICT DO NOTHING;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo -e "  ${GREEN}✓ New York City Tax created (4.5%)${NC}"
else
  echo -e "  ${RED}✗ Failed to create New York City Tax${NC}"
fi

# ====================
# 3. SUMMARY
# ====================
echo -e "\n=========================================="
echo -e "${GREEN}Seeding Complete!${NC}"
echo -e "==========================================\n"

echo -e "${BLUE}Shipping Methods Created:${NC}"
echo -e "  • ${GREEN}Free Shipping${NC}        - Free over \$100, otherwise \$7.99 (5-7 days)"
echo -e "  • ${GREEN}Standard Shipping${NC}    - \$5.99 flat rate (5-7 days)"
echo -e "  • ${GREEN}Express Shipping${NC}     - \$14.99 flat rate (2-3 days)"
echo -e "  • ${GREEN}Overnight Shipping${NC}   - \$24.99 flat rate (1 day)"

echo -e "\n${BLUE}Tax Jurisdictions Created:${NC}"
echo -e "  • ${GREEN}California${NC}           - 7.25%"
echo -e "  • ${GREEN}New York${NC}             - 4%"
echo -e "  • ${GREEN}Texas${NC}                - 6.25%"
echo -e "  • ${GREEN}Florida${NC}              - 6%"
echo -e "  • ${GREEN}Illinois${NC}             - 6.25%"
echo -e "  • ${GREEN}Los Angeles County${NC}   - 1% (additional)"
echo -e "  • ${GREEN}New York City${NC}        - 4.5% (additional)"

echo -e "\n${BLUE}Verify Data:${NC}"
echo "psql \"\$DATABASE_URL\" -c \"SELECT name, display_name, base_rate, carrier FROM shipping_methods WHERE organization_id = '$ORG_ID';\""
echo "psql \"\$DATABASE_URL\" -c \"SELECT name, type, state_code, rate FROM tax_jurisdictions WHERE organization_id = '$ORG_ID';\""

echo ""
