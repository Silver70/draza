import { createFileRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
})

function SettingsLayout() {
  const matchRoute = useMatchRoute()
  const isOrdersActive = matchRoute({ to: '/settings/orders', fuzzy: true })

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and preferences.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b mb-6">
        <nav className="flex gap-4" aria-label="Settings navigation">
          <Link
            to="/settings/orders"
            className={
              isOrdersActive
                ? 'px-4 py-2 border-b-2 border-primary font-medium text-foreground'
                : 'px-4 py-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 transition-colors'
            }
          >
            Orders
          </Link>
          {/* Add more tabs here as you create more settings pages */}
        </nav>
      </div>

      {/* Child routes render here */}
      <Outlet />
    </div>
  )
}
