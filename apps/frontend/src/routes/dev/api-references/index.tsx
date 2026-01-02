import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export const Route = createFileRoute('/dev/api-references/')({
  component: RouteComponent,
})

const API_BASE = 'http://localhost:3000'

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  params?: string[]
  body?: string[]
  description: string
  example?: string
  response?: string
}

const ENDPOINTS: Record<string, Endpoint[]> = {
  'Products & Catalog': [
    {
      method: 'GET',
      path: '/products/active',
      params: ['categoryId?', 'search?'],
      description: 'List all active products',
      example: '/products/active?categoryId=5&search=shirt',
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Classic Cotton T-Shirt",
      "slug": "classic-cotton-t-shirt",
      "description": "Comfortable everyday tee",
      "categoryId": 5,
      "isActive": true
    }
  ]
}`,
    },
    {
      method: 'GET',
      path: '/products/slug/:slug',
      description: 'Get product details by slug',
      example: '/products/slug/classic-t-shirt',
      response: `{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "name": "Classic Cotton T-Shirt",
      "slug": "classic-cotton-t-shirt"
    },
    "category": {
      "id": 5,
      "name": "T-Shirts"
    },
    "images": [
      {
        "id": 1,
        "url": "https://...",
        "altText": "Front view",
        "type": "thumbnail"
      }
    ]
  }
}`,
    },
    {
      method: 'GET',
      path: '/products/slug/:slug/variants',
      description: 'Get product with all variants',
      example: '/products/slug/classic-t-shirt/variants',
      response: `{
  "success": true,
  "data": {
    "product": { "id": 1, "name": "Classic T-Shirt" },
    "variants": [
      {
        "variant": {
          "id": 1,
          "sku": "SHIRT-BLK-SM",
          "price": "29.99",
          "quantityInStock": 50
        },
        "attributes": [
          {
            "attribute": { "id": 1, "name": "Color" },
            "value": { "id": 1, "value": "Black" }
          }
        ]
      }
    ]
  }
}`,
    },
    {
      method: 'GET',
      path: '/products/:id/availability',
      description: 'Check product stock availability',
      response: `{
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
}`,
    },
  ],
  Categories: [
    {
      method: 'GET',
      path: '/products/categories/tree',
      description: 'Get category hierarchy tree',
      response: `{
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
        }
      ]
    }
  ]
}`,
    },
    {
      method: 'GET',
      path: '/products/categories/slug/:slug',
      description: 'Get category by slug',
      example: '/products/categories/slug/t-shirts',
      response: `{
  "success": true,
  "data": {
    "id": 5,
    "name": "T-Shirts",
    "slug": "t-shirts",
    "parentId": 1
  }
}`,
    },
    {
      method: 'GET',
      path: '/products/categories/:id/breadcrumb',
      description: 'Get category breadcrumb path',
      response: `{
  "success": true,
  "data": [
    { "id": 1, "name": "Clothing", "slug": "clothing" },
    { "id": 5, "name": "T-Shirts", "slug": "t-shirts" }
  ]
}`,
    },
  ],
  Collections: [
    {
      method: 'GET',
      path: '/products/collections/active',
      description: 'Get all active collections',
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Summer Sale",
      "slug": "summer-sale",
      "description": "Hot deals",
      "isActive": true
    }
  ]
}`,
    },
    {
      method: 'GET',
      path: '/products/collections/slug/:slug',
      description: 'Get collection with products',
      example: '/products/collections/slug/summer-sale',
      response: `{
  "success": true,
  "data": {
    "collection": {
      "id": 1,
      "name": "Summer Sale"
    },
    "products": [
      {
        "product": { "id": 1, "name": "Classic T-Shirt" },
        "position": 1
      }
    ]
  }
}`,
    },
  ],
  'Shopping Cart': [
    {
      method: 'GET',
      path: '/cart',
      params: ['sessionId', 'customerId?'],
      description: 'Get or create cart',
      example: '/cart?sessionId=abc-123',
      response: `{
  "success": true,
  "data": {
    "cart": {
      "id": 1,
      "sessionId": "abc-123",
      "status": "active",
      "subtotal": "59.98",
      "total": "59.98"
    },
    "items": [
      {
        "item": {
          "id": 1,
          "productVariantId": 1,
          "quantity": 2,
          "unitPrice": "29.99"
        },
        "variant": { "sku": "SHIRT-BLK-SM" },
        "product": { "name": "Classic T-Shirt" }
      }
    ]
  }
}`,
    },
    {
      method: 'POST',
      path: '/cart/items',
      body: ['sessionId', 'productVariantId', 'quantity'],
      description: 'Add item to cart',
      response: `{
  "success": true,
  "data": {
    "item": {
      "id": 1,
      "quantity": 2,
      "unitPrice": "29.99"
    },
    "cart": {
      "subtotal": "59.98"
    }
  }
}`,
    },
    {
      method: 'PUT',
      path: '/cart/items/:itemId',
      body: ['quantity'],
      description: 'Update item quantity',
      response: `{
  "success": true,
  "data": {
    "item": { "id": 1, "quantity": 3 },
    "cart": { "subtotal": "89.97" }
  }
}`,
    },
    {
      method: 'DELETE',
      path: '/cart/items/:itemId',
      description: 'Remove item from cart',
      response: `{
  "success": true,
  "message": "Item removed"
}`,
    },
    {
      method: 'DELETE',
      path: '/cart/clear',
      params: ['sessionId'],
      description: 'Clear entire cart',
      response: `{
  "success": true,
  "message": "Cart cleared"
}`,
    },
    {
      method: 'POST',
      path: '/cart/calculate',
      body: ['sessionId', 'shippingAddressId', 'shippingMethodId'],
      description: 'Calculate totals with tax & shipping',
      response: `{
  "success": true,
  "data": {
    "subtotal": "89.97",
    "discountTotal": "17.99",
    "taxTotal": "6.48",
    "shippingTotal": "5.99",
    "total": "84.45"
  }
}`,
    },
  ],
  'Discount Codes': [
    {
      method: 'POST',
      path: '/cart/discount',
      body: ['sessionId', 'code'],
      description: 'Apply discount code to cart',
      response: `{
  "success": true,
  "data": {
    "subtotal": "89.97",
    "discountTotal": "17.99",
    "total": "71.98"
  }
}`,
    },
    {
      method: 'DELETE',
      path: '/cart/discount',
      params: ['sessionId'],
      description: 'Remove discount from cart',
      response: `{
  "success": true,
  "data": { "discountTotal": "0.00" }
}`,
    },
    {
      method: 'POST',
      path: '/discounts/validate-code',
      body: ['code', 'cartTotal'],
      description: 'Validate discount code',
      response: `{
  "success": true,
  "data": {
    "isValid": true,
    "discount": {
      "name": "Summer Sale",
      "discountType": "percentage",
      "value": "0.20"
    },
    "appliedAmount": "15.00"
  }
}`,
    },
  ],
  Customers: [
    {
      method: 'POST',
      path: '/customers',
      body: ['firstName', 'lastName', 'email', 'phoneNumber?'],
      description: 'Create customer account',
      response: `{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "isGuest": false
  }
}`,
    },
    {
      method: 'POST',
      path: '/customers/guest',
      body: ['email', 'firstName?', 'lastName?'],
      description: 'Create guest customer',
      response: `{
  "success": true,
  "data": {
    "id": 2,
    "email": "guest@example.com",
    "isGuest": true
  }
}`,
    },
    {
      method: 'GET',
      path: '/customers/:id',
      description: 'Get customer details',
      response: `{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}`,
    },
    {
      method: 'GET',
      path: '/customers/email/:email',
      description: 'Find customer by email',
      response: `{
  "success": true,
  "data": {
    "id": 1,
    "email": "john@example.com"
  }
}`,
    },
    {
      method: 'GET',
      path: '/customers/:id/stats',
      description: 'Get customer order statistics',
      response: `{
  "success": true,
  "data": {
    "totalOrders": 12,
    "totalSpent": "1248.76",
    "averageOrderValue": "104.06"
  }
}`,
    },
  ],
  Addresses: [
    {
      method: 'GET',
      path: '/customers/:customerId/addresses/all',
      description: 'Get all customer addresses',
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "isDefault": true
    }
  ]
}`,
    },
    {
      method: 'GET',
      path: '/customers/:customerId/addresses/default',
      description: 'Get default address',
      response: `{
  "success": true,
  "data": {
    "id": 1,
    "street": "123 Main St",
    "isDefault": true
  }
}`,
    },
    {
      method: 'POST',
      path: '/customers/:customerId/addresses',
      body: ['firstName', 'lastName', 'street', 'city', 'state', 'postalCode', 'country', 'isDefault?'],
      description: 'Create new address',
      response: `{
  "success": true,
  "data": {
    "id": 1,
    "street": "123 Main St",
    "city": "New York"
  }
}`,
    },
    {
      method: 'PUT',
      path: '/customers/addresses/:addressId',
      body: ['street?', 'city?', 'state?', 'postalCode?', 'country?'],
      description: 'Update address',
      response: `{
  "success": true,
  "data": { "id": 1 }
}`,
    },
    {
      method: 'PUT',
      path: '/customers/:customerId/addresses/:addressId/set-default',
      description: 'Set default address',
      response: `{
  "success": true,
  "data": { "isDefault": true }
}`,
    },
  ],
  'Checkout & Orders': [
    {
      method: 'GET',
      path: '/orders/shipping-methods',
      description: 'Get available shipping methods',
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "displayName": "Standard Shipping",
      "baseRate": "5.99",
      "estimatedDaysMin": 5,
      "estimatedDaysMax": 7
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/orders/shipping-options',
      body: ['cartTotal', 'shippingAddressId'],
      description: 'Get shipping options for cart',
      response: `{
  "success": true,
  "data": [
    {
      "method": { "displayName": "Standard Shipping" },
      "cost": "0.00",
      "isFree": true
    }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/orders',
      body: [
        'customerId',
        'shippingAddressId',
        'billingAddressId',
        'shippingMethodId',
        'items[]',
        'sessionId?',
        'discountCodeId?',
        'notes?',
      ],
      description: 'Place order (tax & shipping auto-calculated)',
      response: `{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "orderNumber": "ORD-20250101-0001",
      "status": "pending",
      "subtotal": "59.98",
      "tax": "5.40",
      "shippingCost": "5.99",
      "total": "71.37"
    },
    "items": [
      {
        "id": 1,
        "productVariantId": 1,
        "quantity": 2,
        "unitPrice": "29.99"
      }
    ]
  }
}`,
    },
    {
      method: 'GET',
      path: '/orders/customer/:customerId',
      description: 'Get customer order history',
      response: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-20250101-0001",
      "status": "delivered",
      "total": "71.37"
    }
  ]
}`,
    },
    {
      method: 'GET',
      path: '/orders/:id/details',
      description: 'Get order with full details',
      response: `{
  "success": true,
  "data": {
    "order": { "orderNumber": "ORD-20250101-0001" },
    "items": [...],
    "customer": {...},
    "shippingAddress": {...}
  }
}`,
    },
    {
      method: 'GET',
      path: '/orders/number/:orderNumber',
      description: 'Get order by order number',
      example: '/orders/number/ORD-20250101-0001',
      response: `{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-20250101-0001",
    "status": "shipped"
  }
}`,
    },
  ],
  'Campaign Tracking': [
    {
      method: 'POST',
      path: '/analytics/campaigns/track-visit',
      body: ['trackingCode', 'sessionId', 'landingPage', 'referrer?', 'userAgent?', 'deviceType?'],
      description: 'Track campaign visit (from UTM params)',
      response: `{
  "success": true,
  "data": {
    "visit": {
      "id": 123,
      "campaignId": 5,
      "sessionId": "abc-123",
      "visitedAt": "2025-01-01T12:00:00Z"
    }
  }
}`,
    },
  ],
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-muted rounded transition-colors"
      title="Copy endpoint"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )
}

function RouteComponent() {
  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(ENDPOINTS)[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedEndpoint, setExpandedEndpoint] = useState<number | null>(null)

  const filteredEndpoints = Object.entries(ENDPOINTS).reduce(
    (acc, [category, endpoints]) => {
      const filtered = endpoints.filter(
        (endpoint) =>
          endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          endpoint.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      if (filtered.length > 0) {
        acc[category] = filtered
      }
      return acc
    },
    {} as Record<string, Endpoint[]>
  )

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">API Quick Reference</h1>
        <p className="text-muted-foreground mb-4">
          Fast lookup for all storefront API endpoints with response examples
        </p>
        <p className="text-sm text-muted-foreground">
          Base URL: <code className="bg-muted px-2 py-1 rounded text-xs">{API_BASE}</code>
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search endpoints..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(filteredEndpoints).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        {filteredEndpoints[selectedCategory]?.map((endpoint, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant={
                        endpoint.method === 'GET'
                          ? 'default'
                          : endpoint.method === 'POST'
                            ? 'secondary'
                            : endpoint.method === 'PUT'
                              ? 'outline'
                              : 'destructive'
                      }
                      className="font-mono"
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">
                      {endpoint.path}
                    </code>
                    <CopyButton text={`${API_BASE}${endpoint.path}`} />
                  </div>
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Query Params */}
              {endpoint.params && endpoint.params.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold mb-1">Query Parameters:</p>
                  <div className="flex flex-wrap gap-1">
                    {endpoint.params.map((param) => (
                      <code key={param} className="text-xs bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">
                        {param}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Body Params */}
              {endpoint.body && endpoint.body.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold mb-1">Request Body:</p>
                  <div className="flex flex-wrap gap-1">
                    {endpoint.body.map((param) => (
                      <code key={param} className="text-xs bg-green-100 dark:bg-green-950 px-2 py-0.5 rounded">
                        {param}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Example */}
              {endpoint.example && (
                <div className="mt-2">
                  <p className="text-xs font-semibold mb-1">Example:</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block">
                    {API_BASE}
                    {endpoint.example}
                  </code>
                </div>
              )}

              {/* Response */}
              {endpoint.response && (
                <div className="mt-3">
                  <button
                    onClick={() => setExpandedEndpoint(expandedEndpoint === index ? null : index)}
                    className="text-xs font-semibold mb-1 text-primary hover:underline"
                  >
                    {expandedEndpoint === index ? '▼' : '▶'} Response Example
                  </button>
                  {expandedEndpoint === index && (
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      <code>{endpoint.response}</code>
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TypeScript Types */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">TypeScript Types</CardTitle>
            <CopyButton text={`// Product Types
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
}

