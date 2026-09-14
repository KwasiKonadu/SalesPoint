'use client';

import { useSyncExternalStore } from 'react';

/**
 * The currencies selectable from Settings → Business Info. Adding one here
 * makes it available everywhere: the settings picker, `CurrencyInput`, and
 * `formatCurrency`.
 */
export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'GHS', label: 'Ghana Cedi', symbol: '¢' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'NGN', label: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', label: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R' },
  { code: 'XOF', label: 'West African CFA Franc', symbol: 'CFA' },
];

export const DEFAULT_CURRENCY_CODE = 'GHS';

export function currencySymbol(code?: string | null): string {
  const match = CURRENCIES.find((c) => c.code === code);
  return (
    match?.symbol ??
    CURRENCIES.find((c) => c.code === DEFAULT_CURRENCY_CODE)!.symbol
  );
}

// ---- App-wide active currency ----
// A plain module-level store, not React state, so both components and plain
// functions (e.g. the receipt builder in `lib/pos.ts`) can read the
// business's configured currency synchronously. `AppLayout` hydrates it once
// from `/api/business-settings`; the Business Info panel updates it the
// moment a currency change is saved.
let currentCode = DEFAULT_CURRENCY_CODE;
const listeners = new Set<() => void>();

export function getCurrencyCode(): string {
  return currentCode;
}

export function setCurrencyCode(code: string | undefined | null): void {
  const next = code || DEFAULT_CURRENCY_CODE;
  if (next === currentCode) return;
  currentCode = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The active currency code; re-renders the caller when `setCurrencyCode` changes it. */
export function useCurrencyCode(): string {
  return useSyncExternalStore(subscribe, getCurrencyCode, () => DEFAULT_CURRENCY_CODE);
}
