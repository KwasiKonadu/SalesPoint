"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import type { Category, ProductItem, ViewMode } from "@/lib/products";
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
import { useCategoryAdmin } from "./use-category-admin";
import { useProductsCatalog } from "./use-products-catalog";
import { ViewProductDialog } from "./view-product-dialog";

export default function ProductsPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"products" | "categories">(
    "products",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const catalog = useProductsCatalog();
  const categoryAdmin = useCategoryAdmin(activeTab === "categories");

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
  const [deleting, setDeleting] = useState(false);

  // Category dialogs
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [catDeleteOpen, setCatDeleteOpen] = useState(false);
  const [catDeleting, setCatDeleting] = useState(false);

  const reloadCategoryLists = () => {
    categoryAdmin.refresh();
    void catalog.reloadFilterCategories();
  };

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
    if (!user) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (res.ok) {
        toast.success(
          product.isActive ? "Product deactivated" : "Product activated",
        );
        catalog.refreshAll();
      }
    } catch {
      toast.error("Failed to update product");
    }
  };

  const confirmDeleteProduct = async () => {
    if (!user || !deletingProduct) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        toast.success("Product deactivated");
        setDeleteOpen(false);
        setDeletingProduct(null);
        catalog.refreshAll();
      }
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
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
    if (!user) return;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({
          name: cat.name,
          description: cat.description,
          isActive: !cat.isActive,
        }),
      });
      if (res.ok) {
        toast.success(
          cat.isActive ? "Category deactivated" : "Category activated",
        );
        reloadCategoryLists();
      }
    } catch {
      toast.error("Failed to update category");
    }
  };

  const confirmDeleteCategory = async () => {
    if (!user || !deletingCategory) return;
    setCatDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: "DELETE",
        headers: { "x-user-id": user.id },
      });
      if (res.ok) {
        toast.success("Category deactivated");
        setCatDeleteOpen(false);
        setDeletingCategory(null);
        reloadCategoryLists();
      }
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setCatDeleting(false);
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
        onSuccess={catalog.refreshAll}
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
        loading={deleting}
        onConfirm={confirmDeleteProduct}
      />

      <CategoryFormPanel
        open={catFormOpen}
        onOpenChange={setCatFormOpen}
        category={editingCategory}
        onSuccess={reloadCategoryLists}
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
        loading={catDeleting}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
}
