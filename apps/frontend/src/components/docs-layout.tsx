import { Link } from '@tanstack/react-router'
import { ScrollArea } from '~/components/ui/scroll-area'
import { cn } from '~/lib/utils'
import { ChevronRight, Book, Code, ShoppingCart, Package, Users, CreditCard, Truck, Tag } from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  title: string
  href: string
  icon?: any
  items?: NavItem[]
}

const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/dev/getting-started',
    icon: Book,
  },
  {
    title: 'API Reference',
    href: '/dev/api-reference',
    icon: Code,
    items: [
      { title: 'Products', href: '/dev/api-reference/products', icon: Package },
      { title: 'Categories', href: '/dev/api-reference/categories' },
      { title: 'Collections', href: '/dev/api-reference/collections' },
      { title: 'Shopping Cart', href: '/dev/api-reference/cart', icon: ShoppingCart },
      { title: 'Customers', href: '/dev/api-reference/customers', icon: Users },
      { title: 'Addresses', href: '/dev/api-reference/addresses' },
      { title: 'Orders', href: '/dev/api-reference/orders', icon: Truck },
      { title: 'Discounts', href: '/dev/api-reference/discounts', icon: Tag },
      { title: 'Shipping', href: '/dev/api-reference/shipping' },
    ],
  },
  {
    title: 'Examples',
    href: '/dev/examples',
    icon: Code,
  },
]

export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 hidden md:block">
        <ScrollArea className="h-screen py-6 px-4">
          <div className="mb-6">
            <Link to="/dev" className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <Code className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Draza API</h2>
                <p className="text-xs text-muted-foreground">Developer Docs</p>
              </div>
            </Link>
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavSection key={item.href} item={item} />
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto py-8 px-6 max-w-4xl">{children}</div>
      </main>
    </div>
  )
}

function NavSection({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(true)
  const Icon = item.icon

  if (item.items) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
        >
          {Icon && <Icon className="h-4 w-4" />}
          <span className="flex-1 text-left">{item.title}</span>
          <ChevronRight
            className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')}
          />
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l pl-3">
            {item.items.map((subItem) => {
              const SubIcon = subItem.icon
              return (
                <Link
                  key={subItem.href}
                  to={subItem.href}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  activeProps={{
                    className: 'bg-muted text-foreground font-medium',
                  }}
                >
                  {SubIcon && <SubIcon className="h-3.5 w-3.5" />}
                  {subItem.title}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      to={item.href}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
      activeProps={{
        className: 'bg-muted',
      }}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {item.title}
    </Link>
  )
}

// Reusable documentation components
export function DocHeading({ children }: { children: React.ReactNode }) {
  return <h1 className="text-4xl font-bold mb-4">{children}</h1>
}

export function DocSection({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mb-12">
      {children}
    </section>
  )
}

export function DocSubheading({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-2xl font-semibold mb-4 mt-8 scroll-mt-16">
      {children}
    </h2>
  )
}

export function DocH3({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3 id={id} className="text-xl font-semibold mb-3 mt-6 scroll-mt-16">
      {children}
    </h3>
  )
}

export function DocParagraph({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground mb-4 leading-7">{children}</p>
}

export function DocCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  )
}

export function DocCodeBlock({ children, language }: { children: string; language?: string }) {
  return (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
      <code className="text-sm font-mono">{children}</code>
    </pre>
  )
}

interface EndpointProps {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  children?: React.ReactNode
}

export function Endpoint({ method, path, description, children }: EndpointProps) {
  const methodColors = {
    GET: 'bg-blue-500',
    POST: 'bg-green-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500',
  }

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <span
          className={cn(
            'px-2 py-1 rounded text-xs font-mono font-semibold text-white',
            methodColors[method]
          )}
        >
          {method}
        </span>
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded flex-1">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      {children}
    </div>
  )
}

export function ParamTable({
  params,
}: {
  params: Array<{ name: string; type: string; required?: boolean; description: string }>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-semibold">Parameter</th>
            <th className="text-left py-2 px-3 font-semibold">Type</th>
            <th className="text-left py-2 px-3 font-semibold">Required</th>
            <th className="text-left py-2 px-3 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr key={param.name} className="border-b">
              <td className="py-2 px-3">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{param.name}</code>
              </td>
              <td className="py-2 px-3 text-muted-foreground">{param.type}</td>
              <td className="py-2 px-3">
                {param.required ? (
                  <span className="text-xs text-red-500 font-medium">Required</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Optional</span>
                )}
              </td>
              <td className="py-2 px-3 text-muted-foreground">{param.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ResponseExample({ children }: { children: string }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold mb-2 text-muted-foreground">Response Example:</p>
      <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
        <code className="text-xs font-mono">{children}</code>
      </pre>
    </div>
  )
}
