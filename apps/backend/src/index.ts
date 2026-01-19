import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './modules/auth/auth.routes'
import { productsRoutes } from './modules/products/products.routes'
import { ordersRoutes } from './modules/orders/orders.routes'
import { customersRoutes } from './modules/customers/customers.route'
import { taxRoutes } from './modules/orders/tax.routes'
import { analyticsRoutes } from './modules/analytics/analytics.routes'
import { discountsRoutes } from './modules/discounts/discounts.routes'
import { cartRoutes } from './modules/cart/cart.routes'
import { requireOrganization } from './shared/middleware/auth.middleware'
import { injectTenantContext } from './shared/middleware/tenant.middleware'
import { showRoutes } from 'hono/dev';

const app = new Hono()

// Enable CORS for frontend
app.use('/*', cors({
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}))

// Public routes
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Auth routes (public - handles login, signup, sessions, etc.)
app.route('/api/auth', authRoutes)

// Protected routes - require authentication and organization context
app.use('/products/*', requireOrganization, injectTenantContext)
app.use('/orders/*', requireOrganization, injectTenantContext)
app.use('/customers/*', requireOrganization, injectTenantContext)
app.use('/tax/*', requireOrganization, injectTenantContext)
app.use('/analytics/*', requireOrganization, injectTenantContext)
app.use('/discounts/*', requireOrganization, injectTenantContext)
app.use('/cart/*', requireOrganization, injectTenantContext)

app.route('/products', productsRoutes)
app.route('/orders', ordersRoutes)
app.route('/customers', customersRoutes)
app.route('/tax', taxRoutes)
app.route('/analytics', analyticsRoutes)
app.route('/discounts', discountsRoutes)
app.route('/cart', cartRoutes)

// showRoutes(app);


export default app
