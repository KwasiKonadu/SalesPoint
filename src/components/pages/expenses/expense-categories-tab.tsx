"use client";

import { Pencil, Plus, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryColor, type ExpenseCategory } from "@/lib/expenses";
import { cn } from "@/lib/utils";

/** Categories tab: a card grid of expense categories with an edit affordance. */
export function ExpenseCategoriesTab({
  categories,
  onAdd,
  onEdit,
}: {
  categories: ExpenseCategory[];
  onAdd: () => void;
  onEdit: (category: ExpenseCategory) => void;
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} categor{categories.length === 1 ? "y" : "ies"}
        </p>
        <Button onClick={onAdd} size="sm" icon={<Plus className="size-4" />}>
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Tag className="mb-3 size-12 text-muted-foreground/40" />
          <h3 className="font-medium">No categories yet</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Create categories to organize your expenses.
          </p>
          <Button onClick={onAdd} size="sm" icon={<Plus className="size-4" />}>
            Add Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const count = cat._count?.expenses ?? 0;
            return (
              <Card key={cat.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white",
                        getCategoryColor(cat.name),
                      )}
                    >
                      {cat.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="truncate font-medium">{cat.name}</h4>
                          {cat.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {cat.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => onEdit(cat)}
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {count} expense{count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
