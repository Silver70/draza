# Storefront API Reference Guide

A complete API reference for building an ecommerce storefront using the Draza backend.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication & CORS](#authentication--cors)
- [Response Format](#response-format)
- [Product Catalog](#product-catalog)
  - [Browsing Products](#browsing-products)
  - [Product Details](#product-details)
  - [Categories](#categories)
  - [Collections](#collections)
  - [Product Search & Filtering](#product-search--filtering)
- [Shopping Cart](#shopping-cart)
  - [Get or Create Cart](#get-or-create-cart)
  - [Managing Cart Items](#managing-cart-items)
  - [Apply Discount Codes](#apply-discount-codes)
  - [Calculate Totals](#calculate-totals)
- [Customer Management](#customer-management)
  - [Create Customer Account](#create-customer-account)
  - [Guest Customers](#guest-customers)
  - [Customer Profile](#customer-profile)
  - [Address Management](#address-management)
- [Checkout & Orders](#checkout--orders)
  - [Shipping Methods](#shipping-methods)
  - [Tax Calculation](#tax-calculation)
  - [Place Order](#place-order)
  - [Order History](#order-history)
  - [Order Details](#order-details)
- [Discounts & Promotions](#discounts--promotions)
  - [Validate Discount Code](#validate-discount-code)
  - [Product Discounts](#product-discounts)
- [Campaign Tracking](#campaign-tracking)
  - [Track Visits](#track-visits)
  - [Attribution Flow](#attribution-flow)

---

## Getting Started

### Base URL
```
http://localhost:3000
```

For production, replace with your deployed backend URL.

### Environment Setup
```bash
# In your .env file
VITE_API_URL=http://localhost:3000
```

### HTTP Client Setup

Example using `fetch`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // For session cookies
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}
```

---

## Authentication & CORS

### CORS Configuration
The backend is configured to accept requests from:
- `http://localhost:3001`
- `http://localhost:5173`

Credentials are enabled for session management.

### Session Management
The API uses session-based tracking for:
- Shopping cart persistence
- Campaign attribution
- Guest checkout

Sessions are typically stored in localStorage as UUIDs:
```typescript
// Generate or retrieve session ID
function getSessionId(): string {
  let sessionId = localStorage.getItem('sessionId')

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('sessionId', sessionId)
  }

  return sessionId
}
```

---

## Response Format

All API responses follow a consistent structure:

### Success Response
```json
{
  "success": true,
  "data": {
    // Resource data
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "message": "Additional context"
}
```

---

## Product Catalog

### Browsing Products

#### Get All Active Products
```http
GET /products/active
```

**Query Parameters:**
- `categoryId` (optional) - Filter by category ID
- `search` (optional) - Search by product name/description

**Example Request:**
```typescript
// Get all active products
const response = await apiRequest<{
  success: boolean
  data: Product[]
}>('/products/active')

// Filter by category
const categoryProducts = await apiRequest<{
  success: boolean
  data: Product[]
}>('/products/active?categoryId=123')

// Search products
const searchResults = await apiRequest<{
  success: boolean
  data: Product[]
}>('/products/active?search=shirt')
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Classic Cotton T-Shirt",
      "slug": "classic-cotton-t-shirt",
      "description": "Comfortable everyday tee",
      "categoryId": 5,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Product Details

#### Get Product by Slug
```http
GET /products/slug/:slug
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    product: Product
    category: Category
    images: ProductImage[]
  }
}>('/products/slug/classic-cotton-t-shirt')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Classic Cotton T-Shirt",
      "slug": "classic-cotton-t-shirt",
      "description": "Comfortable everyday tee",
      "categoryId": 5,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "category": {
      "id": 5,
      "name": "T-Shirts",
      "slug": "t-shirts",
      "parentId": 1
    },
    "images": [
      {
        "id": 1,
        "productId": 1,
        "url": "https://your-supabase.storage.co/product-images/products/1/image.jpg",
        "altText": "Classic Cotton T-Shirt Front View",
        "type": "thumbnail",
        "position": 0
      }
    ]
  }
}
```

---

#### Get Product with Variants
```http
GET /products/slug/:slug/variants
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    product: Product
    category: Category
    variants: Array<{
      variant: ProductVariant
      attributes: Array<{
        attribute: Attribute
        value: AttributeValue
      }>
      images: VariantImage[]
    }>
    images: ProductImage[]
  }
}>('/products/slug/classic-cotton-t-shirt/variants')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Classic Cotton T-Shirt",
      "slug": "classic-cotton-t-shirt"
    },
    "variants": [
      {
        "variant": {
          "id": 1,
          "productId": 1,
          "sku": "SHIRT-BLK-SM",
          "price": "29.99",
          "quantityInStock": 50
        },
        "attributes": [
          {
            "attribute": { "id": 1, "name": "Color" },
            "value": { "id": 1, "value": "Black" }
          },
          {
            "attribute": { "id": 2, "name": "Size" },
            "value": { "id": 5, "value": "Small" }
          }
        ],
        "images": [
          {
            "id": 1,
            "productVariantId": 1,
            "url": "https://your-supabase.storage.co/.../black-small.jpg",
            "altText": "Black Small",
            "type": "thumbnail",
            "position": 0
          }
        ]
      }
    ]
  }
}
```

---

#### Check Product Availability
```http
GET /products/:id/availability
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    isAvailable: boolean
    totalStock: number
    variants: Array<{
      id: number
      sku: string
      quantityInStock: number
      isAvailable: boolean
    }>
  }
}>('/products/1/availability')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isAvailable": true,
    "totalStock": 150,
    "variants": [
      {
        "id": 1,
        "sku": "SHIRT-BLK-SM",
        "quantityInStock": 50,
        "isAvailable": true
      }
    ]
  }
}
```

---

### Categories

#### Get Category Tree
```http
GET /products/categories/tree
```

Returns a hierarchical tree structure of all categories.

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Array<Category & { children?: Category[] }>
}>('/products/categories/tree')
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Clothing",
      "slug": "clothing",
      "parentId": null,
      "children": [
        {
          "id": 5,
          "name": "T-Shirts",
          "slug": "t-shirts",
          "parentId": 1
        },
        {
          "id": 6,
          "name": "Jeans",
          "slug": "jeans",
          "parentId": 1
        }
      ]
    }
  ]
}
```

---

#### Get Category by Slug
```http
GET /products/categories/slug/:slug
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Category
}>('/products/categories/slug/t-shirts')
```

---

#### Get Category Breadcrumb
```http
GET /products/categories/:id/breadcrumb
```

Returns the path from root to the specified category.

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Category[]
}>('/products/categories/5/breadcrumb')
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Clothing", "slug": "clothing" },
    { "id": 5, "name": "T-Shirts", "slug": "t-shirts" }
  ]
}
```

---

### Collections

#### Get Active Collections
```http
GET /products/collections/active
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Collection[]
}>('/products/collections/active')
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Summer Collection",
      "slug": "summer-collection",
      "description": "Fresh styles for summer",
      "isActive": true,
      "displayOrder": 1
    }
  ]
}
```

---

#### Get Collection with Products
```http
GET /products/collections/slug/:slug
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    collection: Collection
    products: Array<{
      product: Product
      position: number
      category: Category
    }>
  }
}>('/products/collections/slug/summer-collection')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "collection": {
      "id": 1,
      "name": "Summer Collection",
      "slug": "summer-collection"
    },
    "products": [
      {
        "product": {
          "id": 1,
          "name": "Classic Cotton T-Shirt",
          "slug": "classic-cotton-t-shirt"
        },
        "position": 1,
        "category": {
          "id": 5,
          "name": "T-Shirts"
        }
      }
    ]
  }
}
```

---

### Product Search & Filtering

The `/products/active` endpoint supports multiple query parameters for search and filtering:

**Available Filters:**
- `search` - Full-text search on product name and description
- `categoryId` - Filter by specific category

**Example: Combined Search**
```typescript
// Search for "cotton" in "T-Shirts" category
const response = await apiRequest<{
  success: boolean
  data: Product[]
}>('/products/active?categoryId=5&search=cotton')
```

**Building a Search Interface:**
```typescript
interface SearchParams {
  search?: string
  categoryId?: number
}

async function searchProducts(params: SearchParams) {
  const queryParams = new URLSearchParams()

  if (params.search) queryParams.append('search', params.search)
  if (params.categoryId) queryParams.append('categoryId', String(params.categoryId))

  const query = queryParams.toString()
  const endpoint = query ? `/products/active?${query}` : '/products/active'

  return apiRequest<{ success: boolean; data: Product[] }>(endpoint)
}
```

---

## Shopping Cart

### Get or Create Cart

```http
GET /cart?sessionId={sessionId}&customerId={customerId}
```

**Query Parameters:**
- `sessionId` (required for guest) - Session identifier
- `customerId` (optional) - Customer ID for logged-in users

**Example Request:**
```typescript
const sessionId = getSessionId()

const response = await apiRequest<{
  success: boolean
  data: {
    cart: Cart
    items: Array<{
      item: CartItem
      variant: ProductVariant
      product: Product
    }>
  }
}>(`/cart?sessionId=${sessionId}`)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": 1,
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "customerId": null,
      "status": "active",
      "subtotal": "0.00",
      "discountTotal": "0.00",
      "taxTotal": "0.00",
      "shippingTotal": "0.00",
      "total": "0.00",
      "discountCodeId": null,
      "expiresAt": "2025-02-01T00:00:00.000Z",
      "lastActivityAt": "2025-01-01T00:00:00.000Z"
    },
    "items": []
  }
}
```

---

### Managing Cart Items

#### Add Item to Cart
```http
POST /cart/items
```

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "productVariantId": 1,
  "quantity": 2
}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    item: CartItem
    cart: Cart
  }
}>('/cart/items', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: getSessionId(),
    productVariantId: 1,
    quantity: 2
  })
})
```

---

#### Update Item Quantity
```http
PUT /cart/items/:itemId
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    item: CartItem
    cart: Cart
  }
}>('/cart/items/1', {
  method: 'PUT',
  body: JSON.stringify({ quantity: 3 })
})
```

---

#### Remove Item from Cart
```http
DELETE /cart/items/:itemId
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  message: string
}>('/cart/items/1', {
  method: 'DELETE'
})
```

---

#### Clear Cart
```http
DELETE /cart/clear
```

**Query Parameters:**
- `sessionId` (required) - Session identifier

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  message: string
}>(`/cart/clear?sessionId=${getSessionId()}`, {
  method: 'DELETE'
})
```

---

### Apply Discount Codes

#### Apply Discount
```http
POST /cart/discount
```

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "SUMMER20"
}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Cart
  message: string
}>('/cart/discount', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: getSessionId(),
    code: 'SUMMER20'
  })
})
```

---

#### Remove Discount
```http
DELETE /cart/discount?sessionId={sessionId}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Cart
}>(`/cart/discount?sessionId=${getSessionId()}`, {
  method: 'DELETE'
})
```

---

### Calculate Totals

#### Calculate Cart Totals with Tax & Shipping
```http
POST /cart/calculate
```

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "shippingAddressId": 1,
  "shippingMethodId": 1
}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    subtotal: string
    discountTotal: string
    taxTotal: string
    shippingTotal: string
    total: string
    breakdown: {
      items: Array<{
        productVariantId: number
        quantity: number
        unitPrice: string
        totalPrice: string
      }>
      tax: {
        jurisdiction: string
        rate: string
        amount: string
      }
      shipping: {
        method: string
        cost: string
      }
    }
  }
}>('/cart/calculate', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: getSessionId(),
    shippingAddressId: 1,
    shippingMethodId: 1
  })
})
```

---

## Customer Management

### Create Customer Account

```http
POST /customers
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+1234567890"
}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Customer
}>('/customers', {
  method: 'POST',
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890'
  })
})
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": null,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+1234567890",
    "isGuest": false,
    "acquisitionCampaignId": null,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Guest Customers

