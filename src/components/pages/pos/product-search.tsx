"use client";

import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";

/** Search box above the POS product grid. */
export function ProductSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="p-4 pb-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products by name or SKU..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 rounded-xl border-muted-foreground/10 bg-muted/40 pl-10 text-base focus-visible:bg-background"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