interface ProductImage {
  id: number
  productId: number
  url: string
  altText: string | null
  type: 'thumbnail' | 'gallery' | 'hero' | 'zoom'
  position: number
}

// Category & Collection Types
interface Category {
  id: number
  name: string
  slug: string
  parentId: number | null
}

interface Collection {
  id: number
  name: string
  slug: string
  description: string | null
  isActive: boolean
  displayOrder: number
}

// Cart Types
interface Cart {
  id: number
  sessionId: string
  customerId: number | null
  status: 'active' | 'abandoned' | 'converted'
  subtotal: string
  discountTotal: string
  taxTotal: string
  shippingTotal: string
  total: string
}

interface CartItem {
  id: number
  cartId: number
  productVariantId: number
  quantity: number
  unitPrice: string
}

// Customer Types
interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  isGuest: boolean
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
}

// Order Types
interface Order {
  id: number
  orderNumber: string
  customerId: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: string
  discountAmount: string
  tax: string
  shippingCost: string
  total: string
  createdAt: string
}

interface OrderItem {
  id: number
  orderId: number
  productVariantId: number
  quantity: number
  unitPrice: string
  totalPrice: string
}

// Discount Types
interface Discount {
  id: number
  name: string
  discountType: 'percentage' | 'fixed_amount'
  value: string
  scope: 'store_wide' | 'collection' | 'product' | 'variant' | 'code'
  isActive: boolean
}

