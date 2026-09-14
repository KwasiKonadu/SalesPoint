import Link from "next/link";
import { Package, PackagePlus, Plus, Store, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/molecules/empty-state";

/** Welcome panel shown when the business has no activity yet. */
export function DashboardEmptyState() {
  return (
    <Card className="shadow-sm">
      <CardContent>
        <EmptyState
          icon={Store}
          title="Welcome to StorePOS!"
          description="Your dashboard is ready. Start by adding products, processing your first sale, or setting up your inventory."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/pos">
                  <Plus className="mr-2 h-4 w-4" />
                  New Sale
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/products">
                  <Package className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/customers">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Customer
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/inventory">
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Restock
                </Link>
              </Button>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
