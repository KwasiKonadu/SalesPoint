"use client";

import { useState } from "react";
import { Plus, Truck } from "lucide-react";
import { toast } from "sonner";

import type { Supplier } from "@/lib/suppliers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { ContactCard } from "@/components/molecules/contact-card";
import { DataPagination } from "@/components/molecules/data-pagination";
import { EmptyState } from "@/components/molecules/empty-state";
import { SearchInput } from "@/components/molecules/search-input";
import { SupplierFormPanel } from "./supplier-form-panel";
import { SupplierProfileDialog } from "./supplier-profile-dialog";
import { useDeleteSupplier, useSuppliersList } from "./use-suppliers";

export default function SuppliersPage() {
  const list = useSuppliersList();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingSupplierId, setViewingSupplierId] = useState<string | null>(
    null,
  );

  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(
    null,
  );
  const deleteSupplier = useDeleteSupplier();

  const openAdd = () => {
    setEditingSupplier(null);
    setFormOpen(true);
  };
  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormOpen(true);
  };

  const openView = (supplier: Supplier) => {
    setViewingSupplierId(supplier.id);
    setViewOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingSupplier) return;
    try {
      await deleteSupplier.mutateAsync(deletingSupplier.id);
      toast.success("Supplier deactivated");
      setDeletingSupplier(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete supplier",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={list.search}
          onChange={list.setSearch}
          placeholder="Search suppliers..."
        />
        <Button onClick={openAdd} icon={<Plus className="size-4" />}>
          Add Supplier
        </Button>
      </div>

      {list.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : list.suppliers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={list.search ? "No matching suppliers" : "No suppliers yet"}
          description={
            list.search
              ? "Try a different search term."
              : "Add your first supplier to start tracking purchases and orders."
          }
          action={
            !list.search && (
              <Button onClick={openAdd} icon={<Plus className="size-4" />}>
                Add Supplier
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.suppliers.map((s) => (
            <ContactCard
              key={s.id}
              className="w-full"
              name={s.businessName}
              subtitle={s.contactPerson ?? undefined}
              location={s.address ?? undefined}
              statusPill={{
                label: s.isActive ? "Active" : "Inactive",
                color: s.isActive ? "green" : "gray",
              }}
              details={[
                {
                  label: "Restocks",
                  value: String(s._count?.restocks ?? 0),
                },
              ]}
              email={s.email ?? undefined}
              phone={s.phone ?? undefined}
              onClick={() => openView(s)}
              onEdit={() => openEdit(s)}
              onDelete={() => setDeletingSupplier(s)}
            />
          ))}
        </div>
      )}

      <DataPagination
        page={list.page}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        total={list.total}
        pageSize={list.pageSize}
        noun="suppliers"
        showNumbers
      />

      <SupplierFormPanel
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={editingSupplier}
      />

      <SupplierProfileDialog
        supplierId={viewingSupplierId}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

      <ConfirmDialog
        open={!!deletingSupplier}
        onOpenChange={(o) => !o && setDeletingSupplier(null)}
        title="Deactivate Supplier"
        description={
          <>
            Are you sure you want to deactivate &quot;
            {deletingSupplier?.businessName}&quot;? This will mark the supplier
            as inactive. You can reactivate it later.
          </>
        }
        confirmLabel="Deactivate"
        loading={deleteSupplier.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
