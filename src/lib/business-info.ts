'use client';

import { useSyncExternalStore } from 'react';

import type { BusinessSettings } from './settings';

export type ReceiptFormat = 'standard' | 'compact';

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  receiptFooter: string;
  receiptFormat: ReceiptFormat;
  /** Default low-stock alert %, applied to new products that don't set their own. */
  defaultLowStockPercent: number;
}

export const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  name: 'StorePOS',
  address: '',
  phone: '',
  email: '',
  website: '',
  logoUrl: '',
  receiptFooter: 'Thank you for your purchase!',
  receiptFormat: 'standard',
  defaultLowStockPercent: 20,
};

// ---- App-wide business identity ----
// Same shape as the currency store in `lib/currency.ts`: a plain module-level
// value so both components (`useBusinessInfo`) and plain functions (the receipt
// builders in `lib/pos.ts` / `lib/sales.ts`) can read it synchronously.
// `AppLayout` hydrates it once from `/api/business-settings`.
let current: BusinessInfo = DEFAULT_BUSINESS_INFO;
const listeners = new Set<() => void>();

export function getBusinessInfo(): BusinessInfo {
  return current;
}

export function setBusinessInfo(
  settings: BusinessSettings | null | undefined,
): void {
  const clean = (v: string | undefined) => (v ?? '').trim();
  const parsedPercent = Number.parseInt(
    clean(settings?.default_low_stock_percent),
    10,
  );
  const next: BusinessInfo = {
    name: clean(settings?.business_name) || DEFAULT_BUSINESS_INFO.name,
    address: clean(settings?.address),
    phone: clean(settings?.phone),
    email: clean(settings?.email),
    website: clean(settings?.website),
    logoUrl: clean(settings?.logo_url),
    receiptFooter:
      clean(settings?.receipt_footer) || DEFAULT_BUSINESS_INFO.receiptFooter,
    receiptFormat: settings?.receipt_format === 'compact' ? 'compact' : 'standard',
    defaultLowStockPercent:
      Number.isFinite(parsedPercent) && parsedPercent >= 0 && parsedPercent <= 100
        ? parsedPercent
        : DEFAULT_BUSINESS_INFO.defaultLowStockPercent,
  };

  const unchanged = (Object.keys(next) as (keyof BusinessInfo)[]).every(
    (k) => next[k] === current[k],
  );
  if (unchanged) return;

  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The active business identity; re-renders the caller when it changes. */
export function useBusinessInfo(): BusinessInfo {
  return useSyncExternalStore(
    subscribe,
    getBusinessInfo,
    () => DEFAULT_BUSINESS_INFO,
  );
}
