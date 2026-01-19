import type { Context, Next } from 'hono'
import type { AuthContext } from './auth.middleware'

/**
 * Middleware to inject organization context into request
 * Must be used after requireOrganization middleware
 */
export async function injectTenantContext(c: Context, next: Next) {
  const authContext = c.get('authContext') as AuthContext

  if (authContext?.organization) {
    c.set('organizationId', authContext.organization.id)
  }

  await next()
}

/**
 * Helper to get organization ID from context
 * Throws error if organization context not available
 */
export function getOrganizationId(c: Context): string {
  const orgId = c.get('organizationId')
  if (!orgId) {
    throw new Error('Organization context not available. Did you forget to use requireOrganization middleware?')
  }
  return orgId
}
