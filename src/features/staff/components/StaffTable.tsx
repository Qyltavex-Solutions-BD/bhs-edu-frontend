'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { toast } from 'sonner';
import { DataTable, type DataTableProps } from '@/src/components/shared/DataTable';
import { Button } from '@/src/components/ui/primitives';
import { useI18n } from '@/src/lib/i18n';
import { useExportStaffTableMutation, type StaffListParams, type StaffPage } from '../api/staff.api';

export function useStaffTable(filters: StaffListParams = {}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return {
    search,
    setSearch,
    setPage,
    params: { ...filters, search: debouncedSearch || undefined, page, limit: 10 },
  };
}

type TableQuery<T> = {
  currentData?: StaffPage<T>;
  isFetching: boolean;
  isError: boolean;
  refetch: () => unknown;
};

export function StaffTable<T extends object>({
  table,
  query,
  list,
  ...props
}: Omit<DataTableProps<T>, 'data' | 'server' | 'isLoading'> & {
  table: ReturnType<typeof useStaffTable>;
  query: TableQuery<T>;
  list: 'staff' | 'departments' | 'posts';
}) {
  const { pick } = useI18n();
  const [exportRows, { isLoading: exporting }] = useExportStaffTableMutation();
  const meta = query.currentData?.meta;
  const lastPage = Math.max(1, meta?.totalPages ?? 1);
  const requestedPage = table.params.page;
  const setPage = table.setPage;

  useEffect(() => {
    if (meta && requestedPage > lastPage) setPage(lastPage);
  }, [lastPage, meta, requestedPage, setPage]);

  const server: ComponentProps<typeof DataTable<T>>['server'] = {
    search: table.search,
    onSearch: table.setSearch,
    onPage: setPage,
    meta,
    exporting,
    onExport: async () => {
      if (!props.exportFilename) return;
      try {
        const csv = await exportRows({ list, params: table.params }).unwrap();
        const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = props.exportFilename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      } catch {
        toast.error(pick('CSV ডাউনলোড করা যায়নি।', 'Could not download the CSV.'));
      }
    },
  };

  return (
    <>
      {query.isError && (
        <div role="alert" className="flex items-center gap-3">
          <p>{pick('তথ্য লোড করা যায়নি।', 'Could not load records.')}</p>
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>{pick('আবার চেষ্টা করুন', 'Retry')}</Button>
        </div>
      )}
      <DataTable
        {...props}
        data={query.isError ? [] : query.currentData?.data ?? []}
        isLoading={query.isFetching}
        emptyTitle={query.isError ? pick('তথ্য পাওয়া যায়নি।', 'Records unavailable.') : props.emptyTitle}
        server={server}
      />
    </>
  );
}
