import { queryOptions } from '@tanstack/react-query'
import { createServerFn } from '@tanstack/react-start'
import apiClient from '~/lib/apiClient'

export type User = {
  id: string
  name: string
  email: string
  image: string | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export type Session = {
  id: string
  userId: string
  expiresAt: Date
  token: string
  ipAddress: string | null
  userAgent: string | null
  activeOrganizationId: string | null
}

export type AuthData = {
  user: User
  session: Session
} | null

// Fetch current authenticated user session from BetterAuth backend
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    // Call BetterAuth's session endpoint directly
    // The apiClient will automatically forward cookies from the request
    const response = await apiClient.get<{ user: User; session: Session }>(
      '/api/auth/get-session'
    )

    if (response.data?.user) {
      return response.data as AuthData
    }

    return null
  } catch (error: any) {
    // 401 is expected for unauthenticated users, don't log it as an error
    if (error?.response?.status !== 401) {
      console.error('Error fetching current user:', error)
    }
    return null
  }
})

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  })
