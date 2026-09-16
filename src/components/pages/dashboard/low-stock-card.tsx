import { Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LowStockProduct } from "@/lib/dashboard";

/** Products at or below their minimum stock level. */
export function LowStockCard({ products }: { products: LowStockProduct[] }) {
  return (
    <Card className="flex min-h-0 flex-[3] flex-col shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Low Stock Alert</CardTitle>
          <Badge
            variant={products.length > 0 ? "destructive" : "secondary"}
            className="text-xs"
          >
            {products.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-0">
        {products.length === 0 ? (
          <div className="py-8 text-center">
            <Package className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              All products are well stocked
            </p>
          </div>
        ) : (
          <div className="h-full space-y-3 overflow-y-auto">
            {products.map((item) => {
              const isOut = item.quantity === 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white",
                      isOut ? "bg-red-500" : "bg-amber-500",
                    )}
                  >
                    {item.product.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} / {item.threshold} min
                    </p>
                  </div>
                  <Badge
                    variant={isOut ? "destructive" : "outline"}
                    className={cn(
                      "shrink-0 text-xs",
                      !isOut && "border-amber-300 bg-amber-50 text-amber-700",
                    )}
                  >
                    {isOut ? "Out of Stock" : "Low Stock"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
