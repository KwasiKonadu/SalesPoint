import { formatCurrency } from "@/lib/format";

/** Tooltip for the sales-trend area chart. */
export function AreaTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

/** Tooltip for the donut charts (shows amount + optional percentage). */
export function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: { percentage?: number };
  }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="text-sm font-semibold">{item.name}</p>
      <p className="text-xs text-muted-foreground">
        {formatCurrency(item.value)}
        {item.payload.percentage !== undefined
          ? ` (${item.payload.percentage.toFixed(1)}%)`
          : ""}
      </p>
    </div>
  );
}

/** Tooltip for the bar charts. */
export function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

/** Wrapping legend with a colour swatch and optional percentage per entry. */
export function CustomLegend({
  payload,
}: {
  payload?: Array<{
    value: string;
    color: string;
    payload?: { percentage?: number };
  }>;
}) {
  if (!payload) return null;
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
          {entry.payload?.percentage !== undefined && (
            <span className="font-medium">
              {entry.payload.percentage.toFixed(1)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
