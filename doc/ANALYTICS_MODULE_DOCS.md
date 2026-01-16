# Analytics Module Documentation

## Overview

The Analytics module provides comprehensive eCommerce analytics and metrics for your dashboard. It follows the same structure and patterns as other modules (orders, products, customers).

## Module Structure

```
apps/backend/src/modules/analytics/
├── repo/
│   ├── analytics.repo.ts    # Database queries
│   └── index.ts             # Repo exports
├── services/
│   ├── analytics.service.ts # Business logic
│   └── index.ts            # Service exports
├── analytics.routes.ts      # API routes
└── analytics.types.ts       # TypeScript types and schemas
```

## Available Endpoints

### 1. Dashboard Overview (Main Endpoint)
**GET** `/analytics/dashboard/overview`

Returns comprehensive dashboard metrics in a single call:
- Total revenue, orders, customers
- Average order value
- Revenue breakdown by order status
- Order count by status
- Customer breakdown (registered vs guest)
- Inventory alerts (low stock, out of stock)
- Tax and shipping collected

**Response Example:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": "15000.00",
    "totalOrders": 125,
    "totalCustomers": 87,
    "averageOrderValue": "120.00",
    "revenueByStatus": {
      "pending": "500.00",
      "processing": "1200.00",
      "shipped": "2300.00",
      "delivered": "10500.00",
      "cancelled": "300.00",
      "refunded": "200.00"
    },
    "ordersByStatus": {
      "pending": 5,
      "processing": 10,
      "shipped": 15,
      "delivered": 90,
      "cancelled": 3,
      "refunded": 2
    },
    "customerBreakdown": {
      "registered": 65,
      "guest": 22
    },
    "lowStockCount": 12,
    "outOfStockCount": 3,
    "taxCollected": "1250.00",
    "shippingCollected": "750.00"
  }
}
```

---

### 2. Revenue Analytics

#### GET `/analytics/revenue`
Detailed revenue breakdown

#### GET `/analytics/revenue/trend`
Revenue trends over time
- **Query Params:**
  - `period`: `day` | `week` | `month` (default: `week`)
  - `limit`: number (default: 30)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-W01",
      "revenue": "1200.50",
      "orderCount": 12
    },
    {
      "date": "2024-W02",
      "revenue": "1500.75",
      "orderCount": 15
    }
  ]
}
```

---

### 3. Order Analytics

#### GET `/analytics/orders`
Order performance metrics (total orders, by status, cancellation rate, etc.)

#### GET `/analytics/orders/recent`
Recent orders with customer info
- **Query Params:**
  - `limit`: number (default: 10)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-20240115-ABC123",
      "customerName": "John Doe",
      "total": "125.50",
      "status": "delivered",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 4. Customer Analytics

#### GET `/analytics/customers`
Customer metrics (total, repeat rate, lifetime value)

#### GET `/analytics/customers/top`
Top customers by spending
- **Query Params:**
  - `limit`: number (default: 10)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "totalOrders": 15,
      "totalSpent": "2500.00"
    }
  ]
}
```

#### GET `/analytics/customers/geography`
Customer distribution by location

---

### 5. Product Analytics

#### GET `/analytics/products`
Product overview (total products, variants, average price)

#### GET `/analytics/products/top-selling`
Best selling products
- **Query Params:**
  - `limit`: number (default: 10)
  - `sortBy`: `quantity` | `revenue` (default: `revenue`)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "uuid",
      "productName": "Premium T-Shirt",
      "variantId": "uuid",
      "sku": "TSHIRT-BLK-L",
      "quantitySold": 150,
      "revenue": "4500.00"
    }
  ]
}
```

#### GET `/analytics/products/low-stock`
Products running low on inventory
- **Query Params:**
  - `threshold`: number (default: 10)
  - `limit`: number (default: 20)

#### GET `/analytics/products/out-of-stock`
Out of stock products
- **Query Params:**
  - `limit`: number (default: 20)

---

### 6. Inventory Analytics

