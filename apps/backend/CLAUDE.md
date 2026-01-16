# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
bun run dev                # Start dev server with hot reload on http://localhost:3000
```

### Database Management
```bash
bun run db:generate        # Generate migrations from schema changes
bun run db:migrate         # Apply pending migrations
bun run db:push            # Push schema changes directly to database (bypasses migrations)
```

### Seeding Data
```bash
./seed-campaigns.sh        # Seed campaign tracking data with realistic examples
./seed-discounts.sh        # Seed discount codes
./seed-campaign-conversions.sh  # Seed campaign conversion data
```

## Architecture Overview

### Tech Stack
- **Runtime**: Bun
- **Framework**: Hono (lightweight web framework)
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **File Storage**: AWS S3 (for product images)

### Project Structure

```
src/
├── index.ts              # App entry point, route registration, CORS config
├── modules/              # Feature modules (domain-driven)
│   ├── analytics/        # Campaign tracking and analytics
│   ├── customers/        # Customer and address management
│   ├── discounts/        # Discount codes and promotions
│   ├── orders/           # Order processing, tax, shipping
│   └── products/         # Products, variants, categories, collections, images
└── shared/
    ├── db/               # Database configuration and schemas
    │   ├── index.ts      # Drizzle instance
    │   ├── schema.ts     # Re-exports all schemas
    │   └── *.ts          # Individual schema files
    └── storage/          # AWS S3 storage service
        ├── s3-client.ts  # S3 client instance
        ├── storage.service.ts  # Image upload/delete operations
        └── index.ts      # Re-exports
```

### Module Organization Pattern

Each module follows a consistent structure:

```
module/
├── *.routes.ts           # Hono route definitions
├── *.types.ts            # TypeScript types and Zod schemas
├── services/             # Business logic layer
│   └── *.service.ts      # Service functions
├── repo/                 # Data access layer
│   └── *.repo.ts         # Database queries using Drizzle
└── utils/                # Module-specific utilities
```

**Layered Architecture**:
- **Routes** → handle HTTP requests/responses, validation
- **Services** → orchestrate business logic, call multiple repos
- **Repos** → direct database access using Drizzle ORM

### Database Schema Organization

Database schemas are split by domain in `src/shared/db/`:
- `catalogue.ts` - Products, variants, categories, collections, images
- `customer.ts` - Customer records
- `address.ts` - Shipping/billing addresses
- `order.ts` - Orders and line items
- `discount.ts` - Discount codes and order discounts
- `campaign.ts` - Campaign tracking (visits, conversions, analytics)
- `tax.ts` - Tax zones and rates
- `shipping.ts` - Shipping methods and zones

All schemas are re-exported through `schema.ts` for use with Drizzle.

### Key Modules

**Analytics Module**: Campaign tracking system with visit attribution, conversion tracking, and ROI analytics. Supports parent/child campaign relationships.

**Orders Module**: Handles order creation with automatic tax calculation, shipping options, discount application, and campaign attribution via session IDs.

**Products Module**: Product catalog with variant generation, attribute management, and inventory tracking. Includes category and collection organization. Integrated image management with AWS S3 for product and variant images.

**Discounts Module**: Flexible discount system supporting percentage/fixed discounts, minimum requirements, usage limits, and product-specific discounts.

### Image Management System

Product images are stored using AWS S3 with metadata in PostgreSQL:

**Schema**:
- `product_images` - Product-level images (general/marketing photos)
- `product_variant_images` - Variant-specific images (e.g., different colors)
- Both tables include: `url`, `altText`, `type` (thumbnail/gallery/hero/zoom), `position`

**Storage Structure**:
```
S3 Bucket: draza-product-images
├── products/{productId}/
│   └── {filename}-{timestamp}-{random}.jpg
└── variants/{variantId}/
    └── {filename}-{timestamp}-{random}.jpg
```

**Image Service** (`images.service.ts`):
- `uploadProductImage()` - Upload to S3 + save URL to DB
- `deleteProductImage()` - Delete from DB + remove from S3
- `reorderProductImages()` - Update display order
- Automatic cascade deletion when product/variant is deleted

### Campaign Attribution Flow

1. Visit tracked via `POST /analytics/campaigns/track-visit` with tracking code and session ID
2. Session ID stored in `campaign_visits` table (30-day attribution window)
3. Order creation accepts optional `sessionId` parameter
4. Order service automatically attributes order to campaign if session exists
5. Analytics queries aggregate visits and conversions for ROI metrics

### CORS Configuration

Frontend allowed origins:
- `http://localhost:3001` (old frontend)
- `http://localhost:3002` (current frontend)
- `http://localhost:5173` (vite dev server)

Configured in `src/index.ts` with credentials enabled.

## Environment Variables

Required environment variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://...  # Neon serverless PostgreSQL connection string

# AWS S3 Storage (for product images)
AWS_REGION=us-east-1
AWS_S3_BUCKET=draza-product-images
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Setting up AWS S3 Storage**:
1. Create an S3 bucket in AWS Console
2. Configure bucket for public read access (or use signed URLs)
3. Create IAM user with S3 permissions
4. Add credentials to `.env`

## Important Notes

- Always run `db:generate` after schema changes before pushing or migrating
- Use `db:push` for development, `db:migrate` for production
- Session IDs must be valid UUIDs for campaign tracking
- Orders are automatically attributed to campaigns if a valid session ID is provided
- The seeding scripts expect the server to be running on `http://localhost:3000`