#### Create Guest Customer
```http
POST /customers/guest
```

**Request Body:**
```json
{
  "email": "guest@example.com",
  "firstName": "Guest",
  "lastName": "User"
}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Customer
}>('/customers/guest', {
  method: 'POST',
  body: JSON.stringify({
    email: 'guest@example.com',
    firstName: 'Guest',
    lastName: 'User'
  })
})
```

---

#### Convert Guest to Registered
```http
PUT /customers/:id/convert-to-registered
```

**Request Body:**
```json
{
  "userId": "auth-user-id"
}
```

---

### Customer Profile

#### Get Customer by ID
```http
GET /customers/:id
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Customer
}>('/customers/1')
```

---

#### Get Customer by Email
```http
GET /customers/email/:email
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Customer
}>('/customers/email/john.doe@example.com')
```

---

#### Update Customer
```http
PUT /customers/:id
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1987654321"
}
```

---

#### Get Customer Statistics
```http
GET /customers/:id/stats
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    totalOrders: number
    totalSpent: string
    averageOrderValue: string
    lastOrderDate: string | null
  }
}>('/customers/1/stats')
```

---

### Address Management

#### Get Customer Addresses
```http
GET /customers/:customerId/addresses/all
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Address[]
}>('/customers/1/addresses/all')
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "customerId": 1,
      "firstName": "John",
      "lastName": "Doe",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US",
      "isDefault": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### Get Default Address
```http
GET /customers/:customerId/addresses/default
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Address | null
}>('/customers/1/addresses/default')
```

---

#### Create Address
```http
POST /customers/:customerId/addresses
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "US",
  "isDefault": true
}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Address
}>('/customers/1/addresses', {
  method: 'POST',
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    isDefault: true
  })
})
```

---

#### Update Address
```http
PUT /customers/addresses/:addressId
```

**Request Body:**
```json
{
  "street": "456 Oak Ave",
  "city": "Brooklyn"
}
```

---

#### Set Default Address
```http
PUT /customers/:customerId/addresses/:addressId/set-default
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Address
}>('/customers/1/addresses/2/set-default', {
  method: 'PUT'
})
```

---

#### Delete Address
```http
DELETE /customers/addresses/:addressId
```

---

## Checkout & Orders

### Shipping Methods

#### Get Active Shipping Methods
```http
GET /orders/shipping-methods
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: ShippingMethod[]
}>('/orders/shipping-methods')
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "standard_shipping",
      "displayName": "Standard Shipping",
      "description": "5-7 business days",
      "carrier": "usps",
      "calculationType": "flat_rate",
      "baseRate": "5.99",
      "freeShippingThreshold": "50.00",
      "estimatedDaysMin": 5,
      "estimatedDaysMax": 7,
      "isActive": true,
      "displayOrder": 1
    },
    {
      "id": 2,
      "name": "express_shipping",
      "displayName": "Express Shipping",
      "description": "2-3 business days",
      "carrier": "fedex",
      "calculationType": "flat_rate",
      "baseRate": "15.99",
      "freeShippingThreshold": null,
      "estimatedDaysMin": 2,
      "estimatedDaysMax": 3,
      "isActive": true,
      "displayOrder": 2
    }
  ]
}
```

---

#### Get Shipping Options for Cart
```http
POST /orders/shipping-options
```

**Request Body:**
```json
{
  "cartTotal": "75.00",
  "shippingAddressId": 1
}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Array<{
    method: ShippingMethod
    cost: string
    isFree: boolean
  }>
}>('/orders/shipping-options', {
  method: 'POST',
  body: JSON.stringify({
    cartTotal: '75.00',
    shippingAddressId: 1
  })
})
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "method": {
        "id": 1,
        "name": "standard_shipping",
        "displayName": "Standard Shipping",
        "estimatedDaysMin": 5,
        "estimatedDaysMax": 7
      },
      "cost": "0.00",
      "isFree": true
    },
    {
      "method": {
        "id": 2,
        "name": "express_shipping",
        "displayName": "Express Shipping",
        "estimatedDaysMin": 2,
        "estimatedDaysMax": 3
      },
      "cost": "15.99",
      "isFree": false
    }
  ]
}
```

---

### Tax Calculation

Tax is calculated automatically during order creation based on the shipping address. The system uses tax jurisdictions configured in the backend.

To preview tax before checkout, use the cart calculate endpoint with a shipping address.

---

### Place Order

```http
POST /orders
```

**Request Body:**
```json
{
  "customerId": 1,
  "shippingAddressId": 1,
  "billingAddressId": 1,
  "shippingMethodId": 1,
  "items": [
    {
      "productVariantId": 1,
      "quantity": 2,
      "unitPrice": "29.99"
    }
  ],
  "discountCodeId": 1,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "notes": "Please leave at door"
}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    order: Order
    items: OrderItem[]
  }
  message: string
}>('/orders', {
  method: 'POST',
  body: JSON.stringify({
    customerId: 1,
    shippingAddressId: 1,
    billingAddressId: 1,
    shippingMethodId: 1,
    items: [
      {
        productVariantId: 1,
        quantity: 2,
        unitPrice: '29.99'
      }
    ],
    sessionId: getSessionId()
  })
})
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "ORD-20250101-0001",
      "customerId": 1,
      "shippingAddressId": 1,
      "billingAddressId": 1,
      "status": "pending",
      "subtotal": "59.98",
      "discountAmount": "0.00",
      "tax": "5.40",
      "shippingCost": "5.99",
      "total": "71.37",
      "taxJurisdictionId": 1,
      "taxJurisdictionName": "New York State",
      "taxRate": "0.09",
      "shippingMethodId": 1,
      "shippingMethodName": "Standard Shipping",
      "shippingCarrier": "usps",
      "estimatedDeliveryDate": "2025-01-08T00:00:00.000Z",
      "campaignId": 5,
      "visitId": 123,
      "notes": "Please leave at door",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "items": [
      {
        "id": 1,
        "orderId": 1,
        "productVariantId": 1,
        "quantity": 2,
        "unitPrice": "29.99",
        "totalPrice": "59.98",
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  },
  "message": "Order created successfully"
}
```

**Important Notes:**
- Tax is calculated automatically based on the shipping address
- Shipping cost is determined by the selected shipping method
- If `sessionId` is provided, the order is automatically attributed to the campaign
- Discount is applied if `discountCodeId` is provided
- The order number is generated automatically in format `ORD-YYYYMMDD-####`

