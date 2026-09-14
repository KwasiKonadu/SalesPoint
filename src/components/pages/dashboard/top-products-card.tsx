import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { DASHBOARD_PRODUCT_COLORS, type TopProduct } from "@/lib/dashboard";

/** Top selling products by revenue. */
export function TopProductsCard({ products }: { products: TopProduct[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Top Selling Products</CardTitle>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-sm text-primary"
          >
            <Link href="/products">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {products.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No sales data yet
          </p>
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{
                    backgroundColor:
                      DASHBOARD_PRODUCT_COLORS[
                        index % DASHBOARD_PRODUCT_COLORS.length
                      ],
                  }}
                >
                  {product.productName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {product.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.quantitySold} sold
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
