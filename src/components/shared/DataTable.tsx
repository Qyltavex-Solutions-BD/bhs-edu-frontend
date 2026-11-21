'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Input } from '@/src/components/ui/primitives';
import { EmptyState, LoadingSkeleton } from '@/src/components/shared/Feedback';
import { exportToCsv } from '@/src/lib/utils/cn';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';

export interface DataColumn<T extends object> {
  id?: string;
  accessorKey?: (keyof T & string) | string;
  header: string | (() => React.ReactNode);
  cell?: (ctx: { row: { original: T }; getValue: () => unknown }) => React.ReactNode;
  enableSorting?: boolean;
}

export interface DataTableProps<T extends object> {
  data: T[];
  columns: DataColumn<T>[];
  searchPlaceholder?: string;
  isLoading?: boolean;
  exportFilename?: string;
  toolbarExtra?: React.ReactNode;
  emptyTitle?: string;
  emptyAction?: React.ReactNode;
  pageSize?: number;
  renderMobileCard?: (row: T) => React.ReactNode;
}

function getRowValue<T extends object>(row: T, key?: string): unknown {
  if (!key) return undefined;
  return (row as Record<string, unknown>)[key];
}

export function DataTable<T extends object>({
  data,
  columns,
  searchPlaceholder,
  isLoading,
  exportFilename,
  toolbarExtra,
  emptyTitle,
  emptyAction,
  pageSize = 10,
  renderMobileCard,
}: DataTableProps<T>) {
  const { t, locale, pick } = useI18n();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  const filteredData = useMemo(() => {
    const q = globalFilter.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) =>
      Object.values(item as Record<string, unknown>).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return JSON.stringify(val).toLowerCase().includes(q);
        }
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, globalFilter]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const av = getRowValue(a, sortKey);
      const bv = getRowValue(b, sortKey);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const totalFiltered = sortedData.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const pagedRows = useMemo(() => {
    const start = safePageIndex * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safePageIndex, pageSize]);

  const handleToggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleExport = () => {
    exportToCsv(
      sortedData.map((r) => r as Record<string, unknown>),
      exportFilename ?? 'export.csv'
    );
  };

  const paginationSummary = useMemo(() => {
    return pick(
      `মোট ${formatNumber(totalFiltered, 'bn')} টি তথ্য · পৃষ্ঠা ${formatNumber(safePageIndex + 1, 'bn')} / ${formatNumber(pageCount, 'bn')}`,
      `Showing ${totalFiltered} records · Page ${safePageIndex + 1} of ${pageCount}`
    );
  }, [totalFiltered, safePageIndex, pageCount, pick]);

  if (isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPageIndex(0);
            }}
            placeholder={searchPlaceholder ?? t('cta.search')}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbarExtra}
          {exportFilename && (
            <Button variant="outline" size="sm" onClick={handleExport} disabled={totalFiltered === 0}>
              <Download className="w-3.5 h-3.5" />
              {t('cta.exportCsv')}
            </Button>
          )}
        </div>
      </div>

      {pagedRows.length === 0 ? (
        <EmptyState title={emptyTitle} action={emptyAction} />
      ) : (
        <>
          {renderMobileCard && (
            <div className="grid gap-3 md:hidden">
              {pagedRows.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-surface border border-border rounded-[var(--radius)] p-4"
                >
                  {renderMobileCard(item)}
                </div>
              ))}
            </div>
          )}

          <div
            className={
              renderMobileCard
                ? 'hidden md:block overflow-x-auto bg-surface border border-border rounded-[var(--radius)]'
                : 'overflow-x-auto bg-surface border border-border rounded-[var(--radius)]'
            }
          >
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-surface-muted/70 border-b border-border text-sm font-semibold text-muted-foreground">
                <tr>
                  {columns.map((col, idx) => {
                    const colId = col.id ?? col.accessorKey ?? `col-${idx}`;
                    const canSort = Boolean(col.accessorKey) && col.enableSorting !== false;
                    const headerContent =
                      typeof col.header === 'function' ? col.header() : col.header;
                    return (
                      <th key={colId} className="px-4 py-3 whitespace-nowrap">
                        {canSort && col.accessorKey ? (
                          <button
                            type="button"
                            onClick={() => handleToggleSort(col.accessorKey!)}
                            className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                          >
                            {headerContent}
                            <ArrowUpDown className="w-3 h-3 opacity-60" />
                          </button>
                        ) : (
                          headerContent
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedRows.map((item, rIdx) => (
                  <tr key={rIdx} className="hover:bg-surface-muted/40 transition-colors">
                    {columns.map((col, cIdx) => {
                      const colId = col.id ?? col.accessorKey ?? `col-${cIdx}`;
                      const val = getRowValue(item, col.accessorKey);
                      const content = col.cell
                        ? col.cell({ row: { original: item }, getValue: () => val })
                        : val !== null && val !== undefined
                          ? String(val)
                          : '—';
                      return (
                        <td key={colId} className="px-4 py-3 align-middle">
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="tabular-nums">{paginationSummary}</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={safePageIndex <= 0}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {locale === 'bn' ? 'পূর্ববর্তী' : 'Prev'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePageIndex >= pageCount - 1}
              >
                {locale === 'bn' ? 'পরবর্তী' : 'Next'}
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
