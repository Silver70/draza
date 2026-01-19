-- Truncate all tables in correct order to avoid foreign key violations
-- This will delete ALL data from the database

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables
TRUNCATE TABLE
  product_variant_images,
  product_images,
  product_variant_attributes,
  attribute_values,
  attributes,
  product_variants,
  collection_products,
  collections,
  discount_products,
  discount_collections,
  discount_variants,
  order_discounts,
  discount_codes,
  discounts,
  order_items,
  orders,
  addresses,
  customers_table,
  campaigns,
  campaign_visits,
  campaign_conversions,
  campaign_analytics_snapshots,
  cart_items,
  carts,
  shipping_rate_tiers,
  shipping_methods,
  product_tax_settings,
  tax_jurisdictions,
  products,
  categories
CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';
