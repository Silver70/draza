/**
 * Campaign Tracking Example Component
 *
 * This shows how to integrate campaign tracking in your app.
 * Copy the relevant parts to your actual components.
 */

import { useCampaignTracking, useCampaignSessionId } from '../hooks/useCampaignTracking';
import { useState } from 'react';

/**
 * Example: Root Layout Component
 * Add this to your app's root layout or __root.tsx
 */
export function ExampleRootLayout() {
  const { isFromCampaign, campaignCode, wasTracked } = useCampaignTracking({
    onCampaignDetected: (code) => {
      console.log('🎯 Campaign detected:', code);
      // You could show a toast, modal, or special banner here
    }
  });

  return (
    <div>
      {/* Optional: Show banner for campaign visitors */}
      {isFromCampaign && (
        <div className="bg-blue-500 text-white p-4 text-center">
          Welcome from {campaignCode}! Enjoy exclusive offers 🎉
        </div>
      )}

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && wasTracked && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-500 p-3 rounded shadow">
          ✓ Campaign tracked: {campaignCode}
        </div>
      )}

      {/* Your app content */}
      <main>
        {/* Children routes */}
      </main>
    </div>
  );
}

/**
 * Example: Checkout Component
 * Shows how to include sessionId when creating orders
 */
export function ExampleCheckout() {
  const sessionId = useCampaignSessionId();
  const [loading, setLoading] = useState(false);

  const handleCreateOrder = async () => {
    setLoading(true);

    try {
      const orderData = {
        customerId: 'customer-uuid',
        shippingAddressId: 'address-uuid',
        billingAddressId: 'address-uuid',
        items: [
          {
            productVariantId: 'variant-uuid',
            quantity: 2,
          },
        ],
        shippingMethodId: 'shipping-uuid',
        sessionId, // ✅ This enables campaign attribution
      };

      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Order created:', result.data);
        // The order is now attributed to the campaign (if sessionId is from a campaign visit)
        alert('Order created successfully!');
      } else {
        console.error('❌ Order failed:', result.error);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      {sessionId && (
        <div className="bg-blue-50 p-3 rounded mb-4 text-sm">
          📊 Campaign session active: {sessionId}
        </div>
      )}

      <button
        onClick={handleCreateOrder}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 disabled:bg-gray-300"
      >
        {loading ? 'Creating Order...' : 'Create Order'}
      </button>

      <div className="mt-4 text-xs text-gray-500">
        {sessionId
          ? '✓ Order will be attributed to campaign'
          : 'ℹ️ No campaign attribution (direct visit)'}
      </div>
    </div>
  );
}

/**
 * Example: Special Offer for Campaign Visitors
 * Show different content based on campaign source
 */
export function ExampleSpecialOffer() {
  const { isFromCampaign, campaignCode } = useCampaignTracking();

  if (!isFromCampaign) {
    return null; // Don't show to direct visitors
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-2">Exclusive Offer!</h2>
      <p className="text-lg mb-4">
        You came from {campaignCode} - Here's 15% off your first order!
      </p>
      <button className="bg-white text-purple-600 px-6 py-2 rounded font-semibold hover:bg-gray-100">
        Claim Offer
      </button>
    </div>
  );
}

/**
 * Example: Campaign Debug Panel
 * Useful during development to see campaign tracking status
 */
export function ExampleCampaignDebugPanel() {
  const { isFromCampaign, campaignCode, sessionId, wasTracked } = useCampaignTracking();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-4 rounded shadow-lg text-xs font-mono max-w-sm">
      <div className="font-bold mb-2">🎯 Campaign Tracking Debug</div>
      <div className="space-y-1">
        <div>From Campaign: {isFromCampaign ? '✅ Yes' : '❌ No'}</div>
        <div>Campaign Code: {campaignCode || 'None'}</div>
        <div>Session ID: {sessionId ? `${sessionId.slice(0, 8)}...` : 'None'}</div>
        <div>Was Tracked: {wasTracked ? '✅ Yes' : '❌ No'}</div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-gray-400 text-xs">Test URL:</div>
        <input
          type="text"
          readOnly
          value={`${window.location.origin}?utm_campaign=TEST_123`}
          className="bg-gray-800 text-white p-1 rounded w-full text-xs mt-1"
          onClick={(e) => e.currentTarget.select()}
        />
      </div>
    </div>
  );
}

/**
 * Full Example App Structure
 */
// export function ExampleApp() {
//   return (
//     <div>
   
//       <ExampleRootLayout>
//         <ExampleSpecialOffer />

//         <div className="container mx-auto p-8">
//           <h1>Your Store</h1>
//           {/* Your content here */}
//         </div>

//         <ExampleCheckout />
//       </ExampleRootLayout>

//       {/* Debug panel (development only) */}
//       <ExampleCampaignDebugPanel />
//     </div>
//   );
// }
