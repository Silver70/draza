/**
 * React Hook for Campaign Tracking
 *
 * Use this hook to automatically track campaign visits and manage session IDs
 */

import { useEffect, useState } from 'react';
import {
  initializeCampaignTracking,
  updateCampaignActivity,
  getSessionId,
  isFromCampaign,
  getCurrentCampaignCode,
  getCampaignSessionForOrder,
} from './campaignTracking';

interface UseCampaignTrackingOptions {
  /**
   * Whether to track the campaign on mount
   * @default true
   */
  trackOnMount?: boolean;

  /**
   * Whether to update activity on route changes
   * Requires TanStack Router or manual integration
   * @default false
   */
  updateOnRouteChange?: boolean;

  /**
   * Callback when a campaign is detected and tracked
   */
  onCampaignDetected?: (trackingCode: string) => void;
}

interface CampaignTrackingState {
  /**
   * Whether the current session is from a campaign
   */
  isFromCampaign: boolean;

  /**
   * The tracking code of the current campaign (if any)
   */
  campaignCode: string | null;

  /**
   * The session ID for order attribution
   */
  sessionId: string | null;

  /**
   * Whether tracking is currently in progress
   */
  isTracking: boolean;

  /**
   * Whether a campaign was successfully tracked
   */
  wasTracked: boolean;
}

/**
 * Hook to manage campaign tracking
 *
 * @example
 * // Basic usage - track campaign on mount
 * const { isFromCampaign, sessionId } = useCampaignTracking();
 *
 * @example
 * // With callback
 * const { campaignCode, sessionId } = useCampaignTracking({
 *   onCampaignDetected: (code) => {
 *     console.log('Campaign detected:', code);
 *     // Maybe show a welcome message or special offer
 *   }
 * });
 *
 * @example
 * // Use session ID when creating an order
 * const { sessionId } = useCampaignTracking();
 *
 * const createOrder = async (orderData) => {
 *   await fetch('/orders', {
 *     method: 'POST',
 *     body: JSON.stringify({
 *       ...orderData,
 *       sessionId, // Include for campaign attribution
 *     })
 *   });
 * };
 */
export function useCampaignTracking(
  options: UseCampaignTrackingOptions = {}
): CampaignTrackingState {
  const { trackOnMount = true, onCampaignDetected } = options;

  const [state, setState] = useState<CampaignTrackingState>({
    isFromCampaign: false,
    campaignCode: null,
    sessionId: null,
    isTracking: false,
    wasTracked: false,
  });

  useEffect(() => {
    // Initialize state from localStorage
    const sessionId = getSessionId();
    const fromCampaign = isFromCampaign();
    const campaignCode = getCurrentCampaignCode();

    setState((prev) => ({
      ...prev,
      sessionId,
      isFromCampaign: fromCampaign,
      campaignCode,
    }));

    // Track campaign if enabled
    if (trackOnMount) {
      setState((prev) => ({ ...prev, isTracking: true }));

      initializeCampaignTracking({
        onTrackingDetected: (code) => {
          setState((prev) => ({
            ...prev,
            isFromCampaign: true,
            campaignCode: code,
            sessionId: getSessionId(),
            isTracking: false,
            wasTracked: true,
          }));

          if (onCampaignDetected) {
            onCampaignDetected(code);
          }
        },
      }).then((tracked) => {
        setState((prev) => ({
          ...prev,
          isTracking: false,
          wasTracked: tracked,
        }));
      });
    }
  }, [trackOnMount, onCampaignDetected]);

  return state;
}

/**
 * Hook to update campaign activity
 * Use this to extend the 30-day attribution window
 *
 * @example
 * // In your route component or layout
 * useCampaignActivityUpdate();
 */
export function useCampaignActivityUpdate(): void {
  useEffect(() => {
    updateCampaignActivity();
  }, []); // Run once on mount
}

/**
 * Hook to get session ID for order creation
 * Returns the session ID that should be included when creating orders
 *
 * @example
 * const sessionId = useCampaignSessionId();
 *
 * const orderData = {
 *   customerId: customer.id,
 *   sessionId, // Include this for campaign attribution
 *   items: cartItems,
 * };
 */
export function useCampaignSessionId(): string | undefined {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const id = getCampaignSessionForOrder();
    setSessionId(id);
  }, []);

  return sessionId;
}
