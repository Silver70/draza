import { createFileRoute, Link } from '@tanstack/react-router'
import { DocsLayout, DocHeading, DocParagraph } from '~/components/docs-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Package, ShoppingCart, Users, Truck, Tag, Grid3x3, Folder } from 'lucide-react'

export const Route = createFileRoute('/dev/api-reference/')({
  component: RouteComponent,
})

const apiSections = [
  {
    icon: Package,
    title: 'Products',
    href: '/dev/api-reference/products',
    description: 'Browse products, get details, check stock availability',
    endpoints: 4,
  },
  {
    icon: Grid3x3,
    title: 'Categories',
    href: '/dev/api-reference/categories',
    description: 'Navigate category tree, get breadcrumbs',
    endpoints: 3,
  },
  {
    icon: Folder,
    title: 'Collections',
    href: '/dev/api-reference/collections',
    description: 'Get collections with products',
    endpoints: 2,
  },
  {
    icon: ShoppingCart,
    title: 'Shopping Cart',
    href: '/dev/api-reference/cart',
    description: 'Manage cart items, apply discounts, calculate totals',
    endpoints: 6,
  },
  {
    icon: Users,
    title: 'Customers',
    href: '/dev/api-reference/customers',
    description: 'Create accounts, manage profiles, guest checkout',
    endpoints: 5,
  },
  {
    icon: Users,
    title: 'Addresses',
    href: '/dev/api-reference/addresses',
    description: 'Manage shipping and billing addresses',
    endpoints: 5,
  },
  {
    icon: Truck,
    title: 'Orders',
    href: '/dev/api-reference/orders',
    description: 'Place orders, track shipments, order history',
    endpoints: 6,
  },
  {
    icon: Tag,
    title: 'Discounts',
    href: '/dev/api-reference/discounts',
    description: 'Validate and apply discount codes',
    endpoints: 3,
  },
  {
    icon: Truck,
    title: 'Shipping',
    href: '/dev/api-reference/shipping',
    description: 'Get shipping methods and calculate costs',
    endpoints: 2,
  },
]

function RouteComponent() {
  return (
    <DocsLayout>
      <DocHeading>API Reference</DocHeading>
      <DocParagraph>
        Complete reference for all API endpoints. Each section includes request/response examples,
        parameter descriptions, and TypeScript type definitions.
      </DocParagraph>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {apiSections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} to={section.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Icon className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {section.endpoints} endpoint{section.endpoints !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </DocsLayout>
  )
}