// API Response Types
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
}`} />
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
            <code>{`// Product Types
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
}

interface ProductImage {
  id: number
  productId: number
  url: string
  altText: string | null
  type: 'thumbnail' | 'gallery' | 'hero' | 'zoom'
  position: number
}

// Category & Collection Types
interface Category {
  id: number
  name: string
  slug: string
  parentId: number | null
}

interface Collection {
  id: number
  name: string
  slug: string
  description: string | null
  isActive: boolean
  displayOrder: number
}

// Cart Types
interface Cart {
  id: number
  sessionId: string
  customerId: number | null
  status: 'active' | 'abandoned' | 'converted'
  subtotal: string
  discountTotal: string
  taxTotal: string
  shippingTotal: string
  total: string
}

interface CartItem {
  id: number
  cartId: number
  productVariantId: number
  quantity: number
  unitPrice: string
}

// Customer Types
interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  isGuest: boolean
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
}

// Order Types
interface Order {
  id: number
  orderNumber: string
  customerId: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: string
  discountAmount: string
  tax: string
  shippingCost: string
  total: string
  createdAt: string
}

interface OrderItem {
  id: number
  orderId: number
  productVariantId: number
  quantity: number
  unitPrice: string
  totalPrice: string
}

// Discount Types
interface Discount {
  id: number
  name: string
  discountType: 'percentage' | 'fixed_amount'
  value: string
  scope: 'store_wide' | 'collection' | 'product' | 'variant' | 'code'
  isActive: boolean
}

// API Response Types
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
}`}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <code className="text-xs bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">param?</code>
            <span className="text-muted-foreground">Optional parameter</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded">items[]</code>
            <span className="text-muted-foreground">Array parameter</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-0.5 rounded">:id</code>
            <span className="text-muted-foreground">Path parameter (replace with actual value)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
