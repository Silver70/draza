# Orders API Documentation

## Base URL: `/orders`

## Orders Routes

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/` | Get all orders with optional filters | `?customerId=uuid&status=pending/processing/shipped/delivered/cancelled/refunded` |
| GET | `/pending` | Get all pending orders | - |
| GET | `/processing` | Get all processing orders | - |
| GET | `/status/:status` | Get orders by specific status | - |
| GET | `/customer/:customerId` | Get all orders for a customer | - |
| GET | `/customer/:customerId/stats` | Get order statistics for a customer (total orders, total spent, etc.) | - |
| GET | `/number/:orderNumber` | Get order by order number (e.g., ORD-20241224-00001) | - |
| GET | `/:id` | Get order by ID | - |
| GET | `/:id/items` | Get order with items | - |
| GET | `/:id/details` | Get order with full relations (customer, addresses, items, products) | - |
| GET | `/:id/stats` | Get order statistics (item count, total quantity, etc.) | - |
| POST | `/` | Create a new order | Body: See "Create Order" example below |
| PUT | `/:id/status` | Update order status | Body: `{ status: "pending/processing/shipped/delivered/cancelled/refunded" }` |
| PUT | `/:id` | Update order (notes, etc.) | Body: `{ status?, notes? }` |
| PUT | `/:id/process` | Mark order as processing | - |
| PUT | `/:id/ship` | Mark order as shipped | - |
| PUT | `/:id/deliver` | Mark order as delivered | - |
| POST | `/:id/cancel` | Cancel an order | Body: `{ reason?: string }` |
| POST | `/:id/refund` | Process a refund for an order | Body: `{ reason?: string }` |
| POST | `/:id/notes` | Add notes to an order | Body: `{ notes: string }` |
| DELETE | `/:id` | Delete an order (admin only - only cancelled/refunded orders) | - |

---

## Order Statuses

| Status | Description |
|--------|-------------|
| `pending` | Order placed, waiting for processing |
| `processing` | Order is being prepared/processed |
| `shipped` | Order has been shipped to customer |
| `delivered` | Order has been delivered |
| `cancelled` | Order was cancelled (inventory restored) |
| `refunded` | Order was refunded (inventory restored) |

---

## Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Common Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or validation error |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Key Features

- **Automatic order number generation**: Format `ORD-YYYYMMDD-XXXXX` (e.g., ORD-20241224-00001)
- **Automatic price calculation**: Calculates subtotal, tax, shipping, and total from items
- **Inventory management**: Automatically deducts inventory when order is created
- **Inventory restoration**: Restores inventory when order is cancelled or refunded
- **Stock validation**: Validates sufficient stock before creating order
- **Address validation**: Ensures addresses belong to the customer
- **Status transition rules**: Prevents invalid status changes (e.g., can't change delivered order except to refund)
- **Transaction safety**: Orders and items are created atomically in a database transaction
- **Notes tracking**: Append notes for cancellations, refunds, or general comments
- **Comprehensive statistics**: Track customer spending, order counts, and order details

---

## Order Business Rules

### Status Transitions
- **Pending → Processing**: Order accepted by admin
- **Processing → Shipped**: Order shipped to customer
- **Shipped → Delivered**: Order delivered to customer
- **Pending/Processing → Cancelled**: Can cancel orders not yet shipped (restores inventory)
- **Delivered/Cancelled → Refunded**: Can refund completed or cancelled orders (restores inventory if delivered)
- **Cannot change**: Cancelled or delivered orders (except to refunded)

### Inventory Management
- **Order creation**: Automatically deducts inventory from product variants
- **Order cancellation**: Restores inventory when cancelling pending/processing orders
- **Order refund**: Restores inventory when refunding delivered orders
- **Stock validation**: Throws error if insufficient stock when creating order

### Deletion Rules
- **Can only delete**: Cancelled or refunded orders
- **Cannot delete**: Active orders (pending, processing, shipped, delivered)
- **Cascade delete**: Deleting an order automatically deletes its order items

---

## Data Models

### Order Schema
```typescript
{
  id: uuid (auto-generated)
  orderNumber: string (auto-generated, unique, e.g., "ORD-20241224-00001")
  customerId: uuid (required)
  shippingAddressId: uuid (required)
  billingAddressId: uuid (required)
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded" (default: "pending")
  subtotal: decimal(10,2) (auto-calculated)
  tax: decimal(10,2) (default: 0)
  shippingCost: decimal(10,2) (default: 0)
  total: decimal(10,2) (auto-calculated)
  notes?: string | null
  createdAt: timestamp (auto-generated)
  updatedAt: timestamp (auto-updated)
}
```

### Order Item Schema
```typescript
{
  id: uuid (auto-generated)
  orderId: uuid (required)
  productVariantId: uuid (required)
  quantity: number (required, positive integer)
  unitPrice: decimal(10,2) (required, from product variant)
  totalPrice: decimal(10,2) (calculated: quantity * unitPrice)
  createdAt: timestamp (auto-generated)
}
```

---

## Example Usage

### Create an Order
```bash
POST /orders
{
  "customerId": "customer-uuid",
  "shippingAddressId": "address-uuid-1",
  "billingAddressId": "address-uuid-2",
  "items": [
    {
      "productVariantId": "variant-uuid-1",
      "quantity": 2
    },
    {
      "productVariantId": "variant-uuid-2",
      "quantity": 1
    }
  ],
  "taxRate": 0.08,  # Optional: 8% tax rate, defaults to 0
  "shippingCost": "10.00",  # Optional: defaults to "0"
  "notes": "Please gift wrap"  # Optional
}

