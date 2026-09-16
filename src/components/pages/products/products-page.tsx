"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { Category, ProductItem, ViewMode } from "@/lib/products";
import { useCategories, useDeleteCategory, useSaveCategory } from "@/hooks/api/use-categories";
import { TabBar } from "@/components/molecules/tab-bar";
import { PageTabsSlot } from "@/components/molecules/page-tabs";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { assignTypeChipColors } from "@/components/atoms/type-chip";
import { CategoriesTab } from "./categories-tab";
import { CategoryFormPanel } from "./category-form-panel";
import { ProductFormPanel } from "./product-form-panel";
import { ProductGridView } from "./product-grid-view";
import { ProductTableView } from "./product-table-view";
import { ProductsToolbar } from "./products-toolbar";
import {
  ProductGridSkeleton,
  ProductTableSkeleton,
} from "./skeletons";
import { useDeleteProduct, useProductsCatalog, useSaveProduct } from "./use-products";
import { ViewProductDialog } from "./view-product-dialog";

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"products" | "categories">(
    "products",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const catalog = useProductsCatalog();
  const categoryAdminQuery = useCategories({ all: true, enabled: activeTab === "categories" });
  const categoryAdmin = { categories: categoryAdminQuery.data ?? [], loading: categoryAdminQuery.isPending };
  const saveProduct = useSaveProduct();
  const deleteProduct = useDeleteProduct();
  const saveCategory = useSaveCategory();
  const deleteCategory = useDeleteCategory();

  // Give the visible categories distinct chip colours (no hash collisions).
  assignTypeChipColors(catalog.categories.map((c) => c.name));

  // Product dialogs
  const [productPanelOpen, setProductPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null,
  );
  const [viewingProduct, setViewingProduct] = useState<ProductItem | null>(
    null,
  );
  const [viewOpen, setViewOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Category dialogs
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [catDeleteOpen, setCatDeleteOpen] = useState(false);

  // ---- Product actions ----
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductPanelOpen(true);
  };
  const openEditProduct = (product: ProductItem) => {
    setEditingProduct(product);
    setProductPanelOpen(true);
  };
  const openViewProduct = (product: ProductItem) => {
    setViewingProduct(product);
    setViewOpen(true);
  };

  const toggleProductActive = async (product: ProductItem) => {
    try {
      await saveProduct.mutateAsync({ id: product.id, isActive: !product.isActive } as never);
      toast.success(
        product.isActive ? "Product deactivated" : "Product activated",
      );
    } catch {
      toast.error("Failed to update product");
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct.mutateAsync(deletingProduct.id);
      toast.success("Product deactivated");
      setDeleteOpen(false);
      setDeletingProduct(null);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  // ---- Category actions ----
  const openAddCategory = () => {
    setEditingCategory(null);
    setCatFormOpen(true);
  };
  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatFormOpen(true);
  };

  const toggleCategoryActive = async (cat: Category) => {
    try {
      await saveCategory.mutateAsync({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        isActive: !cat.isActive,
      });
      toast.success(
        cat.isActive ? "Category deactivated" : "Category activated",
      );
    } catch {
      toast.error("Failed to update category");
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      toast.success("Category deactivated");
      setCatDeleteOpen(false);
      setDeletingCategory(null);
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const viewProps = {
    products: catalog.products,
    hasFilters: catalog.hasFilters,
    page: catalog.page,
    totalPages: catalog.totalPages,
    total: catalog.total,
    pageSize: catalog.pageSize,
    onPageChange: catalog.setPage,
    onAdd: openAddProduct,
    onEdit: openEditProduct,
  };

  return (
    <div className="space-y-4">
      <PageTabsSlot>
        <TabBar
          bare
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t as "products" | "categories")}
          tabs={[
            { key: "products", label: "Products" },
            { key: "categories", label: "Categories" },
          ]}
        />
      </PageTabsSlot>

      {activeTab === "products" && (
        <div>
          <ProductsToolbar
            search={catalog.search}
            onSearchChange={catalog.setSearch}
            categories={catalog.categories}
            categoryFilter={catalog.categoryFilter}
            onCategoryChange={catalog.setCategoryFilter}
            statusFilter={catalog.statusFilter}
            onStatusChange={catalog.setStatusFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onAddProduct={openAddProduct}
          />

          {catalog.loading ? (
            viewMode === "table" ? (
              <ProductTableSkeleton />
            ) : (
              <ProductGridSkeleton />
            )
          ) : viewMode === "table" ? (
            <ProductTableView
              {...viewProps}
              onView={openViewProduct}
              onToggleActive={toggleProductActive}
              onDelete={(product) => {
                setDeletingProduct(product);
                setDeleteOpen(true);
              }}
            />
          ) : (
            <ProductGridView
              {...viewProps}
              categories={catalog.categories}
              onView={openViewProduct}
              onToggleActive={toggleProductActive}
            />
          )}
        </div>
      )}

      {activeTab === "categories" && (
        <CategoriesTab
          categories={categoryAdmin.categories}
          loading={categoryAdmin.loading}
          onAdd={openAddCategory}
          onEdit={openEditCategory}
          onToggle={toggleCategoryActive}
          onDelete={(cat) => {
            setDeletingCategory(cat);
            setCatDeleteOpen(true);
          }}
        />
      )}

      {/* ==================== Dialogs ==================== */}
      <ProductFormPanel
        open={productPanelOpen}
        onOpenChange={setProductPanelOpen}
        product={editingProduct}
        productTypes={catalog.productTypes}
        categories={catalog.categories}
        units={catalog.units}
      />

      <ViewProductDialog
        product={viewingProduct}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Deactivate Product"
        description={
          <>
            Are you sure you want to deactivate &quot;{deletingProduct?.name}
            &quot;? This will mark the product as inactive. You can reactivate
            it later.
          </>
        }
        confirmLabel="Deactivate"
        loading={deleteProduct.isPending}
        onConfirm={confirmDeleteProduct}
      />

      <CategoryFormPanel
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        category={editingCategory}
      />

      <ConfirmDialog
        open={catDeleteOpen}
        onOpenChange={setCatDeleteOpen}
        title="Deactivate Category"
        description={
          <>
            Are you sure you want to deactivate &quot;{deletingCategory?.name}
            &quot;? Products in this category will not be deleted.
          </>
        }
        confirmLabel="Deactivate"
        loading={deleteCategory.isPending}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
}
