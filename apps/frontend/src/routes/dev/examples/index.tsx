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

export const Route = createFileRoute('/dev/examples/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>Code Examples</DocHeading>
      <DocParagraph>
        Real-world examples for building common ecommerce features with the Draza API.
      </DocParagraph>

      <DocSubheading id="product-listing">Product Listing Page</DocSubheading>
      <DocParagraph>
        Display products with filtering by category and search functionality.
      </DocParagraph>
      <DocCodeBlock language="typescript">{`import { useEffect, useState } from 'react'

function ProductListingPage() {
  const [products, setProducts] = useState([])
  const [categoryId, setCategoryId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [categoryId, searchQuery])

  const fetchProducts = async () => {
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
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}`}</DocCodeBlock>

      <DocSubheading id="product-detail">Product Detail Page</DocSubheading>
      <DocParagraph>
        Show product details with variant selection and add to cart functionality.
      </DocParagraph>
      <DocCodeBlock language="typescript">{`import { useEffect, useState } from 'react'

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
    <div>
      <h1>{productData.product.name}</h1>
      <p>{productData.product.description}</p>

      {/* Product Images */}
      <div className="images">
        {productData.images.map(img => (
          <img key={img.id} src={img.url} alt={img.altText} />
        ))}
      </div>

      {/* Variant Selection */}
      <div className="variants">
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
  )
}`}</DocCodeBlock>

      <DocSubheading id="shopping-cart">Shopping Cart</DocSubheading>
      <DocParagraph>
        Display cart items with quantity update and remove functionality.
      </DocParagraph>
      <DocCodeBlock language="typescript">{`import { useEffect, useState } from 'react'

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

      <div className="cart-totals">
        <p>Subtotal: \${cart.cart.subtotal}</p>
        <p>Total: \${cart.cart.total}</p>
      </div>

      <button onClick={() => window.location.href = '/checkout'}>
        Proceed to Checkout
      </button>
    </div>
  )
}`}</DocCodeBlock>

      <DocSubheading id="checkout">Checkout Flow</DocSubheading>
      <DocParagraph>
        Complete checkout with shipping selection and order placement.
      </DocParagraph>
      <DocCodeBlock language="typescript">{`import { useEffect, useState } from 'react'

function CheckoutPage() {
  const [cart, setCart] = useState(null)
  const [shippingMethods, setShippingMethods] = useState([])
  const [selectedShipping, setSelectedShipping] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [shippingAddress, setShippingAddress] = useState(null)

  useEffect(() => {
    loadCheckoutData()
  }, [])

  const loadCheckoutData = async () => {
    // Load cart
    const sessionId = localStorage.getItem('sessionId')
    const cartRes = await fetch(\`http://localhost:3000/cart?sessionId=\${sessionId}\`)
    const cartData = await cartRes.json()
    setCart(cartData.data)

    // Load shipping methods
    const shippingRes = await fetch('http://localhost:3000/orders/shipping-methods')
    const shippingData = await shippingRes.json()
    setShippingMethods(shippingData.data)
  }

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
    <div>
      <h1>Checkout</h1>

      {/* Cart Summary */}
      <div className="cart-summary">
        <h2>Order Summary</h2>
        {cart?.items.map(({ item, product }) => (
          <div key={item.id}>
            {product.name} x {item.quantity}
          </div>
        ))}
      </div>

      {/* Shipping Method Selection */}
      <div className="shipping-methods">
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
      </div>

      {/* Place Order Button */}
      <button onClick={placeOrder}>Place Order</button>
    </div>
  )
}`}</DocCodeBlock>

      <DocSubheading id="order-tracking">Order Tracking</DocSubheading>
      <DocParagraph>
        Allow customers to track their order status by order number.
      </DocParagraph>
      <DocCodeBlock language="typescript">{`import { useState } from 'react'

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
        // Get full order details
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
          <p>Status: <strong>{order.order.status}</strong></p>
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
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
        </div>
      )}
    </div>
  )
}`}</DocCodeBlock>

      <DocSubheading id="helper-functions">Helper Functions</DocSubheading>
      <DocParagraph>
        Reusable utility functions for common operations.
      </DocParagraph>

      <DocH3>API Request Wrapper</DocH3>
      <DocCodeBlock language="typescript">{`const API_URL = 'http://localhost:3000'

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
console.log(products.data)`}</DocCodeBlock>

      <DocH3>Session Management</DocH3>
      <DocCodeBlock language="typescript">{`const SESSION_KEY = 'draza_session_id'

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
const sessionId = getSessionId()`}</DocCodeBlock>

      <DocH3>Price Formatting</DocH3>
      <DocCodeBlock language="typescript">{`export function formatPrice(price) {
  const amount = typeof price === 'string' ? parseFloat(price) : price

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Usage
<span>{formatPrice('29.99')}</span> // Output: $29.99`}</DocCodeBlock>
    </DocsLayout>
  )
}
