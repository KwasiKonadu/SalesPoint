"use client";

import { CalendarDays, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PERIOD_KEYS, PERIOD_LABELS, type PeriodKey } from "@/lib/reports";
import { cn } from "@/lib/utils";

/** Reports header: title, period tabs, refresh, and the custom date-range row. */
export function PeriodSelector({
  period,
  onPeriodChange,
  customStart,
  onCustomStartChange,
  customEnd,
  onCustomEndChange,
  refreshing,
  onRefresh,
}: {
  period: PeriodKey;
  onPeriodChange: (period: PeriodKey) => void;
  customStart: string;
  onCustomStartChange: (value: string) => void;
  customEnd: string;
  onCustomEndChange: (value: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyze your business performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs
            value={period}
            onValueChange={(v) => onPeriodChange(v as PeriodKey)}
          >
            <TabsList className="h-auto flex-wrap gap-1">
              {PERIOD_KEYS.map((p) => (
                <TabsTrigger key={p} value={p} className="px-3 text-xs">
                  {PERIOD_LABELS[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="shrink-0"
          >
            <RefreshCw
              className={cn("mr-1.5 h-4 w-4", refreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {period === "custom" && (
        <Card className="shadow-sm">
          <CardContent className="pt-0">
            <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">From</span>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">To</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button
                size="sm"
                onClick={onRefresh}
                disabled={!customStart || !customEnd || refreshing}
              >
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
