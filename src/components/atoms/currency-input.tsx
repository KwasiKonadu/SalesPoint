'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldLabel } from '@/components/atoms/field-label';
import { CURRENCIES, useCurrencyCode } from '@/lib/currency';

interface CurrencyInputProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: number | string;
  currency?: string;
  onValueChange?: (value: string) => void;
  onCurrencyChange?: (currency: string) => void;
  /** Show the currency as static text instead of a selector. */
  lockCurrency?: boolean;
  id?: string;
}

/**
 * Money field: a currency prefix (locked text or a selector) joined to an
 * amount input that shows a plain number while focused and a
 * thousands-separated, 2-dp value when blurred. `currency` defaults to the
 * business's configured currency (Settings → Business Info) when omitted.
 */
export function CurrencyInput({
  label,
  error,
  placeholder = '0.00',
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  lockCurrency = false,
  id,
}: CurrencyInputProps) {
  // Always call the hook (Rules of Hooks) even when `currency` overrides it.
  const configuredCurrency = useCurrencyCode();
  const activeCurrency = currency ?? configuredCurrency;
  const [local, setLocal] = useState(() => (value == null || value === '' ? '' : String(value)));
  const [focused, setFocused] = useState(false);

  // Sync down when the controlled `value` changes externally (adjust during
  // render — the React-recommended alternative to an effect).
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    const numeric = local === '' ? 0 : Number(local);
    const incoming = value == null || value === '' ? 0 : Number(value);
    if (incoming !== numeric) setLocal(incoming === 0 ? '' : String(incoming));
  }

  const displayValue =
    focused || local === ''
      ? local
      : Number(local).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <FieldLabel htmlFor={id} title={label}>
          {label}
        </FieldLabel>
      )}
      <div
        className={cn(
          'flex h-9 items-stretch overflow-hidden rounded-md border bg-transparent shadow-xs transition-colors dark:bg-input/30',
          'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
          error ? 'border-destructive' : 'border-input',
        )}
      >
        {lockCurrency ? (
          <div className="flex shrink-0 items-center border-r border-input px-3 text-sm text-muted-foreground">
            {activeCurrency}
          </div>
        ) : (
          <div className="relative flex shrink-0 items-center border-r border-input pl-3 pr-7">
            <select
              value={activeCurrency}
              onChange={(e) => onCurrencyChange?.(e.target.value)}
              className="cursor-pointer appearance-none bg-transparent text-sm text-muted-foreground outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '');
            setLocal(raw);
            onValueChange?.(raw);
          }}
          placeholder={placeholder}
          className="w-full min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