---

### Order History

#### Get Customer Orders
```http
GET /orders/customer/:customerId
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Order[]
}>('/orders/customer/1')
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-20250101-0001",
      "customerId": 1,
      "status": "delivered",
      "subtotal": "59.98",
      "tax": "5.40",
      "shippingCost": "5.99",
      "total": "71.37",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Order Details

#### Get Order by ID
```http
GET /orders/:id
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Order
}>('/orders/1')
```

---

#### Get Order by Order Number
```http
GET /orders/number/:orderNumber
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Order
}>('/orders/number/ORD-20250101-0001')
```

---

#### Get Order with Full Details
```http
GET /orders/:id/details
```

Returns order with all relations: items, customer, addresses, shipping method, etc.

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    order: Order
    items: Array<{
      item: OrderItem
      variant: ProductVariant
      product: Product
    }>
    customer: Customer
    shippingAddress: Address
    billingAddress: Address
    shippingMethod: ShippingMethod
    discounts: Discount[]
  }
}>('/orders/1/details')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "ORD-20250101-0001",
      "status": "delivered",
      "total": "71.37"
    },
    "items": [
      {
        "item": {
          "id": 1,
          "orderId": 1,
          "productVariantId": 1,
          "quantity": 2,
          "unitPrice": "29.99",
          "totalPrice": "59.98"
        },
        "variant": {
          "id": 1,
          "sku": "SHIRT-BLK-SM",
          "price": "29.99"
        },
        "product": {
          "id": 1,
          "name": "Classic Cotton T-Shirt",
          "slug": "classic-cotton-t-shirt"
        }
      }
    ],
    "customer": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "shippingAddress": {
      "id": 1,
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    },
    "billingAddress": {
      "id": 1,
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    },
    "shippingMethod": {
      "id": 1,
      "displayName": "Standard Shipping",
      "carrier": "usps"
    },
    "discounts": []
  }
}
```

