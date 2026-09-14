"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function pageWindow(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (page > 3) pages.push("...");
  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(totalPages - 1, page + 1);
    i++
  ) {
    pages.push(i);
  }
  if (page < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

/**
 * List pagination bar: "Showing X–Y of Z" summary on the left, page controls
 * on the right. Set `showNumbers` for numbered page buttons (long lists),
 * otherwise a compact prev / "Page X of Y" / next.
 */
export function DataPagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
  noun = "items",
  showNumbers = false,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  pageSize?: number;
  noun?: string;
  showNumbers?: boolean;
}) {
  if (totalPages <= 1) return null;

  const summary =
    typeof total === "number" && typeof pageSize === "number" ? (
      <p className="text-sm text-muted-foreground">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}{" "}
        of {total} {noun}
      </p>
    ) : (
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
    );

  return (
    <div className="flex items-center justify-between gap-4">
      {summary}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {showNumbers ? (
          pageWindow(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`gap-${i}`} className="px-1 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            ),
          )
        ) : (
          <span className="px-2 text-sm font-medium">
            Page {page} of {totalPages}
          </span>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
