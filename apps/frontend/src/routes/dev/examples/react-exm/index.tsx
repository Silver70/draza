import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Copy, Check, FileCode } from 'lucide-react'

export const Route = createFileRoute('/dev/examples/react-exm/')({
  component: RouteComponent,
})

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
      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
      title="Copy code"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      )}
    </button>
  )
}

function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="my-6 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {title}
            </span>
          </div>
          <CopyButton text={code} />
        </div>
      )}
      <div className="relative">
        {!title && (
          <div className="absolute top-3 right-3 z-10">
            <CopyButton text={code} />
          </div>
        )}
        <pre className="overflow-auto p-4 text-sm max-h-125">
          <code className="text-gray-800 dark:text-gray-200 font-mono">{code}</code>
        </pre>
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function RouteComponent() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-3">React Examples</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Real-world React implementation examples for integrating with the Draza API
        </p>
      </div>

      {/* Product Listing */}
      <Section
        title="Product Listing"
        description="Display products with category filtering and search functionality"
      >
        <CodeBlock
          title="Product Listing Component"
          code={`import { useEffect, useState } from 'react'

function ProductListingPage() {
  const [products, setProducts] = useState([])
  const [categoryId, setCategoryId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [categoryId, searchQuery])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryId) params.append('categoryId', categoryId)
      if (searchQuery) params.append('search', searchQuery)

      const query = params.toString()
      const url = query
        ? \`http://localhost:3000/products/active?\${query}\`
        : 'http://localhost:3000/products/active'

      const response = await fetch(url)
      const data = await response.json()
      setProducts(data.data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}`}
        />

        <CodeBlock
          title="Product Detail Page with Variants"
          code={`import { useEffect, useState } from 'react'

function ProductDetailPage({ slug }) {
  const [productData, setProductData] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetch(\`http://localhost:3000/products/slug/\${slug}/variants\`)
      .then(res => res.json())
      .then(data => {
        setProductData(data.data)
        if (data.data.variants.length > 0) {
          setSelectedVariant(data.data.variants[0])
        }
      })
  }, [slug])

  const addToCart = async () => {
    if (!selectedVariant) return

    const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID()
    localStorage.setItem('sessionId', sessionId)

    try {
      await fetch('http://localhost:3000/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          productVariantId: selectedVariant.variant.id,
          quantity
        })
      })
      alert('Added to cart!')
    } catch (error) {
      alert('Failed to add to cart')
    }
  }

  if (!productData) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Images */}
      <div>
        {productData.images.map(img => (
          <img key={img.id} src={img.url} alt={img.altText} />
        ))}
      </div>

      {/* Product Info */}
      <div>
        <h1>{productData.product.name}</h1>
        <p>{productData.product.description}</p>

        {/* Variant Selection */}
        <div className="my-4">
          {productData.variants.map(variant => (
            <button
              key={variant.variant.id}
              onClick={() => setSelectedVariant(variant)}
              className={selectedVariant?.variant.id === variant.variant.id ? 'selected' : ''}
            >
              {variant.attributes.map(a => a.value.value).join(' / ')}
            </button>
          ))}
        </div>

        {/* Add to Cart */}
        {selectedVariant && (
          <div>
            <p>Price: \${selectedVariant.variant.price}</p>
            <p>In Stock: {selectedVariant.variant.quantityInStock}</p>

            <input
              type="number"
              min="1"
              max={selectedVariant.variant.quantityInStock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />

            <button onClick={addToCart}>Add to Cart</button>
          </div>
        )}
      </div>
    </div>
  )
}`}
        />
      </Section>

      {/* Shopping Cart */}
      <Section
        title="Shopping Cart"
        description="Manage cart items with quantity updates and removal"
      >
        <CodeBlock
          code={`import { useEffect, useState } from 'react'

function ShoppingCart() {
  const [cart, setCart] = useState(null)
  const sessionId = localStorage.getItem('sessionId') || crypto.randomUUID()

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    const response = await fetch(
      \`http://localhost:3000/cart?sessionId=\${sessionId}\`
    )
    const data = await response.json()
    setCart(data.data)
  }

  const updateQuantity = async (itemId, quantity) => {
    await fetch(\`http://localhost:3000/cart/items/\${itemId}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    })
    fetchCart()
  }

  const removeItem = async (itemId) => {
    await fetch(\`http://localhost:3000/cart/items/\${itemId}\`, {
      method: 'DELETE'
    })
    fetchCart()
  }

  const applyDiscount = async (code) => {
    try {
      await fetch('http://localhost:3000/cart/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code })
      })
      fetchCart()
    } catch (error) {
      alert('Invalid discount code')
    }
  }

  if (!cart) return <div>Loading...</div>

  return (
    <div>
      <h1>Shopping Cart</h1>

      {cart.items.map(({ item, variant, product }) => (
        <div key={item.id} className="cart-item">
          <h3>{product.name}</h3>
          <p>SKU: {variant.sku}</p>
          <p>Price: \${item.unitPrice}</p>

          <input
            type="number"
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
          />

          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}

      {/* Discount Code */}
      <div>
        <input
          type="text"
          placeholder="Discount code"
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyDiscount(e.target.value)
          }}
        />
      </div>

      {/* Cart Totals */}
      <div className="cart-totals">
        <p>Subtotal: \${cart.cart.subtotal}</p>
        {cart.cart.discountTotal !== '0.00' && (
          <p>Discount: -\${cart.cart.discountTotal}</p>
        )}
        <p className="font-bold">Total: \${cart.cart.total}</p>
      </div>

      <button onClick={() => window.location.href = '/checkout'}>
        Proceed to Checkout
      </button>
    </div>
  )
}`}
        />
      </Section>

      {/* Checkout */}
      <Section
        title="Checkout Flow"
        description="Complete checkout with shipping selection and order placement"
      >
        <CodeBlock
          code={`import { useEffect, useState } from 'react'

function CheckoutPage() {
  const [cart, setCart] = useState(null)
  const [shippingMethods, setShippingMethods] = useState([])
  const [selectedShipping, setSelectedShipping] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [shippingAddress, setShippingAddress] = useState(null)
  const [totals, setTotals] = useState(null)

  useEffect(() => {
    loadCheckoutData()
  }, [])

  const loadCheckoutData = async () => {
    const sessionId = localStorage.getItem('sessionId')

    // Load cart
    const cartRes = await fetch(\`http://localhost:3000/cart?sessionId=\${sessionId}\`)
    const cartData = await cartRes.json()
    setCart(cartData.data)

    // Load shipping methods
    const shippingRes = await fetch('http://localhost:3000/orders/shipping-methods')
    const shippingData = await shippingRes.json()
    setShippingMethods(shippingData.data)
  }

  const calculateTotals = async () => {
    if (!shippingAddress || !selectedShipping) return

    const sessionId = localStorage.getItem('sessionId')
    const response = await fetch('http://localhost:3000/cart/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        shippingAddressId: shippingAddress.id,
        shippingMethodId: selectedShipping.id
      })
    })
    const data = await response.json()
    setTotals(data.data)
  }

  useEffect(() => {
    if (shippingAddress && selectedShipping) {
      calculateTotals()
    }
  }, [shippingAddress, selectedShipping])

  const placeOrder = async () => {
    if (!customer || !shippingAddress || !selectedShipping) {
      alert('Please complete all fields')
      return
    }

    const sessionId = localStorage.getItem('sessionId')

    try {
      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          shippingAddressId: shippingAddress.id,
          billingAddressId: shippingAddress.id,
          shippingMethodId: selectedShipping.id,
          items: cart.items.map(({ item, variant }) => ({
            productVariantId: variant.id,
            quantity: item.quantity,
            unitPrice: variant.price
          })),
          sessionId
        })
      })

      const data = await response.json()

      if (data.success) {
        window.location.href = \`/order-confirmation/\${data.data.order.orderNumber}\`
      }
    } catch (error) {
      alert('Failed to place order')
    }
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Order Summary */}
      <div>
        <h2>Order Summary</h2>
        {cart?.items.map(({ item, product }) => (
          <div key={item.id}>
            {product.name} x {item.quantity} - \${item.unitPrice}
          </div>
        ))}

        {totals && (
          <div className="mt-4">
            <p>Subtotal: \${totals.subtotal}</p>
            <p>Shipping: \${totals.shippingTotal}</p>
            <p>Tax: \${totals.taxTotal}</p>
            <p className="font-bold">Total: \${totals.total}</p>
          </div>
        )}
      </div>

      {/* Checkout Form */}
      <div>
        <h2>Shipping Method</h2>
        {shippingMethods.map(method => (
          <button
            key={method.id}
            onClick={() => setSelectedShipping(method)}
            className={selectedShipping?.id === method.id ? 'selected' : ''}
          >
            {method.displayName} - \${method.baseRate}
            <br />
            <small>{method.description}</small>
          </button>
        ))}

        <button onClick={placeOrder} className="mt-4">
          Place Order
        </button>
      </div>
    </div>
  )
}`}
        />
      </Section>

      {/* Customer Management */}
      <Section
        title="Customer Management"
        description="Handle customer registration and guest checkout"
      >
        <CodeBlock
          title="Customer Registration"
          code={`async function registerCustomer(formData) {
  try {
    const response = await fetch('http://localhost:3000/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      })
    })

    const data = await response.json()

    if (data.success) {
      localStorage.setItem('customerId', data.data.id)
      return data.data
    }
  } catch (error) {
    console.error('Registration failed:', error)
    throw error
  }
}`}
        />

        <CodeBlock
          title="Guest Checkout"
          code={`async function createGuestCustomer(email) {
  try {
    const response = await fetch('http://localhost:3000/customers/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    const data = await response.json()

    if (data.success) {
      localStorage.setItem('customerId', data.data.id)
      return data.data
    }
  } catch (error) {
    console.error('Guest creation failed:', error)
    throw error
  }
}`}
        />

        <CodeBlock
          title="Address Management"
          code={`async function addAddress(customerId, addressData) {
  try {
    const response = await fetch(
      \`http://localhost:3000/customers/\${customerId}/addresses\`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: addressData.firstName,
          lastName: addressData.lastName,
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          postalCode: addressData.postalCode,
          country: addressData.country,
          isDefault: true
        })
      }
    )

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Failed to add address:', error)
    throw error
  }
}`}
        />
      </Section>

      {/* Order Tracking */}
      <Section
        title="Order Tracking"
        description="Allow customers to track orders by order number"
      >
        <CodeBlock
          code={`import { useState } from 'react'

function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)

  const trackOrder = async () => {
    setError(null)
    setOrder(null)

    try {
      const response = await fetch(
        \`http://localhost:3000/orders/number/\${orderNumber}\`
      )
      const data = await response.json()

      if (data.success) {
        const detailsRes = await fetch(
          \`http://localhost:3000/orders/\${data.data.id}/details\`
        )
        const details = await detailsRes.json()
        setOrder(details.data)
      } else {
        setError('Order not found')
      }
    } catch (err) {
      setError('Failed to track order')
    }
  }

  return (
    <div>
      <h1>Track Your Order</h1>

      <input
        type="text"
        placeholder="Enter order number (e.g., ORD-20250101-0001)"
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
      />
      <button onClick={trackOrder}>Track</button>

      {error && <p className="error">{error}</p>}

      {order && (
        <div className="order-details">
          <h2>Order {order.order.orderNumber}</h2>
          <div className="status-badge">{order.order.status}</div>
          <p>Total: \${order.order.total}</p>
          <p>Placed: {new Date(order.order.createdAt).toLocaleDateString()}</p>

          <h3>Items:</h3>
          {order.items.map(({ item, product }) => (
            <div key={item.id}>
              {product.name} x {item.quantity} - \${item.totalPrice}
            </div>
          ))}

          <h3>Shipping Address:</h3>
          <p>
            {order.shippingAddress.street}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
            {order.shippingAddress.postalCode}
          </p>
        </div>
      )}
    </div>
  )
}`}
        />
      </Section>

      {/* Utility Functions */}
      <Section
        title="Utility Functions"
        description="Reusable helper functions for common operations"
      >
        <CodeBlock
          title="API Request Wrapper"
          code={`const API_URL = 'http://localhost:3000'

export async function apiRequest(endpoint, options = {}) {
  try {
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
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Usage
const products = await apiRequest('/products/active')
console.log(products.data)`}
        />

        <CodeBlock
          title="Session Management"
          code={`const SESSION_KEY = 'draza_session_id'

export function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

// Usage
const sessionId = getSessionId()`}
        />

        <CodeBlock
          title="Price Formatting"
          code={`export function formatPrice(price) {
  const amount = typeof price === 'string' ? parseFloat(price) : price

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Usage
<span>{formatPrice('29.99')}</span> // Output: $29.99`}
        />

        <CodeBlock
          title="Campaign Tracking Hook"
          code={`import { useEffect } from 'react'

export function useCampaignTracking() {
  useEffect(() => {
    const trackCampaign = async () => {
      const params = new URLSearchParams(window.location.search)
      const utmCampaign = params.get('utm_campaign')

      if (!utmCampaign) return

      const sessionId = getSessionId()

      const getDeviceType = () => {
        const ua = navigator.userAgent
        if (/(tablet|ipad)/i.test(ua)) return 'tablet'
        if (/Mobile|Android/i.test(ua)) return 'mobile'
        return 'desktop'
      }

      try {
        await fetch('http://localhost:3000/analytics/campaigns/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackingCode: utmCampaign,
            sessionId,
            landingPage: window.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            deviceType: getDeviceType()
          })
        })
      } catch (error) {
        console.error('Campaign tracking failed:', error)
      }
    }

    trackCampaign()
  }, [])
}

// Usage in your root component
function App() {
  useCampaignTracking()
  return <YourApp />
}`}
        />
      </Section>
    </div>
  )
}
