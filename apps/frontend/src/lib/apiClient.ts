import axios from 'axios'
import { authClient } from './auth.client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
})

// Server-side: Forward cookies from incoming request
if (typeof window === 'undefined') {
  apiClient.interceptors.request.use(async (config) => {
    try {
      // Import getRequestHeaders only on server-side
      const { getRequestHeaders } = await import('@tanstack/react-start/server')
      const headers = getRequestHeaders()

      // Forward the cookie header from the incoming request
      const cookie = headers.get('cookie')
      if (cookie) {
        config.headers['Cookie'] = cookie
        console.log('[apiClient] Forwarding cookies to backend:', cookie.substring(0, 50) + '...')
      } else {
        console.log('[apiClient] No cookies found in request headers')
      }
    } catch (error) {
      console.error('[apiClient] Error getting request headers:', error)
    }

    return config
  })
}

// Client-side: Add interceptors for browser context
if (typeof window !== 'undefined') {
  // Add auth headers to every request
  apiClient.interceptors.request.use(async (config) => {
    const session = await authClient.getSession()
    if (session?.data?.session) {
      // Better Auth uses cookies, but we can add additional headers if needed
      // The session cookie will be automatically included due to withCredentials: true
      config.headers = config.headers || {}
    }
    return config
  })

  // Handle 401 errors by redirecting to login
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )
}

export default apiClient
