import { createAuthClient } from "better-auth/client"
import { organizationClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/auth',

  // Critical: Enable credentials for cookie-based auth
  fetchOptions: {
    credentials: 'include'
  },

  plugins: [organizationClient()]
})

export type Session = Awaited<ReturnType<typeof authClient.getSession>>
export type User = NonNullable<Session['data']>['user']
