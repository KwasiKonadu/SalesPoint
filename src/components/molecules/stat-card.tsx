"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendBadge } from "@/components/atoms/trend-badge";
import { cn } from "@/lib/utils";

/**
 * Compact metric tile: a round icon chip, then the label, value and an optional
 * period-over-period change pill stacked beside it. Used by the dashboard KPI
 * row, the inventory / expense summaries and the customer / supplier profiles.
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
  change,
  changeSuffix = "vs last month",
  trendTooltip,
  isLoading = false,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  /** Overrides the icon chip's background / text colour (Tailwind classes). */
  iconClassName?: string;
  change?: number;
  changeSuffix?: string;
  trendTooltip?: string;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary",
          iconClassName,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {isLoading ? (
          <Skeleton className="h-6 w-24" />
        ) : (
          <span className="truncate text-lg font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
        )}
        {typeof change === "number" && !isLoading && (
          <div className="flex items-center gap-1">
            <TrendBadge change={change} tooltip={trendTooltip} />
            <span className="text-[10px] text-muted-foreground">
              {changeSuffix}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}
