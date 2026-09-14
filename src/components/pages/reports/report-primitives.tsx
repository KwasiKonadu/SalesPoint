import { FileText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Centered "no data" panel used inside every report card. */
export function ReportEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * Standard report card shell: shows `skeleton` while loading with no data yet,
 * the empty state when there is no data, otherwise `children`.
 */
export function ReportCard({
  title,
  description,
  loading,
  hasData,
  skeleton,
  emptyMessage = "Not enough data to generate this report",
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  hasData: boolean;
  skeleton: React.ReactNode;
  emptyMessage?: string;
  children: React.ReactNode;
}) {
  if (loading && !hasData) return <>{skeleton}</>;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? children : <ReportEmptyState message={emptyMessage} />}
      </CardContent>
    </Card>
  );
}
