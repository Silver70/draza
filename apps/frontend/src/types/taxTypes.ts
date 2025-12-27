// Tax jurisdiction types
export type JurisdictionType = 'country' | 'state' | 'county' | 'city';

// Tax jurisdiction
export type TaxJurisdiction = {
  id: string;
  name: string;
  type: JurisdictionType;
  country: string;
  stateCode: string | null;
  countyName: string | null;
  cityName: string | null;
  rate: string; // Stored as string in DB (e.g., "0.0725")
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

// Create tax jurisdiction input
export type CreateTaxJurisdictionInput = {
  name: string;
  type: JurisdictionType;
  country?: string;
  stateCode?: string;
  countyName?: string;
  cityName?: string;
  rate: number; // Input as number (e.g., 0.0725 for 7.25%)
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
  description?: string;
};

// Update tax jurisdiction input
export type UpdateTaxJurisdictionInput = {
  name?: string;
  type?: JurisdictionType;
  country?: string;
  stateCode?: string;
  countyName?: string;
  cityName?: string;
  rate?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isActive?: boolean;
  description?: string;
};

// API Response Types
export type TaxJurisdictionResponse = {
  success: boolean;
  data: TaxJurisdiction;
};

export type TaxJurisdictionsResponse = {
  success: boolean;
  data: TaxJurisdiction[];
};
