import { createFileRoute } from '@tanstack/react-router'
import {
  DocsLayout,
  DocHeading,
  DocSubheading,
  DocH3,
  DocParagraph,
  DocCode,
  DocCodeBlock,
} from '~/components/docs-layout'

export const Route = createFileRoute('/dev/getting-started/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Getting Started</DocHeading>
      <DocParagraph>
        Learn the fundamentals of working with the Draza Ecommerce API to build modern storefronts.
      </DocParagraph>

      <DocSubheading id="base-url">Base URL</DocSubheading>
      <DocParagraph>
        All API requests should be made to the base URL:
      </DocParagraph>
      <DocCodeBlock>http://localhost:3000</DocCodeBlock>
      <DocParagraph>
        For production, replace with your deployed backend URL.
      </DocParagraph>

      <DocSubheading id="response-format">Response Format</DocSubheading>
      <DocParagraph>
        All API responses follow a consistent JSON structure:
      </DocParagraph>
      <DocH3>Success Response</DocH3>
      <DocCodeBlock language="json">{`{
  "success": true,
  "data": {
    // Your resource data
  }
}`}</DocCodeBlock>

      <DocH3>Error Response</DocH3>
      <DocCodeBlock language="json">{`{
  "success": false,
  "error": "Error message describing what went wrong"
}`}</DocCodeBlock>

      <DocSubheading id="session-management">Session Management</DocSubheading>
      <DocParagraph>
        The API uses session IDs to track shopping carts and campaign attribution. Generate a
        session ID using <DocCode>crypto.randomUUID()</DocCode> and store it in localStorage:
      </DocParagraph>
      <DocCodeBlock language="javascript">{`// Generate or retrieve session ID
function getSessionId() {
  let sessionId = localStorage.getItem('sessionId')

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('sessionId', sessionId)
  }

  return sessionId
}

// Use in API calls
const sessionId = getSessionId()`}</DocCodeBlock>

      <DocSubheading id="making-requests">Making API Requests</DocSubheading>
      <DocParagraph>
        Here's a reusable helper function for making API requests:
      </DocParagraph>
      <DocCodeBlock language="javascript">{`const API_URL = 'http://localhost:3000'

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(\`\${API_URL}\${endpoint}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

// Example usage
const products = await apiRequest('/products/active')
console.log(products.data)`}</DocCodeBlock>

      <DocSubheading id="cors">CORS Configuration</DocSubheading>
      <DocParagraph>
        The backend accepts requests from:
      </DocParagraph>
      <ul className="list-disc list-inside mb-4 text-muted-foreground space-y-1">
        <li><DocCode>http://localhost:3001</DocCode></li>
        <li><DocCode>http://localhost:5173</DocCode></li>
      </ul>
      <DocParagraph>
        Credentials are enabled for session cookie management.
      </DocParagraph>

      <DocSubheading id="common-patterns">Common Patterns</DocSubheading>

      <DocH3 id="listing-products">1. Listing Products</DocH3>
      <DocCodeBlock language="javascript">{`// Get all active products
const response = await apiRequest('/products/active')
const products = response.data

// Filter by category
const categoryProducts = await apiRequest(
  '/products/active?categoryId=5'
)

// Search products
const searchResults = await apiRequest(
  '/products/active?search=shirt'
)`}</DocCodeBlock>

      <DocH3 id="product-details">2. Getting Product Details</DocH3>
      <DocCodeBlock language="javascript">{`// Get product by slug
const response = await apiRequest(
  '/products/slug/classic-t-shirt'
)
const { product, category, images } = response.data

// Get product with variants
const variantsResponse = await apiRequest(
  '/products/slug/classic-t-shirt/variants'
)
const { product, variants } = variantsResponse.data`}</DocCodeBlock>

      <DocH3 id="cart-management">3. Managing Shopping Cart</DocH3>
      <DocCodeBlock language="javascript">{`const sessionId = getSessionId()

// Get or create cart
const cart = await apiRequest(\`/cart?sessionId=\${sessionId}\`)

// Add item to cart
await apiRequest('/cart/items', {
  method: 'POST',
  body: JSON.stringify({
    sessionId,
    productVariantId: 1,
    quantity: 2
  })
})

// Update item quantity
await apiRequest('/cart/items/123', {
  method: 'PUT',
  body: JSON.stringify({ quantity: 3 })
})

// Remove item
await apiRequest('/cart/items/123', {
  method: 'DELETE'
})`}</DocCodeBlock>

      <DocH3 id="checkout-flow">4. Checkout Flow</DocH3>
      <DocCodeBlock language="javascript">{`// 1. Get shipping methods
const shippingMethods = await apiRequest(
  '/orders/shipping-methods'
)

// 2. Calculate cart totals
const totals = await apiRequest('/cart/calculate', {
  method: 'POST',
  body: JSON.stringify({
    sessionId: getSessionId(),
    shippingAddressId: 1,
    shippingMethodId: 1
  })
})

// 3. Place order
const order = await apiRequest('/orders', {
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
})`}</DocCodeBlock>

      <DocSubheading id="error-handling">Error Handling</DocSubheading>
      <DocParagraph>
        Always wrap API calls in try-catch blocks:
      </DocParagraph>
      <DocCodeBlock language="javascript">{`async function addToCart(variantId, quantity) {
  try {
    const response = await apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: getSessionId(),
        productVariantId: variantId,
        quantity
      })
    })

    return response.data
  } catch (error) {
    console.error('Failed to add to cart:', error)
    // Show error to user
    alert(error.message)
  }
}`}</DocCodeBlock>

      <DocSubheading id="typescript">TypeScript Support</DocSubheading>
      <DocParagraph>
        For TypeScript projects, define interfaces for API responses:
      </DocParagraph>
      <DocCodeBlock language="typescript">{`interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  categoryId: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// Type-safe API request
async function getProducts(): Promise<Product[]> {
  const response = await apiRequest<ApiResponse<Product[]>>(
    '/products/active'
  )
  return response.data
}`}</DocCodeBlock>

      <DocSubheading id="next-steps">Next Steps</DocSubheading>
      <DocParagraph>
        Now that you understand the basics, explore the detailed API reference:
      </DocParagraph>
      <ul className="list-disc list-inside mb-4 text-muted-foreground space-y-2">
        <li><a href="/dev/api-reference/products" className="text-primary hover:underline">Products API Reference</a></li>
        <li><a href="/dev/api-reference/cart" className="text-primary hover:underline">Shopping Cart API Reference</a></li>
        <li><a href="/dev/api-reference/customers" className="text-primary hover:underline">Customers API Reference</a></li>
        <li><a href="/dev/api-reference/orders" className="text-primary hover:underline">Orders API Reference</a></li>
      </ul>
    </DocsLayout>
  )
}