# Response:
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20241224-00001",
    "customerId": "customer-uuid",
    "status": "pending",
    "subtotal": "50.00",
    "tax": "4.00",
    "shippingCost": "10.00",
    "total": "64.00",
    "items": [
      {
        "id": "item-uuid-1",
        "productVariantId": "variant-uuid-1",
        "quantity": 2,
        "unitPrice": "20.00",
        "totalPrice": "40.00"
      },
      {
        "id": "item-uuid-2",
        "productVariantId": "variant-uuid-2",
        "quantity": 1,
        "unitPrice": "10.00",
        "totalPrice": "10.00"
      }
    ],
    "createdAt": "2024-12-24T10:30:00Z"
  }
}
```

### Get Order with Full Details
```bash
GET /orders/:id/details

# Response includes customer, addresses, items, and product details
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20241224-00001",
    "status": "processing",
    "total": "64.00",
    "customer": {
      "id": "customer-uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "shippingAddress": {
      "id": "address-uuid",
      "streetAddress": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001"
    },
    "billingAddress": { /* ... */ },
    "items": [
      {
        "id": "item-uuid",
        "quantity": 2,
        "unitPrice": "20.00",
        "productVariant": {
          "id": "variant-uuid",
          "sku": "SHIRT-RED-L",
          "product": {
            "name": "Cool T-Shirt",
            "slug": "cool-t-shirt"
          }
        }
      }
    ]
  }
}
```

### Update Order Status
```bash
PUT /orders/:id/status
{
  "status": "processing"
}

# Or use shortcuts:
PUT /orders/:id/process   # Mark as processing
PUT /orders/:id/ship      # Mark as shipped
PUT /orders/:id/deliver   # Mark as delivered
```

### Cancel an Order
```bash
POST /orders/:id/cancel
{
  "reason": "Customer requested cancellation"  # Optional
}

# Inventory is automatically restored
# Notes field is updated with cancellation reason
```

### Process a Refund
```bash
POST /orders/:id/refund
{
  "reason": "Product was damaged"  # Optional
}

# Can only refund delivered or cancelled orders
# Inventory is restored if refunding a delivered order
# Notes field is updated with refund reason
```

### Add Notes to Order
```bash
POST /orders/:id/notes
{
  "notes": "Customer called about shipping delay"
}

# Notes are appended to existing notes with newline separator
```

### Get Customer Order History
```bash
GET /orders/customer/:customerId

# Returns all orders for customer, sorted by most recent first
```

### Get Customer Order Statistics
```bash
GET /orders/customer/:customerId/stats

# Response:
{
  "success": true,
  "data": {
    "customerId": "customer-uuid",
    "totalOrders": 15,
    "totalSpent": "1250.50",
    "ordersByStatus": {
      "pending": 2,
      "processing": 1,
      "shipped": 3,
      "delivered": 8,
      "cancelled": 1,
      "refunded": 0
    },
    "lastOrderDate": "2024-12-24T10:30:00Z"
  }
}
```

### Search Orders by Status
```bash
GET /orders/status/pending
GET /orders/pending  # Shortcut

# Returns all pending orders
```

### Filter Orders by Customer and Status
```bash
GET /orders?customerId=uuid&status=delivered

# Returns all delivered orders for specific customer
```

---

## Workflow Examples

### Complete Order Lifecycle
```bash
# 1. Customer creates order
POST /orders
{ /* order data */ }
# Status: pending
# Inventory: deducted

# 2. Admin accepts order
PUT /orders/:id/process
# Status: processing

# 3. Order is shipped
PUT /orders/:id/ship
# Status: shipped

# 4. Order is delivered
PUT /orders/:id/deliver
# Status: delivered
```

### Cancellation Workflow
```bash
# Cancel before shipping (pending or processing)
POST /orders/:id/cancel
{ "reason": "Customer changed mind" }
# Status: cancelled
# Inventory: restored
# Notes: "Cancellation reason: Customer changed mind"
```

### Refund Workflow
```bash
# Refund after delivery
POST /orders/:id/refund
{ "reason": "Product defective" }
# Status: refunded
# Inventory: restored
# Notes: "Refund reason: Product defective"
```

---

## Error Handling

### Insufficient Stock
```bash
POST /orders
{
  "customerId": "...",
  "items": [{ "productVariantId": "...", "quantity": 100 }]
}

# Response (400):
{
  "success": false,
  "error": "Insufficient stock for product variant SKU-123. Available: 10, Requested: 100"
}
```

### Invalid Status Transition
```bash
PUT /orders/:id/status
{ "status": "processing" }
# If order is already delivered

# Response (400):
{
  "success": false,
  "error": "Cannot change status of a delivered order (except to refunded)"
}
```

### Delete Active Order
```bash
DELETE /orders/:id
# If order status is "processing"

# Response (400):
{
  "success": false,
  "error": "Can only delete cancelled or refunded orders"
}
```

### Address Ownership Validation
```bash
POST /orders
{
  "customerId": "customer-1",
  "shippingAddressId": "address-of-customer-2",  # Wrong customer!
  ...
}

# Response (400):
{
  "success": false,
  "error": "Shipping address does not belong to this customer"
}
```

---

## Integration Notes

### With Customers Module
- Order requires `customerId` (must exist)
- Order requires `shippingAddressId` and `billingAddressId` (must belong to customer)
- Customer statistics include order count and total spent

### With Products Module
- Order items reference `productVariantId` (must exist)
- Inventory is automatically managed (deducted on create, restored on cancel/refund)
- Unit prices are pulled from product variants at order creation time

### Price Calculation
```javascript
subtotal = sum(item.quantity * item.unitPrice)
tax = subtotal * taxRate
total = subtotal + tax + shippingCost
```

All prices are stored as decimal(10,2) for precision.
