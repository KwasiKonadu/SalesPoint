"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/format";
import type { StaffMember } from "@/lib/staff";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/molecules/confirm-dialog";
import { ContactCard } from "@/components/molecules/contact-card";
import { DataPagination } from "@/components/molecules/data-pagination";
import { EmptyState } from "@/components/molecules/empty-state";
import { SearchInput } from "@/components/molecules/search-input";
import { StaffFormPanel } from "./staff-form-panel";
import { useDeactivateStaff, useStaffList } from "./use-staff";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  sales_person: "Sales Person",
};

export default function StaffPage() {
  const { user } = useAuth();
  const list = useStaffList();

  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(
    null,
  );
  const deactivateStaff = useDeactivateStaff();

  const openAdd = () => {
    setEditingStaff(null);
    setFormOpen(true);
  };
  const openEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormOpen(true);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateStaff.mutateAsync(deactivateTarget.id);
      toast.success(`${deactivateTarget.name} has been deactivated`);
      setDeactivateTarget(null);
    } catch {
      toast.error("Failed to deactivate staff member");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={list.search}
          onChange={list.setSearch}
          placeholder="Search staff..."
        />
        <Button onClick={openAdd} icon={<Plus className="size-4" />}>
          Add Staff
        </Button>
      </div>

      {list.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : list.staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title={list.search ? "No matching staff" : "No staff members yet"}
          description={
            list.search
              ? "Try a different search term."
              : "Add your first team member to give them access to StorePOS."
          }
          action={
            !list.search && (
              <Button
                variant="outline"
                size="sm"
                onClick={openAdd}
                icon={<Plus className="size-4" />}
              >
                Add your first staff member
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {list.staff.map((s) => (
            <ContactCard
              key={s.id}
              className="w-full"
              name={s.name}
              subtitle={ROLE_LABEL[s.role] ?? s.role}
              statusPill={{
                label: s.isActive ? "Active" : "Inactive",
                color: s.isActive ? "green" : "gray",
              }}
              details={[{ label: "Added", value: formatDate(s.createdAt) }]}
              email={s.email}
              phone={s.phone ?? undefined}
              onEdit={() => openEdit(s)}
              onDelete={
                s.id === user?.id ? undefined : () => setDeactivateTarget(s)
              }
            />
          ))}
        </div>
      )}

      <DataPagination
        page={list.page}
        totalPages={list.totalPages}
        onPageChange={list.setPage}
        noun="staff"
      />

      <StaffFormPanel
        open={formOpen}
        onOpenChange={setFormOpen}
        staff={editingStaff}
        onSaved={list.refetch}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => !o && setDeactivateTarget(null)}
        title={`Deactivate ${deactivateTarget?.name ?? ""}?`}
        description={`Are you sure you want to deactivate ${deactivateTarget?.name ?? "this member"}? They will no longer be able to access the system.`}
        confirmLabel="Deactivate"
        loading={deactivateStaff.isPending}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}
