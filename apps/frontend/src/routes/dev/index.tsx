import { createFileRoute, Link } from '@tanstack/react-router'
import { DocsLayout, DocHeading, DocParagraph, DocCode } from '~/components/docs-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { ArrowRight, Zap, Shield, Layers } from 'lucide-react'

export const Route = createFileRoute('/dev/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout>
      <div className="space-y-8">
        <div>
          <DocHeading>Draza Ecommerce API Documentation</DocHeading>
          <DocParagraph>
            Complete API reference for building modern ecommerce storefronts with the Draza backend.
            Built with Hono, PostgreSQL, and designed for performance and developer experience.
          </DocParagraph>
        </div>

        <div className="grid gap-4 md:grid-cols-3 my-8">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Fast & Simple</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                RESTful API with predictable endpoints and consistent response formats
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Type-Safe</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built with TypeScript and Zod validation for runtime safety
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Layers className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Full-Featured</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Everything you need: products, cart, checkout, orders, and campaign tracking
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Quick Start</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Base URL: <DocCode>http://localhost:3000</DocCode>
          </p>
          <pre className="bg-background p-4 rounded text-sm overflow-x-auto">
            <code>{`// Fetch active products
fetch('http://localhost:3000/products/active')
  .then(res => res.json())
  .then(data => console.log(data))

// Add item to cart
fetch('http://localhost:3000/cart/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'your-session-id',
    productVariantId: 1,
    quantity: 2
  })
})`}</code>
          </pre>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Popular Sections</h2>

          <Link
            to="/dev/getting-started"
            className="block border rounded-lg p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Getting Started</h3>
                <p className="text-sm text-muted-foreground">
                  Learn the basics, authentication, and common patterns
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/dev/api-reference/products"
            className="block border rounded-lg p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Products API</h3>
                <p className="text-sm text-muted-foreground">
                  Browse products, variants, categories, and collections
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/dev/api-reference/cart"
            className="block border rounded-lg p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Shopping Cart API</h3>
                <p className="text-sm text-muted-foreground">
                  Manage cart items, apply discounts, and calculate totals
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/dev/api-reference/orders"
            className="block border rounded-lg p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Orders & Checkout API</h3>
                <p className="text-sm text-muted-foreground">
                  Complete checkout flow with automatic tax and shipping calculation
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>

        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Core Features</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                <strong className="text-foreground">Product Catalog:</strong> Full product
                management with variants, attributes, categories, and collections
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                <strong className="text-foreground">Shopping Cart:</strong> Session-based cart
                with discount codes and real-time total calculation
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                <strong className="text-foreground">Customer Management:</strong> Support for
                both registered users and guest checkout
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                <strong className="text-foreground">Orders & Shipping:</strong> Automatic tax
                calculation, multiple shipping methods, and order tracking
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                <strong className="text-foreground">Campaign Tracking:</strong> UTM tracking
                with 30-day attribution window for marketing analytics
              </span>
            </li>
          </ul>
        </div>
      </div>
    </DocsLayout>
  )
}
