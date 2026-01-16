/**
 * Session management utility for cart
 * Handles sessionId generation and persistence in localStorage
 */

const STORAGE_KEY = 'draza_cart_session_id'

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Get existing sessionId or create a new one
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - return empty string or handle appropriately
    return ''
  }

  let sessionId = localStorage.getItem(STORAGE_KEY)

  if (!sessionId) {
    sessionId = generateUUID()
    localStorage.setItem(STORAGE_KEY, sessionId)
  }

  return sessionId
}

/**
 * Clear the session ID (useful after checkout)
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Set a new session ID (useful after login/cart merge)
 */
export function setSessionId(sessionId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, sessionId)
  }
}
