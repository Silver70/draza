import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { productsRoutes } from './modules/products/products.routes'
import { ordersRoutes } from './modules/orders/orders.routes'
import { customersRoutes } from './modules/customers/customers.route'
import { taxRoutes } from './modules/orders/tax.routes'
import { analyticsRoutes } from './modules/analytics/analytics.routes'
import { discountsRoutes } from './modules/discounts/discounts.routes'
import { cartRoutes } from './modules/cart/cart.routes'
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

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/products', productsRoutes)
app.route('/orders', ordersRoutes)
app.route('/customers', customersRoutes)
app.route('/tax', taxRoutes)
app.route('/analytics', analyticsRoutes)
app.route('/discounts', discountsRoutes)
app.route('/cart', cartRoutes)

// showRoutes(app);


export default app
