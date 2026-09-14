"use client";

import { cn } from "@/lib/utils";
import type { PosCategory } from "@/lib/pos";

/** Horizontal pill row for filtering the product grid by category. */
export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelect,
}: {
  categories: PosCategory[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}) {
  return (
    <div className="px-4 pb-3">
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        <Pill active={!selectedCategoryId} onClick={() => onSelect(null)}>
          All
        </Pill>
        {categories.map((cat) => (
          <Pill
            key={cat.id}
            active={selectedCategoryId === cat.id}
            onClick={() => onSelect(cat.id)}
          >
            {cat.name}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
