import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for an area / bar chart card. */
export function ChartSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-87.5 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

/** Loading placeholder for a donut chart card. */
export function PieChartSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-75 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

/** Loading placeholder for a report table card. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
