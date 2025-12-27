import { Hono } from 'hono'
import { productsRoutes } from './modules/products/products.routes'
import { ordersRoutes } from './modules/orders/orders.routes'
import { customersRoutes } from './modules/customers/customers.route'
import { taxRoutes } from './modules/orders/tax.routes'
import { showRoutes } from 'hono/dev';

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/products', productsRoutes)
app.route('/orders', ordersRoutes)
app.route('/customers', customersRoutes)
app.route('/tax', taxRoutes)

// showRoutes(app);


export default app
