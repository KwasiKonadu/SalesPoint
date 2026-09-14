"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { DASHBOARD_CHART_COLORS, type SalesByCategory } from "@/lib/dashboard";

import { PieTooltip } from "./dashboard-chart-parts";

/** Donut of revenue share by category, with a colour-keyed legend list. */
export function SalesByCategoryChart({
  categories,
}: {
  categories: SalesByCategory[];
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Sales by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No sales data available
          </div>
        ) : (
          <div className="flex h-64 items-center gap-4">
            <div className="h-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categories.map((_, index) => (
                      <Cell
                        key={index}
                        fill={
                          DASHBOARD_CHART_COLORS[
                            index % DASHBOARD_CHART_COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="max-h-64 w-40 space-y-2 overflow-y-auto">
              {categories.map((cat, index) => (
                <div
                  key={cat.category}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        DASHBOARD_CHART_COLORS[
                          index % DASHBOARD_CHART_COLORS.length
                        ],
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {cat.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(cat.percentage)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
