'use client';

import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Inbox,
  MoreVertical,
  Search,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableButton, type TableButtonVariant } from '@/components/atoms/table-button';
import { SearchSelect } from '@/components/molecules/search-select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/molecules/empty-state';
import { DataPagination } from '@/components/molecules/data-pagination';
import { cn } from '@/lib/utils';

export interface Column<T> {
  /** Stable key; also used as the React key for the cell. */
  key: string;
  label: React.ReactNode;
  /** CSS grid track for the column (e.g. `'12rem'`, `'20%'`, `'2fr'`). Defaults to `1fr`. */
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** Extra classes for both the header and body cells (e.g. responsive hiding). */
  className?: string;
  /** Header-only classes. */
  headClassName?: string;
  /** Show a sort control in this column's header. The parent owns the actual
   *  sorting via `sortKey` / `sortDir` / `onSort`. */
  sortable?: boolean;
  /** Cell renderer. Falls back to `String(row[key])`. `index` is the row's
   *  position in the current `data` array. */
  render?: (row: T, index: number) => React.ReactNode;
}

export interface RowAction {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
  danger?: boolean;
  /** Additional colour option beyond the default / danger split. */
  variant?: 'success';
  disabled?: boolean;
}

export interface SecondaryButton {
  label: string;
  onClick: () => void;
  icon?: React.ElementType;
  badgeCount?: number;
  disabled?: boolean;
  title?: string;
  className?: string;
}

const alignClass = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey?: (row: T, index: number) => React.Key;

  isLoading?: boolean;

  // --- Empty state ---
  emptyIcon?: React.ElementType;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;

  // --- Toolbar ---
  searchValue?: string;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  filterOptions?: { value: string; label: string }[];
  filterValue?: string;
  filterPlaceholder?: string;
  onFilter?: (value: string) => void;
  onExport?: () => void;
  extraFilters?: React.ReactNode;
  searchAfterFilters?: boolean;
  secondaryButtons?: SecondaryButton[];
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ElementType;
    disabled?: boolean;
  };

  // --- Sorting (controlled by the parent; pair with `column.sortable`) ---
  sortKey?: string | null;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;

  // --- Rows ---
  rowActions?: (row: T) => RowAction[];
  singleActionAsButton?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;

  // --- Pagination (rendered only when `onPageChange` is supplied) ---
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  total?: number;
  pageSize?: number;
  pageNoun?: string;
  showPageNumbers?: boolean;
  bare?: boolean;
  dense?: boolean;
  className?: string;
}

