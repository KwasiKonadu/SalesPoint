'use client';

import { useState, useRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type TableButtonVariant = 'green' | 'blue' | 'orange' | 'red' | 'gray';

const VARIANT_CLASSES: Record<TableButtonVariant, string> = {
  green: 'text-emerald-700 border-emerald-600 hover:bg-emerald-600 dark:text-emerald-400',
  blue: 'text-primary border-primary hover:bg-primary',
  orange: 'text-amber-600 border-amber-500 hover:bg-amber-500',
  red: 'text-destructive border-destructive hover:bg-destructive',
  gray: 'text-muted-foreground border-input hover:bg-muted-foreground',
};

const SPINNER_OUTER: Record<TableButtonVariant, string> = {
  green: 'border-t-emerald-600',
  blue: 'border-t-primary',
  orange: 'border-t-amber-500',
  red: 'border-t-destructive',
  gray: 'border-t-muted-foreground',
};

const SPINNER_INNER: Record<TableButtonVariant, string> = {
  green: 'border-b-emerald-300',
  blue: 'border-b-primary/40',
  orange: 'border-b-amber-300',
  red: 'border-b-destructive/40',
  gray: 'border-b-muted-foreground/40',
};

const TOOLTIP_MAX_WIDTH = 240;
const EDGE_GAP = 8;

interface TableButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: TableButtonVariant;
  tooltip?: string;
}

/**
 * Compact outlined text button for a table row/cell — fills solid on hover,
 * shows a dual-ring spinner in place of its label while `isLoading`, and an
 * optional fixed-position tooltip that flips to stay on-screen near an edge.
 */
export function TableButton({
  isLoading,
  disabled,
  variant = 'blue',
  tooltip,
  children,
  className,
  ...props
}: TableButtonProps) {
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (!tooltip || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const idealLeft = rect.left + rect.width / 2 - TOOLTIP_MAX_WIDTH / 2;
    const clampedLeft = Math.max(
      EDGE_GAP,
      Math.min(idealLeft, window.innerWidth - TOOLTIP_MAX_WIDTH - EDGE_GAP),
    );
    setTooltipPos({ left: clampedLeft, top: rect.top });
  };

  return (
    <span ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled || isLoading}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTooltipPos(null)}
        className={cn(
          'rounded border px-2 py-1 text-xs font-medium transition-all hover:scale-[1.2] hover:text-white active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
          VARIANT_CLASSES[variant],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex w-8 items-center justify-center">
            <span className="relative h-3.5 w-3.5">
              <span
                className={cn(
                  'absolute inset-0 animate-spin rounded-full border-2 border-transparent',
                  SPINNER_OUTER[variant],
                )}
              />
              <span
                className={cn(
                  'absolute inset-0.75 animate-[spin_.6s_linear_infinite_reverse] rounded-full border-2 border-transparent',
                  SPINNER_INNER[variant],
                )}
              />
            </span>
          </span>
        ) : (
          children
        )}
      </button>

      {tooltipPos && tooltip && (
        <span
          style={{
            position: 'fixed',
            left: tooltipPos.left,
            top: tooltipPos.top - 8,
            width: TOOLTIP_MAX_WIDTH,
            transform: 'translateY(-100%)',
            zIndex: 9999,
          }}
          className="pointer-events-none"
        >
          <span className="block rounded-lg bg-foreground px-1 py-1.5 text-center text-xs whitespace-nowrap text-background shadow-lg">
            {tooltip}
          </span>
          <span className="mx-auto -mt-1 block h-2 w-2 rotate-45 rounded-sm bg-foreground" />
        </span>
      )}
    </span>
  );
}
