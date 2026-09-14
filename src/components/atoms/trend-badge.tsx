'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendBadgeProps {
  /** Percentage change. `> 0` up (green), `< 0` down (red), `0` neutral. */
  change: number;
  /** Optional text shown in a small tooltip on hover. */
  tooltip?: string;
  className?: string;
}

/**
 * Compact period-over-period change pill: a bordered chip with a trend arrow
 * and the absolute percentage. Hover reveals `tooltip` when provided.
 */
export function TrendBadge({ change, tooltip, className }: TrendBadgeProps) {
  const [show, setShow] = useState(false);
  const neutral = change === 0;
  const positive = change > 0;

  return (
    <span className={cn('relative inline-flex', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums',
          neutral && 'text-muted-foreground',
          !neutral && positive && 'text-emerald-600 dark:text-emerald-400',
          !neutral && !positive && 'text-red-500 dark:text-red-400',
          tooltip && 'cursor-default',
        )}
        onMouseEnter={() => tooltip && setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {!neutral &&
          (positive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          ))}
        {neutral ? '—' : `${Math.abs(change).toFixed(1)}%`}
      </span>

      {show && tooltip && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2">
          <span className="block whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-lg">
            {tooltip}
          </span>
          <span className="mx-auto -mt-1 block h-2 w-2 rotate-45 rounded-sm bg-foreground" />
        </span>
      )}
    </span>
  );
}
