"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

import type { Customer } from "@/lib/customers";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { ContactCard } from "@/components/molecules/contact-card";
import { DataPagination } from "@/components/molecules/data-pagination";
import { EmptyState } from "@/components/molecules/empty-state";
import { SearchInput } from "@/components/molecules/search-input";
import { CustomerFormPanel } from "./customer-form-panel";
import { CustomerProfileDialog } from "./customer-profile-dialog";
import { useCustomersList, useDeleteCustomer } from "./use-customers";

export default function CustomersPage() {
  const list = useCustomersList();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null,
  );
  const deleteCustomer = useDeleteCustomer();

  const openAdd = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };
  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };
  const openProfile = (customer: Customer) => {
    setProfileId(customer.id);
    setProfileOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    try {
      await deleteCustomer.mutateAsync(deletingCustomer.id);
      toast.success("Customer deleted successfully");
      setDeletingCustomer(null);
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={list.search}
          onChange={list.setSearch}
          placeholder="Search customers..."
        />
        <Button onClick={openAdd} icon={<Plus className="size-4" />}>
          Add Customer
        </Button>
      </div>

      {list.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : list.customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={list.search ? "No matching customers" : "No customers yet"}
          description={
            list.search
              ? "Try a different search term."
              : "Add your first customer to start tracking their purchases."
          }
          action={
            !list.search && (
              <Button
                variant="outline"
                size="sm"
                onClick={openAdd}
                icon={<Plus className="size-4" />}
              >
                Add customer
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {list.customers.map((c) => (
            <ContactCard
              key={c.id}
              className="w-full"
              name={c.name}
              location={c.address ?? undefined}
              statusPill={{
                label: c.isActive ? "Active" : "Inactive",
                color: c.isActive ? "green" : "gray",
              }}
              details={[
                {
                  label: "Total Spent",
                  value: formatCurrency(c._sum?.totalAmount ?? 0),
                },
                {
                  label: "Purchases",
                  value: String(c._count?.sales ?? 0),
                },
              ]}
              email={c.email ?? undefined}
              phone={c.phone ?? undefined}
              onClick={() => openProfile(c)}
              onEdit={() => openEdit(c)}
              onDelete={() => setDeletingCustomer(c)}
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
        noun="customers"
      />

      <CustomerFormPanel
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editingCustomer}
      />

      <CustomerProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        customerId={profileId}
      />

      <ConfirmDialog
        open={!!deletingCustomer}
        onOpenChange={(o) => !o && setDeletingCustomer(null)}
        title="Delete Customer"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong>{deletingCustomer?.name}</strong>? This action cannot be
            undone.
          </>
        }
        confirmLabel="Delete"
        loading={deleteCustomer.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
