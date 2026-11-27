'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search, ShieldCheck } from 'lucide-react';
import { formatDateShort } from '@/src/lib/formatters';
import { downloadCsv } from '@/src/features/attendance/components/attendanceShared';
import { EmptyState, LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import {
  useGetAuditLogsQuery,
  useGetAuditModulesQuery,
} from '../api/access-control.api';

const PAGE_SIZE = 20;

export function AdminAuditLogsPage() {
  const [moduleFilter, setModuleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data: modules = [] } = useGetAuditModulesQuery();
  const { data, isLoading, isFetching } = useGetAuditLogsQuery({
    page,
    limit: PAGE_SIZE,
    module: moduleFilter || undefined,
    search: search.trim() || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  if (isLoading) return <LoadingSkeleton />;

  const items = data?.items ?? [];
  const meta = data?.meta;

  function handleExport() {
    downloadCsv(
      `audit-logs-page-${page}.csv`,
      ['তারিখ ও সময়', 'ব্যবহারকারী', 'ফোন', 'মডিউল', 'অ্যাকশন', 'IP ঠিকানা', 'ডিভাইস'],
      items.map((l) => [
        l.createdAt,
        l.user?.name ?? 'System',
        l.user?.phone ?? '—',
        l.module,
        l.action,
        l.ipAddress ?? '—',
        l.deviceName ?? l.userAgent ?? '—',
      ])
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="সিস্টেম অডিট লগ"
        description="সিস্টেমের নিরাপত্তা ও গুরুত্বপূর্ণ পরিবর্তনের পূর্ণাঙ্গ রেকর্ড (ব্যাকএন্ড ফিল্টার ও প্যাজিনেশনসহ)।"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={items.length === 0}
          >
            <Download className="h-4 w-4" />
            {'CSV এক্সপোর্ট'}
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-1 gap-3 border-b border-border/70 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="অ্যাকশন, মডিউল, IP বা ব্যবহারকারী..."
              className="pl-9"
            />
          </div>
          <Select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{'সকল মডিউল'}</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            aria-label="শুরুর তারিখ"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            aria-label="শেষ তারিখ"
          />
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="কোনো অডিট লগ পাওয়া যায়নি"
            description="নির্বাচিত ফিল্টারে কোনো অ্যাক্টিভিটি লগ নেই।"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="border-b border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{'তারিখ ও সময়'}</th>
                  <th className="px-4 py-3">{'ব্যবহারকারী'}</th>
                  <th className="px-4 py-3">{'মডিউল'}</th>
                  <th className="px-4 py-3">{'অ্যাকশন'}</th>
                  <th className="px-4 py-3">{'IP ঠিকানা'}</th>
                  <th className="px-4 py-3">{'ডিভাইস'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 text-sm tabular-nums whitespace-nowrap text-muted-foreground">
                      <div>{formatDateShort(log.createdAt, 'bn')}</div>
                      <div className="text-xs opacity-80">
                        {new Date(log.createdAt).toLocaleTimeString('bn-BD', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {log.user?.name ?? 'System'}
                      </div>
                      {log.user?.phone && (
                        <div className="text-sm text-muted-foreground font-mono">
                          {log.user.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-medium text-foreground">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm whitespace-nowrap text-muted-foreground">
                      {log.ipAddress ?? '—'}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-muted-foreground"
                      title={log.userAgent ?? undefined}
                    >
                      {log.deviceName ?? 'Unknown Device'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-4 py-3 text-sm text-muted-foreground">
            <span>
              {isFetching
                ? 'লোড হচ্ছে...'
                : `মোট ${meta.total}টির মধ্যে ${(meta.page - 1) * meta.limit + 1}–${Math.min(
                    meta.page * meta.limit,
                    meta.total
                  )} প্রদর্শিত হচ্ছে`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                {'পূর্ববর্তী'}
              </Button>
              <span className="px-2 font-medium text-foreground">
                {meta.page} / {Math.max(1, meta.totalPages)}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                {'পরবর্তী'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