---

## Discounts & Promotions

### Validate Discount Code

```http
POST /discounts/validate-code
```

**Request Body:**
```json
{
  "code": "SUMMER20",
  "cartTotal": "75.00"
}
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: {
    isValid: boolean
    discount?: {
      id: number
      name: string
      discountType: 'percentage' | 'fixed_amount'
      value: string
      scope: string
    }
    discountCode?: {
      id: number
      code: string
      minimumOrderValue: string | null
    }
    appliedAmount?: string
    reason?: string
  }
}>('/discounts/validate-code', {
  method: 'POST',
  body: JSON.stringify({
    code: 'SUMMER20',
    cartTotal: '75.00'
  })
})
```

**Response (Valid Code):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "discount": {
      "id": 1,
      "name": "Summer Sale 20% Off",
      "discountType": "percentage",
      "value": "0.20",
      "scope": "store_wide"
    },
    "discountCode": {
      "id": 1,
      "code": "SUMMER20",
      "minimumOrderValue": "50.00"
    },
    "appliedAmount": "15.00"
  }
}
```

**Response (Invalid Code):**
```json
{
  "success": false,
  "data": {
    "isValid": false,
    "reason": "Discount code not found or inactive"
  }
}
```

---

### Product Discounts

#### Get Applicable Discounts for Product
```http
GET /discounts/products/:productId
```

**Example Request:**
```typescript
const response = await apiRequest<{
  success: boolean
  data: Array<{
    discount: Discount
    appliedAmount: string
  }>
}>('/discounts/products/1')
```

---

## Campaign Tracking

### Track Visits

When a user visits your storefront via a campaign link (e.g., `?utm_campaign=TRACKING_CODE`), track the visit to enable conversion attribution.

```http
POST /analytics/campaigns/track-visit
```

**Request Body:**
```json
{
  "trackingCode": "INSTA-SUMMER-2025",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "landingPage": "/products/summer-collection",
  "referrer": "https://instagram.com",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1",
  "deviceType": "mobile"
}
```

**Example Implementation:**
```typescript
// Campaign tracking hook
function useCampaignTracking() {
  useEffect(() => {
    const trackCampaignVisit = async () => {
      // Check for UTM parameter
      const params = new URLSearchParams(window.location.search)
      const trackingCode = params.get('utm_campaign')

      if (!trackingCode) return

      const sessionId = getSessionId()

      // Detect device type
      const getDeviceType = () => {
        const ua = navigator.userAgent
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
          return 'tablet'
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
          return 'mobile'
        }
        return 'desktop'
      }

      try {
        await apiRequest('/analytics/campaigns/track-visit', {
          method: 'POST',
          body: JSON.stringify({
            trackingCode,
            sessionId,
            landingPage: window.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            deviceType: getDeviceType()
          })
        })
      } catch (error) {
        console.error('Failed to track campaign visit:', error)
      }
    }

    trackCampaignVisit()
  }, [])
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "visit": {
      "id": 123,
      "campaignId": 5,
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "landingPage": "/products/summer-collection",
      "deviceType": "mobile",
      "visitedAt": "2025-01-01T12:00:00.000Z"
    },
    "campaign": {
      "id": 5,
      "name": "Instagram Summer Campaign 2025",
      "trackingCode": "INSTA-SUMMER-2025"
    }
  }
}
```

---

### Attribution Flow

The campaign attribution system uses a **30-day attribution window**:

1. **Visit Tracking**: When a user clicks a campaign link, their visit is tracked with a session ID
2. **Session Storage**: The session ID is stored in localStorage and included in cart/checkout requests
3. **Order Attribution**: When an order is placed with a session ID, it's automatically attributed to the campaign
4. **Conversion Tracking**: The system marks the visit as converted and records conversion metrics

**Complete Flow Example:**

```typescript
// Step 1: User clicks campaign link
// URL: https://yourstore.com/?utm_campaign=INSTA-SUMMER-2025

