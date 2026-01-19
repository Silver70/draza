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

// Only add interceptors in browser context (not during SSR)
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
