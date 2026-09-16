'use client';

import { useState } from 'react';
import { Eye, Plus, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataPagination } from '@/components/molecules/data-pagination';
import { DataTable } from '@/components/organisms/data-table';
import { SearchSelect } from '@/components/molecules/search-select';
import type { Restock, Supplier } from '@/lib/inventory';

import { NewRestockDialog } from './new-restock-dialog';
import { RestockDetailDialog } from './restock-detail-dialog';
import { restockColumns } from './inventory-columns';
import type { useRestocks } from './use-inventory';

const PAYMENT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'unpaid', label: 'Unpaid' },
];

/** Restock tab: supplier / payment filters, restock list, new-restock wizard. */
export function RestockTab({
  restocks,
  suppliers,
  isAdmin,
  newRestockOpen,
  onNewRestockOpenChange,
}: {
  restocks: ReturnType<typeof useRestocks>;
  suppliers: Supplier[];
  isAdmin: boolean;
  newRestockOpen: boolean;
  onNewRestockOpenChange: (open: boolean) => void;
}) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const viewDetail = (id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex w-full flex-1 flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="w-full sm:w-52">
            <SearchSelect
              size="sm"
              clearable={false}
              placeholder="All Suppliers"
              value={restocks.supplierFilter}
              onChange={restocks.setSupplierFilter}
              options={[
                { value: 'all', label: 'All Suppliers' },
                ...suppliers.map((s) => ({ value: s.id, label: s.businessName })),
              ]}
            />
          </div>
          <div className="w-full sm:w-40">
            <SearchSelect
              size="sm"
              clearable={false}
              placeholder="All Statuses"
              value={restocks.paymentFilter}
              onChange={restocks.setPaymentFilter}
              options={PAYMENT_FILTER_OPTIONS}
            />
          </div>
        </div>

        {isAdmin && (
          <Button
            onClick={() => onNewRestockOpenChange(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            New Restock
          </Button>
        )}
      </div>

      <DataTable<Restock>
        columns={restockColumns}
        data={restocks.data}
        getRowKey={(r) => r.id}
        isLoading={restocks.loading}
        emptyIcon={Truck}
        emptyMessage={
          restocks.hasFilters
            ? 'No restocks match your filters.'
            : 'No restocks recorded yet.'
        }
        emptyAction={
          isAdmin ? (
            <Button
              size="sm"
              onClick={() => onNewRestockOpenChange(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Create First Restock
            </Button>
          ) : undefined
        }
        rowActions={(r) => [
          { label: 'View', icon: Eye, onClick: () => viewDetail(r.id) },
        ]}
      />
      <DataPagination
        page={restocks.page}
        totalPages={Math.ceil(restocks.total / restocks.pageSize)}
        onPageChange={restocks.setPage}
        total={restocks.total}
        pageSize={restocks.pageSize}
        noun="restocks"
        showNumbers
      />

      <NewRestockDialog
        open={newRestockOpen}
        onOpenChange={onNewRestockOpenChange}
        onSubmitted={restocks.refresh}
      />
      <RestockDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        restockId={detailId}
      />
    </div>
  );
}
