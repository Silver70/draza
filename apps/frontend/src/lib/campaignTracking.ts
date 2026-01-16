/**
 * Campaign Tracking Utilities
 *
 * Handles tracking visitors from social media campaigns, managing session IDs,
 * and automatically attributing orders to campaigns.
 */

const STORAGE_KEY = 'campaign_session_id';
const TRACKING_CODE_PARAM = 'utm_campaign';
const SESSION_EXPIRY_DAYS = 30;

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Campaign visit data
 */
interface CampaignVisitData {
  trackingCode: string;
  sessionId: string;
  landingPage?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
}

/**
 * Campaign visit response from API
 */
interface CampaignVisitResponse {
  success: boolean;
  data?: {
    visitId: string;
    campaignId: string;
    expiresAt: string;
  };
  error?: string;
}

/**
 * Session data stored in localStorage
 */
interface SessionData {
  sessionId: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  campaignCode?: string;
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create a session ID
 * Session IDs are stored in localStorage and persist for 30 days
 */
export function getOrCreateSessionId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const sessionData: SessionData = JSON.parse(stored);
      const expiryDate = new Date(sessionData.expiresAt);

      // Check if session has expired
      if (expiryDate > new Date()) {
        // Update last activity
        sessionData.lastActivityAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        return sessionData.sessionId;
      }
    }

    // Create new session
    const sessionId = generateUUID();
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

    const sessionData: SessionData = {
      sessionId,
      createdAt: now.toISOString(),
      lastActivityAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    return sessionId;
  } catch (error) {
    console.error('Error managing session ID:', error);
    return generateUUID(); // Fallback to in-memory UUID
  }
}

/**
 * Get the current session ID without creating a new one
 */
export function getSessionId(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const sessionData: SessionData = JSON.parse(stored);
      const expiryDate = new Date(sessionData.expiresAt);

      if (expiryDate > new Date()) {
        return sessionData.sessionId;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting session ID:', error);
    return null;
  }
}

/**
 * Store campaign code in session data
 */
function storeCampaignCode(campaignCode: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const sessionData: SessionData = JSON.parse(stored);
      sessionData.campaignCode = campaignCode;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
    }
  } catch (error) {
    console.error('Error storing campaign code:', error);
  }
}

/**
 * Get tracking code from URL parameters
 */
export function getTrackingCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(TRACKING_CODE_PARAM);
}

/**
 * Detect device type from user agent
 */
function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (/mobile|android|iphone|ipod/.test(ua)) {
    return 'mobile';
  } else if (/tablet|ipad/.test(ua)) {
    return 'tablet';
  } else if (/mozilla|chrome|safari|firefox/.test(ua)) {
    return 'desktop';
  }

  return 'other';
}

/**
 * Track a campaign visit
 * This should be called when a user lands on your site from a campaign link
 */
export async function trackCampaignVisit(
  trackingCode: string,
  options: {
    landingPage?: string;
    referrer?: string;
  } = {}
): Promise<boolean> {
  try {
    const sessionId = getOrCreateSessionId();
    const userAgent = navigator.userAgent;

    const visitData: CampaignVisitData = {
      trackingCode,
      sessionId,
      landingPage: options.landingPage || window.location.pathname,
      userAgent,
      referrer: options.referrer || document.referrer,
    };

    const response = await fetch(`${API_BASE_URL}/analytics/campaigns/track-visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitData),
    });

    const result: CampaignVisitResponse = await response.json();

    if (result.success) {
      // Store campaign code in session
      storeCampaignCode(trackingCode);
      console.log('✓ Campaign visit tracked:', trackingCode);
      return true;
    } else {
      console.error('Failed to track campaign visit:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error tracking campaign visit:', error);
    return false;
  }
}

/**
 * Update visit activity
 * This extends the 30-day attribution window
 * Call this periodically (e.g., on route changes) to keep the session active
 */
export async function updateCampaignActivity(): Promise<void> {
  try {
    const sessionId = getSessionId();

    if (!sessionId) {
      return; // No active session
    }

    await fetch(`${API_BASE_URL}/analytics/campaigns/update-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });
  } catch (error) {
    // Silently fail - not critical
    console.debug('Failed to update campaign activity:', error);
  }
}

/**
 * Initialize campaign tracking
 * Call this when your app loads (e.g., in App.tsx or root layout)
 *
 * @param options Configuration options
 * @returns true if a campaign was tracked, false otherwise
 */
export async function initializeCampaignTracking(options: {
  onTrackingDetected?: (trackingCode: string) => void;
  updateActivityOnRouteChange?: boolean;
} = {}): Promise<boolean> {
  try {
    // Check for tracking code in URL
    const trackingCode = getTrackingCodeFromUrl();

    if (trackingCode) {
      // Track the visit
      const success = await trackCampaignVisit(trackingCode);

      if (success && options.onTrackingDetected) {
        options.onTrackingDetected(trackingCode);
      }

      return success;
    }

    return false;
  } catch (error) {
    console.error('Error initializing campaign tracking:', error);
    return false;
  }
}

/**
 * Get session ID for order attribution
 * Include this when creating orders to enable campaign attribution
 *
 * @example
 * const orderData = {
 *   customerId: '...',
 *   sessionId: getCampaignSessionForOrder(),
 *   items: [...]
 * };
 */
export function getCampaignSessionForOrder(): string | undefined {
  const sessionId = getSessionId();
  return sessionId || undefined;
}

/**
 * Check if the current session is from a campaign
 */
export function isFromCampaign(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const sessionData: SessionData = JSON.parse(stored);
      return !!sessionData.campaignCode;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get the current campaign code (if any)
 */
export function getCurrentCampaignCode(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const sessionData: SessionData = JSON.parse(stored);
      return sessionData.campaignCode || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Clear campaign session (useful for testing)
 */
export function clearCampaignSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing campaign session:', error);
  }
}
