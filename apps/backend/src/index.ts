import { Hono } from 'hono'
import { productsRoutes } from './modules/products/products.routes'


const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/products', productsRoutes)




export default app
