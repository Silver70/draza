import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { FileText, ShoppingCart, Code, BookOpen } from 'lucide-react'

export const Route = createFileRoute('/dev/guides/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Developer Guides</h1>
        <p className="text-muted-foreground">
          Documentation and API references for building with the Draza ecommerce platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <CardTitle>Storefront API Reference</CardTitle>
            </div>
            <CardDescription>
              Complete API documentation for building an ecommerce storefront
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Comprehensive guide covering products, cart, checkout, customers, orders, discounts, and campaign tracking.
            </p>
            <a
              href="/dev/guides/storefront-api-reference.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              View Documentation
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-6 w-6 text-muted-foreground" />
              <CardTitle>Admin API Reference</CardTitle>
            </div>
            <CardDescription>
              API documentation for admin operations (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Documentation for managing products, orders, customers, analytics, and settings.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Coming Soon
            </span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
              <CardTitle>Integration Guides</CardTitle>
            </div>
            <CardDescription>
              Step-by-step guides for common integrations (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Learn how to integrate payment gateways, shipping providers, analytics tools, and more.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Coming Soon
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 p-6 border rounded-lg bg-muted/50">
        <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <h3 className="font-medium mb-2">Backend Repository</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Location: <code className="text-xs bg-background px-1 py-0.5 rounded">apps/backend</code></li>
              <li>Framework: Hono + Bun</li>
              <li>Database: PostgreSQL (Drizzle ORM)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">Frontend Repository</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Location: <code className="text-xs bg-background px-1 py-0.5 rounded">apps/frontend</code></li>
              <li>Framework: TanStack Start (React)</li>
              <li>UI: Radix UI + Tailwind CSS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
