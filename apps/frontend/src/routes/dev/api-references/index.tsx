import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { useState } from 'react'

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
}

const ENDPOINTS: Record<string, Endpoint[]> = {
  'Products & Catalog': [
    {
      method: 'GET',
      path: '/products/active',
      params: ['categoryId?', 'search?'],
      description: 'List all active products',
      example: '/products/active?categoryId=5&search=shirt',
    },
    {
      method: 'GET',
      path: '/products/slug/:slug',
      description: 'Get product details by slug',
      example: '/products/slug/classic-t-shirt',
    },
    {
      method: 'GET',
      path: '/products/slug/:slug/variants',
      description: 'Get product with all variants',
      example: '/products/slug/classic-t-shirt/variants',
    },
    {
      method: 'GET',
      path: '/products/:id/availability',
      description: 'Check product stock availability',
    },
  ],
  Categories: [
    {
      method: 'GET',
      path: '/products/categories/tree',
      description: 'Get category hierarchy tree',
    },
    {
      method: 'GET',
      path: '/products/categories/slug/:slug',
      description: 'Get category by slug',
      example: '/products/categories/slug/t-shirts',
    },
    {
      method: 'GET',
      path: '/products/categories/:id/breadcrumb',
      description: 'Get category breadcrumb path',
    },
  ],
  Collections: [
    {
      method: 'GET',
      path: '/products/collections/active',
      description: 'Get all active collections',
    },
    {
      method: 'GET',
      path: '/products/collections/slug/:slug',
      description: 'Get collection with products',
      example: '/products/collections/slug/summer-sale',
    },
  ],
  'Shopping Cart': [
    {
      method: 'GET',
      path: '/cart',
      params: ['sessionId', 'customerId?'],
      description: 'Get or create cart',
      example: '/cart?sessionId=abc-123',
    },
    {
      method: 'POST',
      path: '/cart/items',
      body: ['sessionId', 'productVariantId', 'quantity'],
      description: 'Add item to cart',
    },
    {
      method: 'PUT',
      path: '/cart/items/:itemId',
      body: ['quantity'],
      description: 'Update item quantity',
    },
    {
      method: 'DELETE',
      path: '/cart/items/:itemId',
      description: 'Remove item from cart',
    },
    {
      method: 'DELETE',
      path: '/cart/clear',
      params: ['sessionId'],
      description: 'Clear entire cart',
    },
    {
      method: 'POST',
      path: '/cart/calculate',
      body: ['sessionId', 'shippingAddressId', 'shippingMethodId'],
      description: 'Calculate totals with tax & shipping',
    },
  ],
  'Discount Codes': [
    {
      method: 'POST',
      path: '/cart/discount',
      body: ['sessionId', 'code'],
      description: 'Apply discount code to cart',
    },
    {
      method: 'DELETE',
      path: '/cart/discount',
      params: ['sessionId'],
      description: 'Remove discount from cart',
    },
    {
      method: 'POST',
      path: '/discounts/validate-code',
      body: ['code', 'cartTotal'],
      description: 'Validate discount code',
    },
  ],
  Customers: [
    {
      method: 'POST',
      path: '/customers',
      body: ['firstName', 'lastName', 'email', 'phoneNumber?'],
      description: 'Create customer account',
    },
    {
      method: 'POST',
      path: '/customers/guest',
      body: ['email', 'firstName?', 'lastName?'],
      description: 'Create guest customer',
    },
    {
      method: 'GET',
      path: '/customers/:id',
      description: 'Get customer details',
    },
    {
      method: 'GET',
      path: '/customers/email/:email',
      description: 'Find customer by email',
    },
    {
      method: 'GET',
      path: '/customers/:id/stats',
      description: 'Get customer order statistics',
    },
  ],
  Addresses: [
    {
      method: 'GET',
      path: '/customers/:customerId/addresses/all',
      description: 'Get all customer addresses',
    },
    {
      method: 'GET',
      path: '/customers/:customerId/addresses/default',
      description: 'Get default address',
    },
    {
      method: 'POST',
      path: '/customers/:customerId/addresses',
      body: ['firstName', 'lastName', 'street', 'city', 'state', 'postalCode', 'country', 'isDefault?'],
      description: 'Create new address',
    },
    {
      method: 'PUT',
      path: '/customers/addresses/:addressId',
      body: ['street?', 'city?', 'state?', 'postalCode?', 'country?'],
      description: 'Update address',
    },
    {
      method: 'PUT',
      path: '/customers/:customerId/addresses/:addressId/set-default',
      description: 'Set default address',
    },
  ],
  'Checkout & Orders': [
    {
      method: 'GET',
      path: '/orders/shipping-methods',
      description: 'Get available shipping methods',
    },
    {
      method: 'POST',
      path: '/orders/shipping-options',
      body: ['cartTotal', 'shippingAddressId'],
      description: 'Get shipping options for cart',
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
    },
    {
      method: 'GET',
      path: '/orders/customer/:customerId',
      description: 'Get customer order history',
    },
    {
      method: 'GET',
      path: '/orders/:id/details',
      description: 'Get order with full details',
    },
    {
      method: 'GET',
      path: '/orders/number/:orderNumber',
      description: 'Get order by order number',
      example: '/orders/number/ORD-20250101-0001',
    },
  ],
  'Campaign Tracking': [
    {
      method: 'POST',
      path: '/analytics/campaigns/track-visit',
      body: ['trackingCode', 'sessionId', 'landingPage', 'referrer?', 'userAgent?', 'deviceType?'],
      description: 'Track campaign visit (from UTM params)',
    },
  ],
}

function RouteComponent() {
  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(ENDPOINTS)[0])
  const [searchQuery, setSearchQuery] = useState('')

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
          Fast lookup for all storefront API endpoints
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
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {endpoint.path}
                    </code>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card className="mt-8">
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

      {/* Quick Start */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-2">1. Display Products on Homepage</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              GET {API_BASE}/products/active
            </code>
          </div>

          <div>
            <p className="font-semibold mb-2">2. Add Item to Cart</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              POST {API_BASE}/cart/items
              <br />
              Body: {JSON.stringify({ sessionId: 'uuid', productVariantId: 1, quantity: 2 })}
            </code>
          </div>

          <div>
            <p className="font-semibold mb-2">3. Place Order</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              POST {API_BASE}/orders
              <br />
              Body: {JSON.stringify({ customerId: 1, shippingAddressId: 1, billingAddressId: 1, shippingMethodId: 1, items: [] })}
            </code>
          </div>

          <div className="pt-2 border-t">
            <p className="text-muted-foreground">
              For detailed documentation with examples, see{' '}
              <a href="/dev/guides/storefront-api-reference.md" className="text-primary hover:underline">
                Storefront API Reference Guide
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
