/**
 * Shared formatting helpers. Previously every page defined its own
 * `formatCurrency` / `formatDate`, and the currency symbol was inconsistent
 * (the dashboard used ₥ U+20A5, everything else used ₵ U+20B5). This is the
 * single source of truth: thousands-separated, two decimals, prefixed with
 * whichever currency is configured in Settings → Business Info (see
 * `lib/currency.ts`; defaults to the Ghana Cedi).
 */

import { currencySymbol, getCurrencyCode } from './currency';

export function formatCurrency(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${currencySymbol(getCurrencyCode())}${n.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return n.toLocaleString('en-GH');
}

export function formatDecimal(value: number | null | undefined, digits = 2): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return n.toLocaleString('en-GH', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${n.toFixed(digits)}%`;
}

/** e.g. "3 Sep 2026" */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** e.g. "3 Sep 2026, 14:30" */
export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Short axis label for charts, e.g. "Sep 3" */
export function formatChartDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Compact currency for chart axes, e.g. "₵12k" */
export function formatCurrencyCompact(value: number): string {
  const symbol = currencySymbol(getCurrencyCode());
  if (Math.abs(value) >= 1000) return `${symbol}${(value / 1000).toFixed(0)}k`;
  return `${symbol}${value}`;
}
