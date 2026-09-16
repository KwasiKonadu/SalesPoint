import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QUICK_ACTIONS } from "@/lib/dashboard";

/** Shortcut buttons to the common create flows. */
export function QuickActionsCard() {
  return (
    <Card className="flex-[1] shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.href}
              asChild
              variant="outline"
              className="h-auto flex-col gap-2 py-3 hover:bg-primary/5"
            >
              <Link href={action.href}>
                <action.icon className={cn("h-5 w-5", action.color)} />
                <span className="text-xs font-medium">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
