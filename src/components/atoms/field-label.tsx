import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * The one label style for form fields. Every field atom (`TextField`,
 * `CurrencyInput`, `SearchSelect`, …) renders its label through this, so the
 * formatting lives in a single place. Pass `className` to tweak a one-off.
 */
export function FieldLabel({ className, children, ...props }: React.ComponentProps<'label'>) {
  return (
    <label className={cn('block truncate text-xs font-semibold', className)} {...props}>
      {children}
    </label>
  );
}
