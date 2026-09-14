import { Skeleton } from "@/components/ui/skeleton";

/** Field-list loading placeholder for the Business Info / Receipt tabs. */
export function SettingsFormSkeleton({
  rows = 6,
  labelWidth = "w-24",
}: {
  rows?: number;
  labelWidth?: string;
}) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className={`h-4 ${labelWidth}`} />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Table loading placeholder for the Product Config tab. */
export function ConfigTableSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
