import { Hono } from 'hono'
import { auth } from '../../shared/auth/auth.config'

export const authRoutes = new Hono()

// Mount all Better Auth endpoints
// This handles: sign-in, sign-up, sign-out, sessions, organizations, etc.
authRoutes.on(['GET', 'POST'], '/*', (c) => {
  return auth.handler(c.req.raw)
})
