"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Package, Star, StarOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/atoms/status-chip";
import { EmptyState } from "@/components/molecules/empty-state";
import { SearchInput } from "@/components/molecules/search-input";
import { SearchSelect } from "@/components/molecules/search-select";
import { useCategories } from "@/hooks/api/use-categories";
import { formatCurrency } from "@/lib/format";
import { effectivePrice, isDiscountLive } from "@/lib/pricing";
import { variantLabel, type ProductItem } from "@/lib/products";
import { cn } from "@/lib/utils";

import { ProductImage } from "../products/product-image";
import { useAllProducts, useWebsiteProductsBulk } from "../products/use-products";

type Show = "all" | "on" | "off";

/** Pick many products and put them on the website, take them off, or feature them, in one go. */
export function ProductsTab() {
  const { data: products = [], isPending } = useAllProducts(true);
  const { data: categories = [] } = useCategories();
  const bulk = useWebsiteProductsBulk();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [show, setShow] = useState<Show>("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const active = products.filter((p) => p.isActive);
  const onCount = active.filter((p) => p.showOnWebsite).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return active
      .filter((p) => (show === "on" ? p.showOnWebsite : show === "off" ? !p.showOnWebsite : true))
      .filter((p) => !category || p.categoryId === category)
      .filter((p) => !q || `${p.name} ${variantLabel(p)} ${p.sku}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [active, search, category, show]);

  const allPicked = rows.length > 0 && rows.every((p) => picked.has(p.id));
  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      if (!n.delete(id)) n.add(id);
      return n;
    });
  const togglePage = () =>
    setPicked((s) => {
      const n = new Set(s);
      if (allPicked) rows.forEach((p) => n.delete(p.id));
      else rows.forEach((p) => n.add(p.id));
      return n;
    });

  const apply = async (change: { showOnWebsite?: boolean; featured?: boolean }, done: string) => {
    const ids = [...picked];
    try {
      const r = await bulk.mutateAsync({ ids, ...change });
      toast.success(`${done}: ${r.updated} product${r.updated === 1 ? "" : "s"}`);
      setPicked(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update products");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose which products appear on the website. Tick as many as you like, then use the buttons that appear.{" "}
        <b>{onCount}</b> of {active.length} products are on the website now.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products…" />
        <div className="w-full sm:w-52">
          <SearchSelect
            placeholder="All categories"
            showAllOption
            allLabel="All categories"
            value={category}
            onChange={setCategory}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        <div className="flex rounded-md border p-0.5 text-sm">
          {([["all", "All"], ["on", "On website"], ["off", "Not on website"]] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setShow(v)}
              className={cn("rounded px-3 py-1 transition-colors", show === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {picked.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-md">
          <span className="mr-auto text-sm font-medium">{picked.size} selected</span>
          <Button size="sm" disabled={bulk.isPending} icon={<Eye className="size-3.5" />} onClick={() => apply({ showOnWebsite: true }, "Put on website")}>
            Put on website
          </Button>
          <Button size="sm" variant="outline" disabled={bulk.isPending} icon={<EyeOff className="size-3.5" />} onClick={() => apply({ showOnWebsite: false }, "Removed from website")}>
            Remove from website
          </Button>
          <Button size="sm" variant="outline" disabled={bulk.isPending} icon={<Star className="size-3.5" />} onClick={() => apply({ featured: true }, "Featured")}>
            Feature
          </Button>
          <Button size="sm" variant="outline" disabled={bulk.isPending} icon={<StarOff className="size-3.5" />} onClick={() => apply({ featured: false }, "Unfeatured")}>
            Unfeature
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Package} title="No products match" description="Try a different search or filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <label className="flex items-center gap-3 border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
            <Checkbox checked={allPicked} onCheckedChange={togglePage} aria-label="Select all shown" />
            Select all {rows.length} shown
          </label>
          <ul className="divide-y">
            {rows.map((p) => (
              <Row key={p.id} p={p} checked={picked.has(p.id)} onToggle={() => toggle(p.id)} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ p, checked, onToggle }: { p: ProductItem; checked: boolean; onToggle: () => void }) {
  const onSale = isDiscountLive(p, "web");
  return (
    <li>
      <label className={cn("flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/40", checked && "bg-primary/5")}>
        <Checkbox checked={checked} onCheckedChange={onToggle} aria-label={`Select ${p.name}`} />
        <ProductImage name={p.name} image={p.image} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{p.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[variantLabel(p), p.category?.name].filter(Boolean).join(" · ") || p.sku}
          </p>
        </div>
        <span className="hidden text-sm tabular-nums sm:block">
          {onSale && <span className="mr-1.5 text-xs text-muted-foreground line-through">{formatCurrency(p.sellingPrice)}</span>}
          {formatCurrency(effectivePrice(p, new Date(), "web"))}
        </span>
        {p.featured && <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />}
        <StatusChip
          label={p.showOnWebsite ? "On website" : "Not on website"}
          variant={p.showOnWebsite ? "success" : "neutral"}
          className="shrink-0"
        />
      </label>
    </li>
  );
}
