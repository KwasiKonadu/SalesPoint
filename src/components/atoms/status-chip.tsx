import React from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const VARIANTS: Record<StatusVariant, string> = {
  success: 'border-emerald-400 text-emerald-600 dark:border-emerald-500/60 dark:text-emerald-400',
  warning: 'border-amber-300 text-amber-700 dark:border-amber-500/50 dark:text-amber-400',
  danger: 'border-red-300 text-red-600 dark:border-red-500/50 dark:text-red-400',
  info: 'border-blue-300 text-blue-700 dark:border-blue-500/50 dark:text-blue-400',
  neutral: 'border-border text-muted-foreground',
};

/**
 * Outlined status pill used in table status columns: a coloured border + text,
 * no fill. Pick a semantic `variant` per state.
 */
export function StatusChip({
  label,
  variant = 'neutral',
  className,
}: {
  label: React.ReactNode;
  variant?: StatusVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center whitespace-nowrap rounded-full border px-2 py-px text-[11px] font-semibold uppercase tracking-tight',
        VARIANTS[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
