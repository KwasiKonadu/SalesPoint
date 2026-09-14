/**
 * Types shared by the Settings screen and its sub-components
 * (`src/components/settings/*`).
 */

export interface BusinessSettings {
  [key: string]: string;
}

export interface ProductType {
  id: string;
  name: string;
  description: string | null;
  tracksStock: boolean;
  isActive: boolean;
}

export interface Unit {
  id: string;
  name: string;
  shortName: string | null;
  isActive: boolean;
}

export type SettingsTab = 'business-info' | 'product-config' | 'receipt-settings';

export const RECEIPT_FORMAT_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'compact', label: 'Compact' },
];
