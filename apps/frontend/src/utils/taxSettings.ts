/**
 * Tax settings stored in localStorage
 * Used for admin tax calculation configuration
 */

const TAX_SETTINGS_KEY = 'draza_tax_settings';

export type TaxCalculationMode = 'automatic' | 'default_jurisdiction';

export interface TaxSettings {
  calculationMode: TaxCalculationMode;
  defaultJurisdictionId: string | null;
}

const defaultSettings: TaxSettings = {
  calculationMode: 'automatic',
  defaultJurisdictionId: null,
};

/**
 * Get tax settings from localStorage
 */
export function getTaxSettings(): TaxSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const stored = localStorage.getItem(TAX_SETTINGS_KEY);
    if (!stored) {
      return defaultSettings;
    }
    return JSON.parse(stored) as TaxSettings;
  } catch (error) {
    console.error('Error reading tax settings:', error);
    return defaultSettings;
  }
}

/**
 * Save tax settings to localStorage
 */
export function saveTaxSettings(settings: Partial<TaxSettings>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getTaxSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(TAX_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving tax settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Clear all tax settings
 */
export function clearTaxSettings(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(TAX_SETTINGS_KEY);
  } catch (error) {
    console.error('Error clearing tax settings:', error);
  }
}
