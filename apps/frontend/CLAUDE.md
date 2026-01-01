# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
pnpm dev           # Start dev server on http://localhost:3000
pnpm build         # Build for production (runs vite build + TypeScript check)
pnpm preview       # Preview production build
```

### Environment Variables
```bash
VITE_API_URL       # Backend API URL (default: http://localhost:3000)
```

## Tech Stack

- **Framework**: TanStack Start (React-based meta-framework with SSR)
- **Router**: TanStack Router (file-based routing with type-safe navigation)
- **Data Fetching**: TanStack Query (server state management)
- **HTTP Client**: Redaxios (lightweight Axios alternative)
- **Forms**: TanStack Form with Zod validation
- **UI Components**: Radix UI primitives + shadcn/ui components
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Dev Server**: Vite

## Architecture Overview

### File-Based Routing

TanStack Start uses file-based routing in `src/routes/`:

```
src/routes/
├── __root.tsx              # Root layout with sidebar, theme provider
├── index.tsx               # Dashboard home page (/)
├── campaigns/              # Campaign analytics routes (/campaigns/*)
├── customers/              # Customer management (/customers/*)
├── discounts/              # Discount codes (/discounts/*)
├── inventory/              # Product management (/inventory/*)
│   ├── products/           # Product listing and forms
│   ├── categories/         # Category management
│   └── collections/        # Collection management
├── orders/                 # Order management (/orders/*)
└── settings/               # App settings (/settings/*)
```

### Data Fetching Pattern

Uses TanStack Query with server functions for data fetching:

**Query Pattern**:
1. Define `createServerFn` in `src/utils/*.ts` (e.g., `fetchProducts`)
2. Export `queryOptions` factory (e.g., `productsQueryOptions()`)
3. Prefetch in route `loader` using `context.queryClient.ensureQueryData()`
4. Consume in component with `useSuspenseQuery()`

**Example**:
```tsx
// In route file:
export const Route = createFileRoute('/products/')({
  component: ProductsPage,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(productsQueryOptions())
  },
})

function ProductsPage() {
  const { data: products } = useSuspenseQuery(productsQueryOptions())
  return <DataTable columns={columns} data={products} />
}
```

### API Client Architecture

All API calls use `createServerFn` from TanStack Start (in `src/utils/`):

- **`products.ts`**: Product catalog, variants, attributes, categories, collections
- **`analytics.ts`**: Dashboard metrics, campaigns, visits, conversions
- **`campaigns.ts`**: Helper utilities for campaign data formatting
- **`customers.ts`**: Customer and address management
- **`orders.ts`**: Order creation and management
- **`discounts.ts`**: Discount code management
- **`tax.ts`** / **`taxSettings.ts`**: Tax configuration
- **`orderSettings.ts`**: Shipping methods

Base URL configured via `VITE_API_URL` (defaults to `http://localhost:3000`).

### UI Component Structure

```
src/components/
├── ui/                     # shadcn/ui primitives (button, dialog, etc.)
├── dashboard/              # Dashboard-specific components
├── products/               # Product-related components
├── data-table.tsx          # Reusable table with search, sort, pagination
├── app-sidebar.tsx         # Main navigation sidebar
└── theme-provider.tsx      # Dark/light theme management
```

**DataTable Component**: Reusable table built with TanStack Table. See `src/components/data-table-usage.md` for full usage guide. Features:
- Column sorting, searching, filtering
- Row selection with checkboxes
- Pagination
- Column visibility toggle

### Type Definitions

TypeScript types in `src/types/`:

- **`productTypes.ts`**: Product, Variant, Category, Collection types
- **`analyticsTypes.ts`**: Campaign, Visit, Conversion, Analytics response types
- **`customerTypes.ts`**: Customer and Address types
- **`orderTypes.ts`**: Order and OrderLineItem types
- **`discountTypes.ts`**: Discount code types

### Theme System

Multi-theme support with dark/light modes:

- Theme mode: `light`, `dark`, `system` (follows OS preference)
- Color schemes: `default`, `blue`, `green`, `orange`, `red`, `violet`, `yellow`, `zinc`
- State managed by `ThemeProvider` in `__root.tsx`
- Stored in localStorage as `vite-ui-theme` and `vite-ui-theme-color`
- Inline script in `<head>` prevents flash of unstyled content

### Path Aliases

Configured in `tsconfig.json`:
- `~/` → `src/`
- `@/` → `src/`

Both aliases are interchangeable (prefer `~/` for consistency).

## Campaign Tracking Integration

The frontend includes a comprehensive campaign tracking system:

**Core Files**:
- `src/lib/campaignTracking.ts` - Core tracking utilities
- `src/lib/useCampaignTracking.ts` - React hooks (not yet created, but documented)

**How It Works**:
1. User visits site with `?utm_campaign=TRACKING_CODE`
2. Frontend tracks visit via `POST /analytics/campaigns/track-visit`
3. Session ID stored in localStorage (30-day attribution)
4. Orders include `sessionId` for automatic campaign attribution

**Documentation**:
- `CAMPAIGN_TRACKING_README.md` - Quick start guide
- `CAMPAIGN_TRACKING_INTEGRATION.md` - Full integration guide
- `CAMPAIGN_API_USAGE.md` - API reference and examples

## Key Patterns

### Creating New Routes

1. Create file in `src/routes/` (e.g., `src/routes/products/index.tsx`)
2. Define route with `createFileRoute`:
```tsx
export const Route = createFileRoute('/products/')({
  component: ProductsPage,
  loader: ({ context }) => {
    // Prefetch data
    context.queryClient.ensureQueryData(productsQueryOptions())
  },
})
```
3. Route file auto-generates to `src/routeTree.gen.ts` (do not edit manually)

### Forms with TanStack Form + Zod

```tsx
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(1) })

function MyForm() {
  const form = useForm({
    defaultValues: { name: '' },
    validatorAdapter: zodValidator(),
    validators: { onChange: schema },
  })
}
```

### Mutations with TanStack Query

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct } from '~/utils/products'

function CreateProduct() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

### Navigation

```tsx
import { Link, useNavigate } from '@tanstack/react-router'

// Declarative navigation
<Link to="/products/$productId" params={{ productId: '123' }}>
  View Product
</Link>

// Programmatic navigation
const navigate = useNavigate()
navigate({ to: '/products' })
```

## Important Notes

- **Server Functions**: All data fetching uses `createServerFn` (not raw fetch/axios in components)
- **Query Invalidation**: Always invalidate related queries after mutations
- **Type Safety**: TanStack Router provides full type safety for routes and params
- **SSR**: Components may render server-side; avoid browser-only APIs in initial render
- **Sidebar**: Navigation menu defined in `src/components/app-sidebar.tsx`
- **Route Generation**: `src/routeTree.gen.ts` is auto-generated; never edit manually
- **Dev Server Port**: Vite runs on port 3000 (same as backend default; ensure backend uses different port or update VITE_API_URL)

## Common Tasks

### Adding a New Page
1. Create route file: `src/routes/your-route/index.tsx`
2. Add to sidebar: Edit `src/components/app-sidebar.tsx`
3. Create query functions: Add to appropriate `src/utils/*.ts` file
4. Define types: Add to appropriate `src/types/*.ts` file

### Creating a Data Table
1. Define column definitions (see `src/components/data-table-usage.md`)
2. Use `<DataTable columns={columns} data={data} searchKey="name" />`
3. See `/routes/inventory/products/` for complete example

### Adding a Form
1. Define Zod schema for validation
2. Use TanStack Form with `zodValidator`
3. Wrap in shadcn/ui form components (`<form.Field>`, `<Label>`, etc.)

### Updating Theme Colors
- Modify `tailwind.config.css` for color scheme customization
- Theme switcher in settings uses `useTheme()` hook