// Step 2: Track the visit (automatic via hook)
useCampaignTracking()

// Step 3: User shops and adds items to cart
await apiRequest('/cart/items', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: getSessionId(), // Same session ID
    productVariantId: 1,
    quantity: 2
  })
})

// Step 4: User completes checkout
await apiRequest('/orders', {
  method: 'POST',
  body: JSON.stringify({
    customerId: 1,
    shippingAddressId: 1,
    billingAddressId: 1,
    shippingMethodId: 1,
    items: [...],
    sessionId: getSessionId() // Attribution happens here
  })
})

// Result: Order is automatically attributed to the campaign
// The visit record is marked as converted with conversion metrics
```

---

## Complete Example: Building a Product Page

Here's a complete example of building a product detail page with all the necessary API calls:

```typescript
import { useEffect, useState } from 'react'

interface ProductPageProps {
  slug: string
}

export function ProductPage({ slug }: ProductPageProps) {
  const [productData, setProductData] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Fetch product with variants
        const response = await apiRequest(`/products/slug/${slug}/variants`)
        setProductData(response.data)

        // Select first variant by default
        if (response.data.variants.length > 0) {
          setSelectedVariant(response.data.variants[0])
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  const addToCart = async () => {
    if (!selectedVariant) return

    try {
      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: getSessionId(),
          productVariantId: selectedVariant.variant.id,
          quantity: 1
        })
      })

      alert('Added to cart!')
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!productData) return <div>Product not found</div>

  return (
    <div>
      <h1>{productData.product.name}</h1>
      <p>{productData.product.description}</p>

      {/* Images */}
      <div>
        {productData.images.map(image => (
          <img key={image.id} src={image.url} alt={image.altText} />
        ))}
      </div>

      {/* Variant Selection */}
      <div>
        {productData.variants.map(variant => (
          <button
            key={variant.variant.id}
            onClick={() => setSelectedVariant(variant)}
          >
            {variant.attributes.map(attr => attr.value.value).join(' / ')}
            - ${variant.variant.price}
          </button>
        ))}
      </div>

      {/* Add to Cart */}
      {selectedVariant && (
        <div>
          <p>Price: ${selectedVariant.variant.price}</p>
          <p>In Stock: {selectedVariant.variant.quantityInStock}</p>
          <button onClick={addToCart}>Add to Cart</button>
        </div>
      )}
    </div>
  )
}
```

---

## Complete Example: Building a Checkout Flow

```typescript
import { useState } from 'react'