#### GET `/analytics/inventory`
Inventory overview (total value, stock alerts)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "totalInventoryValue": "45000.00",
    "lowStockCount": 12,
    "outOfStockCount": 3,
    "totalVariants": 250
  }
}
```

---

### 7. Sales Trends

#### GET `/analytics/sales/trends`
Sales trends with detailed metrics
- **Query Params:**
  - `period`: `day` | `week` | `month` (default: `week`)
  - `limit`: number (default: 30)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2024-W01",
      "revenue": "1500.00",
      "orders": 15,
      "averageOrderValue": "100.00"
    }
  ]
}
```

---

### 8. Tax & Shipping Analytics

#### GET `/analytics/tax`
Tax collection breakdown by jurisdiction

**Response Example:**
```json
{
  "success": true,
  "data": {
    "totalTaxCollected": "1250.00",
    "taxByJurisdiction": [
      {
        "jurisdictionName": "California State Tax",
        "taxCollected": "850.00",
        "orderCount": 50
      },
      {
        "jurisdictionName": "Texas State Tax",
        "taxCollected": "400.00",
        "orderCount": 25
      }
    ]
  }
}
```

#### GET `/analytics/shipping`
Shipping analytics by method

**Response Example:**
```json
{
  "success": true,
  "data": {
    "totalShippingRevenue": "750.00",
    "averageShippingCost": "6.25",
    "shippingByMethod": [
      {
        "methodName": "Standard Shipping",
        "orderCount": 80,
        "revenue": "400.00"
      },
      {
        "methodName": "Express Shipping",
        "orderCount": 20,
        "revenue": "350.00"
      }
    ],
    "freeShippingOrders": 25
  }
}
```

---

## Frontend Integration

### Recommended Approach for Dashboard

1. **Main Dashboard Page** - Use the overview endpoint:
```typescript
// Fetch all key metrics in one call
const response = await fetch('/analytics/dashboard/overview');
const { data } = await response.json();

// Display:
// - Total revenue, orders, customers
// - Order status breakdown (pie chart)
// - Revenue by status
// - Low stock alerts
```

2. **Revenue Charts** - Use trend endpoints:
```typescript
// Get weekly revenue trend for the last 8 weeks
const response = await fetch('/analytics/revenue/trend?period=week&limit=8');
const { data } = await response.json();

// Render line chart showing revenue over time
```

3. **Recent Activity** - Use recent orders:
```typescript
// Get last 5 orders
const response = await fetch('/analytics/orders/recent?limit=5');
const { data } = await response.json();

// Display table of recent orders
```

4. **Top Performers** - Use top products/customers:
```typescript
// Get top 5 selling products
const products = await fetch('/analytics/products/top-selling?limit=5');

// Get top 5 customers
const customers = await fetch('/analytics/customers/top?limit=5');
```

---

## Performance Optimizations

The analytics module uses several optimizations:

1. **Parallel Queries** - The dashboard overview fetches all data in parallel using `Promise.all()`
2. **SQL Aggregations** - All calculations happen at the database level
3. **Indexed Queries** - Uses existing indexes on orders, customers, and products
4. **Minimal Data Transfer** - Returns only necessary fields

---

## Future Enhancements

Possible additions:
- Date range filtering (start/end date)
- Export to CSV/PDF
- Custom dashboard widgets
- Real-time analytics with WebSockets
- Comparison periods (this week vs last week)
- Sales forecasting
- Product recommendations based on analytics
- Cohort analysis

---

## Testing the Endpoints

You can test the endpoints using curl:

```bash
# Get dashboard overview
curl http://localhost:3000/analytics/dashboard/overview

# Get revenue trends
curl http://localhost:3000/analytics/revenue/trend?period=week&limit=4

# Get top selling products
curl http://localhost:3000/analytics/products/top-selling?sortBy=revenue&limit=10

# Get recent orders
curl http://localhost:3000/analytics/orders/recent?limit=5
```

---

## Notes

- All monetary values are returned as strings with 2 decimal places
- All endpoints follow the standard response format: `{ success: boolean, data: any, error?: string }`
- Percentages are returned as strings (e.g., "15.50" for 15.5%)
- Date formats vary by period type:
  - Day: `YYYY-MM-DD`
  - Week: `IYYY-IW` (ISO week)
  - Month: `YYYY-MM`
