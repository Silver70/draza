import { auth } from '../auth/auth.config'
import type { Context, Next } from 'hono'

export interface AuthContext {
  user: {
    id: string
    email: string
    name: string
  }
  session: {
    id: string
    activeOrganizationId: string | null
  }
  organization: {
    id: string
    name: string
    role: 'owner' | 'admin' | 'member'
  } | null
}

/**
 * Middleware to require authenticated user
 * Extracts user and session from Better Auth
 */
export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers
  })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('authContext', {
    user: session.user,
    session: session.session,
    organization: null // Set by requireOrganization
  })

  await next()
}

/**
 * Middleware to require active organization
 * Must be used after requireAuth
 */
export async function requireOrganization(c: Context, next: Next) {
  // First check authentication
  const session = await auth.api.getSession({
    headers: c.req.raw.headers
  })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Set initial auth context
  c.set('authContext', {
    user: session.user,
    session: session.session,
    organization: null
  })

  const authContext = c.get('authContext') as AuthContext
  const activeOrgId = authContext.session.activeOrganizationId

  if (!activeOrgId) {
    return c.json({
      error: 'No active organization',
      message: 'Please select an organization first'
    }, 400)
  }

  // Get user's membership in this org
  const member = await auth.api.getActiveMember({
    headers: c.req.raw.headers
  })

  if (!member) {
    return c.json({ error: 'Not a member of this organization' }, 403)
  }

  authContext.organization = {
    id: member.organizationId,
    name: activeOrgId, // We'll fetch org details separately if needed
    role: member.role as 'owner' | 'admin' | 'member'
  }

  c.set('authContext', authContext)
  await next()
}

/**
 * Get auth context from request
 * Throws error if context not available
 */
export function getAuthContext(c: Context): AuthContext {
  const authContext = c.get('authContext') as AuthContext
  if (!authContext) {
    throw new Error('Auth context not available. Did you forget to use requireAuth middleware?')
  }
  return authContext
}