export function CheckoutPage() {
  const [cart, setCart] = useState(null)
  const [shippingAddress, setShippingAddress] = useState(null)
  const [shippingMethod, setShippingMethod] = useState(null)
  const [shippingOptions, setShippingOptions] = useState([])
  const [discountCode, setDiscountCode] = useState('')

  // Step 1: Load cart
  useEffect(() => {
    const loadCart = async () => {
      const response = await apiRequest(`/cart?sessionId=${getSessionId()}`)
      setCart(response.data)
    }
    loadCart()
  }, [])

  // Step 2: Apply discount code
  const applyDiscount = async () => {
    try {
      const response = await apiRequest('/cart/discount', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: getSessionId(),
          code: discountCode
        })
      })
      setCart({ ...cart, cart: response.data })
      alert('Discount applied!')
    } catch (error) {
      alert('Invalid discount code')
    }
  }

  // Step 3: Get shipping options
  const loadShippingOptions = async (addressId: number) => {
    const response = await apiRequest('/orders/shipping-options', {
      method: 'POST',
      body: JSON.stringify({
        cartTotal: cart.cart.subtotal,
        shippingAddressId: addressId
      })
    })
    setShippingOptions(response.data)
  }

  // Step 4: Calculate totals
  const calculateTotals = async () => {
    if (!shippingAddress || !shippingMethod) return

    const response = await apiRequest('/cart/calculate', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: getSessionId(),
        shippingAddressId: shippingAddress.id,
        shippingMethodId: shippingMethod.id
      })
    })

    return response.data
  }

  // Step 5: Place order
  const placeOrder = async () => {
    try {
      const totals = await calculateTotals()

      const response = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId: getCurrentCustomerId(),
          shippingAddressId: shippingAddress.id,
          billingAddressId: shippingAddress.id,
          shippingMethodId: shippingMethod.id,
          items: cart.items.map(item => ({
            productVariantId: item.variant.id,
            quantity: item.item.quantity,
            unitPrice: item.variant.price
          })),
          sessionId: getSessionId()
        })
      })

      // Order placed successfully
      const order = response.data.order
      window.location.href = `/order-confirmation/${order.orderNumber}`
    } catch (error) {
      alert('Failed to place order')
    }
  }

  return (
    <div>
      {/* Cart Items */}
      <div>
        {cart?.items.map(item => (
          <div key={item.item.id}>
            {item.product.name} x {item.item.quantity}
            - ${item.item.unitPrice}
          </div>
        ))}
      </div>

      {/* Discount Code */}
      <div>
        <input
          value={discountCode}
          onChange={e => setDiscountCode(e.target.value)}
          placeholder="Discount code"
        />
        <button onClick={applyDiscount}>Apply</button>
      </div>

      {/* Shipping Address */}
      {/* ... address form ... */}

      {/* Shipping Method */}
      <div>
        {shippingOptions.map(option => (
          <button
            key={option.method.id}
            onClick={() => setShippingMethod(option.method)}
          >
            {option.method.displayName} - $
            {option.isFree ? '0.00' : option.cost}
          </button>
        ))}
      </div>

      {/* Place Order */}
      <button onClick={placeOrder}>Place Order</button>
    </div>
  )
}
```

---

## Best Practices

### 1. Session Management
Always include the session ID in cart and checkout requests to enable:
- Cart persistence across page reloads
- Campaign attribution
- Guest checkout tracking

```typescript
// Generate session ID once and reuse
const SESSION_KEY = 'draza_session_id'

