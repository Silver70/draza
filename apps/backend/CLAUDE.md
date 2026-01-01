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

### Project Structure

```
src/
├── index.ts              # App entry point, route registration, CORS config
├── modules/              # Feature modules (domain-driven)
│   ├── analytics/        # Campaign tracking and analytics
│   ├── customers/        # Customer and address management
│   ├── discounts/        # Discount codes and promotions
│   ├── orders/           # Order processing, tax, shipping
│   └── products/         # Products, variants, categories, collections
└── shared/
    └── db/               # Database configuration and schemas
        ├── index.ts      # Drizzle instance
        ├── schema.ts     # Re-exports all schemas
        └── *.ts          # Individual schema files
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
- `catalogue.ts` - Products, variants, categories, collections
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

**Products Module**: Product catalog with variant generation, attribute management, and inventory tracking. Includes category and collection organization.

**Discounts Module**: Flexible discount system supporting percentage/fixed discounts, minimum requirements, usage limits, and product-specific discounts.

### Campaign Attribution Flow

1. Visit tracked via `POST /analytics/campaigns/track-visit` with tracking code and session ID
2. Session ID stored in `campaign_visits` table (30-day attribution window)
3. Order creation accepts optional `sessionId` parameter
4. Order service automatically attributes order to campaign if session exists
5. Analytics queries aggregate visits and conversions for ROI metrics

### CORS Configuration

Frontend allowed origins:
- `http://localhost:3001`
- `http://localhost:5173`

Configured in `src/index.ts` with credentials enabled.

## Database Connection

Uses Neon serverless PostgreSQL with connection pooling. Connection string in `.env` as `DATABASE_URL`.

## Important Notes

- Always run `db:generate` after schema changes before pushing or migrating
- Use `db:push` for development, `db:migrate` for production
- Session IDs must be valid UUIDs for campaign tracking
- Orders are automatically attributed to campaigns if a valid session ID is provided
- The seeding scripts expect the server to be running on `http://localhost:3000`
