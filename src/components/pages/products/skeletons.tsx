import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for the product table view. */
export function ProductTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

/** Loading placeholder for the product grid view. */
export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-card">
          <Skeleton className="h-24 w-full rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="flex gap-1.5 pt-1">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Loading placeholder for the categories management list. */
export function CategoryTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}