function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}
```

### 2. Error Handling
Implement consistent error handling across all API requests:

```typescript
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Request failed')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}
```

### 3. Loading States
Always show loading states during API requests:

```typescript
const [loading, setLoading] = useState(false)

const handleAction = async () => {
  setLoading(true)
  try {
    await apiRequest('/endpoint')
  } finally {
    setLoading(false)
  }
}
```

### 4. Optimistic Updates
For cart operations, update UI optimistically for better UX:

```typescript
const addToCart = async (variantId: number, quantity: number) => {
  // Optimistically update UI
  setCartItemCount(prev => prev + quantity)

  try {
    await apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: getSessionId(),
        productVariantId: variantId,
        quantity
      })
    })
  } catch (error) {
    // Revert on error
    setCartItemCount(prev => prev - quantity)
    alert('Failed to add to cart')
  }
}
```

### 5. Campaign Tracking Integration
Implement campaign tracking on initial page load:

```typescript
// In your root layout or App component
useEffect(() => {
  const trackCampaign = async () => {
    const params = new URLSearchParams(window.location.search)
    const utmCampaign = params.get('utm_campaign')

    if (utmCampaign) {
      try {
        await apiRequest('/analytics/campaigns/track-visit', {
          method: 'POST',
          body: JSON.stringify({
            trackingCode: utmCampaign,
            sessionId: getSessionId(),
            landingPage: window.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            deviceType: detectDeviceType()
          })
        })
      } catch (error) {
        console.error('Campaign tracking failed:', error)
      }
    }
  }

  trackCampaign()
}, [])
```

### 6. Image Optimization
Product images are served from Supabase Storage. Consider implementing:
- Lazy loading for product images
- Responsive image sizes
- Placeholder/blur images during load

```typescript
<img
  src={product.images[0]?.url}
  alt={product.images[0]?.altText || product.name}
  loading="lazy"
  className="product-image"
