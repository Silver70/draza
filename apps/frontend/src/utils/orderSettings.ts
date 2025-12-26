/**
 * Order settings stored in localStorage
 * Used for admin order creation defaults
 */

const ORDER_SETTINGS_KEY = 'draza_order_settings';

export interface OrderSettings {
  defaultShippingMethodId: string | null;
}

const defaultSettings: OrderSettings = {
  defaultShippingMethodId: null,
};

/**
 * Get order settings from localStorage
 */
export function getOrderSettings(): OrderSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const stored = localStorage.getItem(ORDER_SETTINGS_KEY);
    if (!stored) {
      return defaultSettings;
    }
    return JSON.parse(stored) as OrderSettings;
  } catch (error) {
    console.error('Error reading order settings:', error);
    return defaultSettings;
  }
}

/**
 * Save order settings to localStorage
 */
export function saveOrderSettings(settings: Partial<OrderSettings>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getOrderSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(ORDER_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving order settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Clear all order settings
 */
export function clearOrderSettings(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(ORDER_SETTINGS_KEY);
  } catch (error) {
    console.error('Error clearing order settings:', error);
  }
}
