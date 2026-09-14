"use client";

import { FolderOpen, Pencil, Plus, Power, Tag, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/organisms/data-table";
import type { Category } from "@/lib/products";

import { CategoryTableSkeleton } from "./skeletons";

const categoryColumns: Column<Category>[] = [
  {
    key: "name",
    label: "Category",
    render: (cat) => (
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded bg-primary/10 text-base">
          {cat.icon ? (
            <span aria-hidden>{cat.icon}</span>
          ) : (
            <Tag className="size-4 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium">{cat.name}</p>
          {cat.description && (
            <p className="truncate text-xs text-muted-foreground">
              {cat.description}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "products",
    label: "Products",
    align: "right",
    width: "6rem",
    render: (cat) => (
      <Badge
        variant={cat.isActive ? "outline" : "secondary"}
        className="font-normal tabular-nums"
      >
        {cat._count?.products ?? 0}
      </Badge>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: "6.5rem",
    render: (cat) => (
      <Badge
        variant={cat.isActive ? "default" : "secondary"}
        className="font-normal"
      >
        {cat.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

/** Categories management tab: table with product counts and per-row actions. */
export function CategoriesTab({
  categories,
  loading,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}: {
  categories: Category[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (cat: Category) => void;
  onToggle: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  if (loading) return <CategoryTableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} categories
        </p>
        <Button size="sm" onClick={onAdd} icon={<Plus className="size-4" />}>
          Add Category
        </Button>
      </div>

      <DataTable<Category>
        dense
        columns={categoryColumns}
        data={categories}
        getRowKey={(cat) => cat.id}
        rowClassName={(cat) => (!cat.isActive ? "opacity-60" : undefined)}
        rowActions={(cat) => [
          { label: "Edit", icon: Pencil, onClick: () => onEdit(cat) },
          {
            label: cat.isActive ? "Deactivate" : "Activate",
            icon: Power,
            onClick: () => onToggle(cat),
          },
          {
            label: "Delete",
            icon: Trash2,
            danger: true,
            onClick: () => onDelete(cat),
          },
        ]}
        emptyIcon={FolderOpen}
        emptyMessage="No categories yet"
        emptyDescription="Create categories to organize your products."
        emptyAction={
          <Button size="sm" onClick={onAdd} icon={<Plus className="size-4" />}>
            Add Category
          </Button>
        }
      />
    </div>
  );
}