/>
```

### 7. Price Formatting
Always format prices consistently:

```typescript
function formatPrice(price: string | number): string {
  const amount = typeof price === 'string' ? parseFloat(price) : price
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Usage
<span>{formatPrice(product.price)}</span>
```

---

## TypeScript Types

Here are the essential TypeScript types for building your storefront:

```typescript
// Products
interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  categoryId: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ProductVariant {
  id: number
  productId: number
  sku: string
  price: string
  quantityInStock: number
  createdAt: string
  updatedAt: string
}

interface Attribute {
  id: number
  name: string
}

interface AttributeValue {
  id: number
  attributeId: number
  value: string
}

interface ProductImage {
  id: number
  productId: number
  url: string
  altText: string | null
  type: 'thumbnail' | 'gallery' | 'hero' | 'zoom'
  position: number
  createdAt: string
  updatedAt: string
}

// Categories & Collections
interface Category {
  id: number
  name: string
  slug: string
  parentId: number | null
  createdAt: string
  updatedAt: string
}

interface Collection {
  id: number
  name: string
  slug: string
  description: string | null
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

// Cart
interface Cart {
  id: number
  sessionId: string
  customerId: number | null
  status: 'active' | 'abandoned' | 'converted' | 'merged'
  subtotal: string
  discountTotal: string
  taxTotal: string
  shippingTotal: string
  total: string
  discountCodeId: number | null
  expiresAt: string
  lastActivityAt: string
  createdAt: string
  updatedAt: string
}

interface CartItem {
  id: number
  cartId: number
  productVariantId: number
  quantity: number
  unitPrice: string
  createdAt: string
  updatedAt: string
}

// Customer
interface Customer {
  id: number
  userId: string | null
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  isGuest: boolean
  acquisitionCampaignId: number | null
  createdAt: string
}

interface Address {
  id: number
  customerId: number
  firstName: string
  lastName: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Orders
interface Order {
  id: number
  orderNumber: string
  customerId: number
  shippingAddressId: number
  billingAddressId: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: string
  discountAmount: string
  tax: string
  shippingCost: string
  total: string
  taxJurisdictionId: number | null
  taxJurisdictionName: string | null
  taxRate: string | null
  shippingMethodId: number | null
  shippingMethodName: string | null
  shippingCarrier: string | null
  estimatedDeliveryDate: string | null
  campaignId: number | null
  visitId: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface OrderItem {
  id: number
  orderId: number
  productVariantId: number
  quantity: number
  unitPrice: string
  totalPrice: string
  createdAt: string
}

// Shipping
interface ShippingMethod {
  id: number
  name: string
  displayName: string
  description: string | null
  carrier: 'usps' | 'fedex' | 'ups' | 'dhl' | 'other'
  calculationType: 'flat_rate' | 'weight_based' | 'price_tier' | 'free_threshold'
  baseRate: string
  freeShippingThreshold: string | null
  estimatedDaysMin: number
  estimatedDaysMax: number
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

// Discounts
interface Discount {
  id: number
  name: string
  description: string | null
  discountType: 'percentage' | 'fixed_amount'
  value: string
  scope: 'store_wide' | 'collection' | 'product' | 'variant' | 'code'
  isActive: boolean
  priority: number
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  updatedAt: string
}

interface DiscountCode {
  id: number
  discountId: number
  code: string
  usageLimit: number | null
  usageCount: number
  minimumOrderValue: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

---

## API Response Examples

### Error Scenarios

#### Product Not Found
```json
{
  "success": false,
  "error": "Product not found"
}
```

#### Invalid Discount Code
```json
{
  "success": false,
  "error": "Invalid or expired discount code"
}
```

#### Out of Stock
```json
{
  "success": false,
  "error": "Product variant is out of stock"
}
```

#### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "quantity": "Must be greater than 0"
  }
}
```

---

## Conclusion

This API reference covers all the essential endpoints needed to build a fully functional ecommerce storefront. The backend provides:

- Complete product catalog with variants and attributes
- Shopping cart with session persistence
- Customer accounts and guest checkout
- Order management with automatic tax and shipping calculation
- Discount code system
- Campaign tracking and attribution

For additional features or custom endpoints, refer to the backend documentation or reach out to the development team.

**Happy coding!**
