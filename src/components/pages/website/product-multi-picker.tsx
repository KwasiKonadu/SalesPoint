"use client";

import { X } from "lucide-react";

import { SearchSelect } from "@/components/molecules/search-select";
import { productLabel, type ProductItem } from "@/lib/products";

/** Pick products from the ones shown on the website; selected ones appear as removable chips. */
export function ProductMultiPicker({
  label,
  products,
  value,
  onChange,
  max,
}: {
  label: string;
  products: ProductItem[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** Cap on how many can be picked (1 = single product). */
  max?: number;
}) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const full = max !== undefined && value.length >= max;
  return (
    <div className="space-y-2">
      {!full && (
        <SearchSelect
          label={label}
          placeholder="Search products on the website…"
          value=""
          onChange={(id) => id && !value.includes(id) && onChange([...value, id])}
          options={products
            .filter((p) => !value.includes(p.id))
            .map((p) => ({ value: p.id, label: productLabel(p), sublabel: p.sku }))}
        />
      )}
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <li key={id} className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-1 text-xs">
              {byId.has(id) ? productLabel(byId.get(id)!) : "Unavailable product"}
              <button
                type="button"
                aria-label="Remove"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onChange(value.filter((x) => x !== id))}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
