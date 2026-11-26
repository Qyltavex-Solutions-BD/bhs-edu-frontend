'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/src/lib/i18n';
import { formatNumber } from '@/src/lib/formatters';
import { exportToCsv } from '@/src/lib/utils/cn';
import { DataTable } from '@/src/components/shared/DataTable';
import { LoadingSkeleton } from '@/src/components/shared/Feedback';
import { Button, Card } from '@/src/components/ui/primitives';
import { useGetParentCoverageQuery } from '../api/parents.api';

const PAGE_SIZE = 10;
const SORTABLE_FIELDS = new Set(['studentId', 'name', 'primaryName', 'emergency', 'sms']);

export function ParentCoverage() {
  const { locale, pick } = useI18n();
  const [onlyGaps, setOnlyGaps] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('studentId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useGetParentCoverageQuery({
    onlyGaps,
    page,
    limit: PAGE_SIZE,
    sortBy,
    sortOrder,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const handleSort = (key: string) => {
    if (!SORTABLE_FIELDS.has(key)) return;
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  if (isLoading && !data) {
    return <LoadingSkeleton />;
  }

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const summary = data?.summary ?? {
    activeStudents: 0,
    fullCoverage: 0,
    smsReady: 0,
    gapCount: 0,
  };
  const numLocale = locale === 'bn' ? 'bn' : 'en';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('মোট সক্রিয় শিক্ষার্থী', 'Active Students')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(summary.activeStudents, numLocale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('সম্পূর্ণ কভারেজ', 'Full Coverage')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">
            {formatNumber(summary.fullCoverage, numLocale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('SMS প্রাপক নির্ধারিত', 'SMS Ready')}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">
            {formatNumber(summary.smsReady, numLocale)}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">
            {pick('তথ্য ঘাটতি (Gap)', 'Needs Attention')}
          </p>
          <p
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums mt-1 ${
              summary.gapCount > 0 ? 'text-warning' : 'text-success'
            }`}
          >
            {formatNumber(summary.gapCount, numLocale)}
          </p>
        </Card>
      </div>

      <DataTable
        data={rows}
        isLoading={isFetching && !rows.length}
        exportFilename="guardian-coverage.csv"
        searchPlaceholder={pick('শিক্ষার্থী বা অভিভাবকের নাম/আইডি দিয়ে খুঁজুন...', 'Search by student or guardian...')}
        emptyTitle={pick('কোনো তথ্য পাওয়া যায়নি', 'No records found')}
        server={{
          search,
          onSearch: setSearch,
          meta,
          onPage: setPage,
          sortBy,
          sortOrder,
          onSort: handleSort,
          onExport: () =>
            exportToCsv(
              rows.map((r) => ({
                studentId: r.studentId || '',
                student: r.name,
                primaryGuardian: r.primaryName,
                phone: r.phone,
                emergency: r.emergency,
                sms: r.sms,
              })),
              'guardian-coverage.csv'
            ),
        }}
        toolbarExtra={
          <Button
            variant={onlyGaps ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setOnlyGaps((v) => !v);
              setPage(1);
            }}
          >
            {onlyGaps
              ? pick('সকল শিক্ষার্থী দেখুন', 'Show all students')
              : pick('শুধু ঘাটতি দেখুন', 'Only gaps')}
          </Button>
        }
        columns={[
          {
            accessorKey: 'studentId',
            header: pick('আইডি', 'ID'),
            cell: ({ row }) => (
              <span className="font-mono text-sm">{row.original.studentId || '—'}</span>
            ),
          },
          {
            accessorKey: 'name',
            header: pick('শিক্ষার্থী', 'Student'),
            cell: ({ row }) => (
              <Link
                href={`/admin/students/${row.original.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {row.original.name}
              </Link>
            ),
          },
          {
            accessorKey: 'primaryName',
            header: pick('প্রাথমিক অভিভাবক', 'Primary Guardian'),
            cell: ({ row }) =>
              row.original.primaryParentId ? (
                <Link
                  href={`/admin/parents/${row.original.primaryParentId}`}
                  className="text-foreground hover:text-primary hover:underline"
                >
                  {row.original.primaryName}
                </Link>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          {
            accessorKey: 'phone',
            header: pick('মোবাইল', 'Phone'),
            enableSorting: false,
            cell: ({ row }) => (
              <span className="font-mono text-sm tabular-nums">{row.original.phone}</span>
            ),
          },
          {
            accessorKey: 'emergency',
            header: pick('জরুরি', 'Emergency'),
            cell: ({ row }) => (
              <span
                className={`tabular-nums font-medium ${
                  row.original.emergency === 0 ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {formatNumber(row.original.emergency, numLocale)}
              </span>
            ),
          },
          {
            accessorKey: 'sms',
            header: 'SMS',
            cell: ({ row }) => (
              <span
                className={`tabular-nums font-medium ${
                  row.original.sms === 0 ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {formatNumber(row.original.sms, numLocale)}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