function RowActionsCell({
  actions,
  singleActionAsButton,
  dense,
}: {
  actions: RowAction[];
  singleActionAsButton: boolean;
  dense?: boolean;
}) {
  if (actions.length === 0) return null;

  const variantFor = (action: RowAction): TableButtonVariant =>
    action.danger ? 'red' : action.variant === 'success' ? 'green' : 'blue';

  // Dense: every action renders inline as a compact icon `TableButton` — no ⋯
  // menu. The action column is a fixed width (see `actionsTrack`) so the header
  // and body grids stay aligned.
  if (dense) {
    const only = actions.length === 1 ? actions[0] : null;

    if (only && only.icon) {
      const Icon = only.icon;
      return (
        <button
          type="button"
          title={only.label}
          aria-label={only.label}
          disabled={only.disabled}
          onClick={(e) => {
            e.stopPropagation();
            only.onClick();
          }}
          className={cn(
            'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
            only.danger && 'hover:bg-destructive/10 hover:text-destructive',
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      );
    }

    return (
      <div className="flex items-center justify-end gap-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <TableButton
              key={action.label}
              variant={variantFor(action)}
              tooltip={action.label}
              aria-label={action.label}
              disabled={action.disabled}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : action.label}
            </TableButton>
          );
        })}
      </div>
    );
  }

  if (actions.length === 1 && singleActionAsButton) {
    const action = actions[0];
    return (
      <TableButton
        variant={variantFor(action)}
        disabled={action.disabled}
        onClick={(e) => {
          e.stopPropagation();
          action.onClick();
        }}
      >
        {action.label}
      </TableButton>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground data-[state=open]:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open row actions</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            variant={action.danger ? 'destructive' : 'default'}
            disabled={action.disabled}
            className={cn(
              action.variant === 'success' && 'text-emerald-600 dark:text-emerald-400',
            )}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
          >
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export function DataTable<T>({
  columns,
  data,
  getRowKey = (_row, index) => index,
  isLoading = false,
  emptyIcon = Inbox,
  emptyMessage = 'No items found',
  emptyDescription,
  emptyAction,
  searchValue,
  onSearch,
  searchPlaceholder = 'Search...',
  filterOptions,
  filterValue,
  filterPlaceholder = 'All',
  onFilter,
  onExport,
  extraFilters,
  searchAfterFilters = false,
  secondaryButtons,
  actionButton,
  sortKey,
  sortDir,
  onSort,
  rowActions,
  singleActionAsButton = true,
  onRowClick,
  rowClassName,
  currentPage,
  totalPages,
  onPageChange,
  total,
  pageSize,
  pageNoun,
  showPageNumbers,
  bare = false,
  dense = false,
  className,
}: DataTableProps<T>) {
  const cellPad = dense ? 'gap-x-3 px-3 py-2' : 'gap-x-4 px-6 py-3';
  const insetX = dense ? 'left-1 right-1' : 'left-1 right-1';

  const hasFilterSelect = !!(filterOptions && onFilter);
  const hasToolbar = !!(
    onSearch ||
    extraFilters ||
    hasFilterSelect ||
    onExport ||
    (secondaryButtons && secondaryButtons.length > 0) ||
    actionButton
  );

  // Widest action set across the current rows — lets `dense` tables reserve a
  // fixed action column so the (separate) header and body grids stay aligned.
  const maxActions =
    dense && rowActions && data.length
      ? data.reduce((m, row) => Math.max(m, rowActions(row).length), 0)
      : 0;

  const actionsTrack = !rowActions
    ? null
    : dense
      ? maxActions > 1
        ? `${(maxActions * 2.6 + 0.5).toFixed(2)}rem` // inline icon TableButtons
        : '2.75rem' // single icon button
      : 'minmax(44px, max-content)';

  const gridTemplateColumns = [
    ...columns.map((c) => c.width ?? '1fr'),
    ...(actionsTrack ? [actionsTrack] : []),
  ].join(' ');

  const searchBox = onSearch && (
    <div className="relative w-full min-w-52 sm:max-w-sm sm:flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={searchValue ?? ''}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={searchPlaceholder}
        className="pl-9 pr-9"
      />
      {searchValue ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onSearch('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  const headerCells = (
    <>
      {columns.map((col) => {
        const sortable = col.sortable && onSort;
        const active = sortable && sortKey === col.key;
        const SortIcon = !active ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
        return (
          <div
            key={col.key}
            role="columnheader"
            className={cn(
              'min-w-0',
              col.align && alignClass[col.align],
              col.className,
              col.headClassName,
            )}
          >
            {sortable ? (
              <button
                type="button"
                onClick={() => onSort(col.key)}
                className={cn(
                  'inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-foreground',
                  col.align === 'right' && 'flex-row-reverse',
                  active && 'text-foreground',
                )}
              >
                {col.label}
                <SortIcon className="h-3 w-3 shrink-0" />
              </button>
            ) : (
              col.label
            )}
          </div>
        );
      })}
      {rowActions && <span />}
    </>
  );

  // A detached, floating rounded header bar sitting above the body with a gap.
  // `dense` only tightens the padding — the bar stays detached.
  const detachedHeader = (
    <div
      role="row"
      className={cn(
        'w-fit min-w-full grid rounded-lg border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        cellPad,
      )}
      style={{ gridTemplateColumns }}
    >
      {headerCells}
    </div>
  );

  return (
    <div className={cn('flex flex-col', dense ? 'gap-2' : 'gap-3', className)}>
      {/* Toolbar */}
      {hasToolbar && (
        <div className={cn(!bare && 'rounded-xl border bg-card px-4 py-2 shadow-sm')}>
          <div className="flex flex-wrap items-center gap-3">
            {!searchAfterFilters && searchBox}
            {extraFilters}
            {searchAfterFilters && searchBox}

            {hasFilterSelect && (
              <div className="w-44">
                <SearchSelect
                  size="sm"
                  clearable={false}
                  placeholder={filterPlaceholder}
                  value={filterValue ?? ''}
                  onChange={(v) => onFilter!(v)}
                  options={[
                    { value: '', label: filterPlaceholder },
                    ...filterOptions!,
                  ]}
                />
              </div>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  icon={<Upload className="h-4 w-4" />}
                >
                  Export
                </Button>
              )}

              {secondaryButtons?.map((btn) => (
                <Button
                  key={btn.label}
                  variant="outline"
                  size="sm"
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  title={btn.title}
                  className={btn.className}
                >
                  {btn.icon && <btn.icon className="h-4 w-4" />}
                  {btn.label}
                  {(btn.badgeCount ?? 0) > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
                      {btn.badgeCount}
                    </span>
                  )}
                </Button>
              ))}

              {actionButton && (
                <Button
                  size="sm"
                  onClick={actionButton.onClick}
                  disabled={actionButton.disabled}
                  icon={actionButton.icon ? <actionButton.icon className="h-4 w-4" /> : undefined}
                >
                  {actionButton.label}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header — detached floating bar, its own element with a gap above the body */}
      <div className="overflow-x-auto">{detachedHeader}</div>

      {/* Table body */}
      <div
        className={cn('overflow-hidden', !bare && 'rounded-xl border bg-card shadow-sm')}
      >
        <div className="overflow-x-auto">
          <div className="min-w-full py-1">
            {isLoading ? (
              <div
                className={cn(
                  'flex items-center justify-center',
                  dense ? 'py-10' : 'py-16',
                )}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-8 w-8">
                    <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary" />
                    <div className="absolute inset-1.5 animate-[spin_.6s_linear_infinite_reverse] rounded-full border-[3px] border-transparent border-b-primary/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Loading…</p>
                </div>
              </div>
            ) : data.length === 0 ? (
              <EmptyState
                icon={emptyIcon}
                title={emptyMessage}
                description={emptyDescription}
                action={emptyAction}
              />
            ) : (
              data.map((row, i) => (
                <div
                  key={getRowKey(row, i)}
                  role="row"
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'group/row relative w-fit min-w-full border-b border-border last:border-b-0',
                    onRowClick && 'cursor-pointer',
                    rowClassName?.(row),
                  )}
                >
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-y-0.5 rounded-lg bg-muted opacity-0 transition-opacity duration-150 group-hover/row:opacity-100',
                      insetX,
                    )}
                  />
                  <div
                    className={cn(
                      'relative grid items-center text-foreground',
                      dense ? 'text-xs' : 'text-sm',
                      cellPad,
                    )}
                    style={{ gridTemplateColumns }}
                  >
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        role="cell"
                        className={cn('min-w-0', col.align && alignClass[col.align], col.className)}
                      >
                        {col.render
                          ? col.render(row, i)
                          : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </div>
                    ))}
                    {rowActions && (
                      <div role="cell" className="flex justify-end">
                        <RowActionsCell
                          actions={rowActions(row)}
                          singleActionAsButton={singleActionAsButton}
                          dense={dense}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {onPageChange && currentPage != null && totalPages != null && (
        <DataPagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          total={total}
          pageSize={pageSize}
          noun={pageNoun}
          showNumbers={showPageNumbers}
        />
      )}
    </div>
  );
}