'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CreditCard, Download, RefreshCw, Search } from 'lucide-react';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Input, Select } from '@/src/components/ui/primitives';
import { formatNumber } from '@/src/lib/formatters';
import { exportToCsv } from '@/src/lib/utils/cn';
import {
  useGetDuesQuery,
  useGetFinanceContextQuery,
} from '../api/finance.api';
import { formatTaka, FinancePaginationBar } from './finance-ui';

const PAGE_SIZE = 20;

export function DuesPage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const [classId, setClassId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetDuesQuery({
    academicYearId: ctx?.activeAcademicYear?.id,
    classId: classId || undefined,
    search: search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const filtered = data?.items ?? [];
  const meta = data?.meta;
  const totalDueSum = data?.summary?.totalDueSum ?? 0;
  const totalStudents = data?.summary?.totalStudents ?? filtered.length;

  function handleExportCsv() {
    exportToCsv(
      filtered.map((d) => ({
        'শিক্ষার্থী আইডি': d.studentIdCode,
        'শিক্ষার্থীর নাম': d.studentName,
        'শ্রেণি': d.className,
        'রোল': d.rollNumber,
        'অভিভাবকের ফোন': d.guardianPhone,
        'বকেয়া চালান': d.invoiceCount,
        'মোট বকেয়া (টাকা)': d.totalDue,
      })),
      'bhs-dues-list.csv'
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'বকেয়া ফি ও বাকিদের তালিকা'}
        description={'শ্রেণিভিত্তিক অপরিশোধিত ও আংশিক বকেয়া শিক্ষার্থীর তালিকা এবং দ্রুত ফি আদায়'}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
          >
            <Download className="w-4 h-4" />
            {'CSV ডাউনলোড'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label={'বকেয়া থাকা শিক্ষার্থী'}
          value={formatNumber(totalStudents, 'bn')}
          meta={'নির্বাচিত শ্রেণি/ফিল্টার অনুযায়ী'}
          accent="primary"
        />
        <StatCard
          label={'সর্বমোট বকেয়া পরিমাণ'}
          value={formatTaka(totalDueSum)}
          meta={'সকল বকেয়া চালানের যোগফল'}
          accent="warning"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <FormField label={'খুঁজুন'}>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="dues-search"
                  name="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="নাম বা রোল দিয়ে খুঁজুন..."
                  className="pl-9"
                />
              </div>
            </FormField>
          </div>
          <FormField label={'শ্রেণি'}>
            <Select
              id="dues-class-filter"
              name="classId"
              aria-label="শ্রেণি"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{'সকল শ্রেণি'}</option>
              {(ctx?.classes ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn || c.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </Card>

      <Card className="p-5">
        {isLoading || isFetching ? (
          <LoadingSkeleton rows={6} />
        ) : isError ? (
          <div className="p-4 rounded-lg border border-destructive/40 bg-destructive/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-destructive font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{'বকেয়া তালিকা লোড করা যায়নি।'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
              {'পুনরায় চেষ্টা করুন'}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={'কোনো বকেয়া পাওয়া যায়নি'}
            description={'নির্বাচিত শ্রেণিতে কোনো শিক্ষার্থীর বকেয়া নেই।'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                  <th className="py-3 px-4">{'শিক্ষার্থী'}</th>
                  <th className="py-3 px-4">{'শ্রেণি ও রোল'}</th>
                  <th className="py-3 px-4">{'অভিভাবকের ফোন'}</th>
                  <th className="py-3 px-4 text-center">{'বকেয়া চালান'}</th>
                  <th className="py-3 px-4 text-right">{'বকেয়া (৳)'}</th>
                  <th className="py-3 px-4 text-right">{'অ্যাকশন'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row) => {
                  const shortClass = (row.className || '—').replace(/\s*শ্রেণি\s*/g, '').trim();
                  const rollNum = Number(row.rollNumber);
                  const rollText = !Number.isNaN(rollNum)
                    ? formatNumber(rollNum, 'bn')
                    : row.rollNumber || '—';
                  return (
                    <tr key={row.enrollmentId} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium text-foreground">
                        {row.studentName}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap tabular-nums">
                        {shortClass}
                        {row.sectionName ? ` (${row.sectionName})` : ''} - {rollText}
                      </td>
                      <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                        {row.guardianPhone || '—'}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums whitespace-nowrap">
                        {formatNumber(row.invoiceCount, 'bn')}টি
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-warning tabular-nums whitespace-nowrap">
                        {formatTaka(row.totalDue)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/accountant/collect-fee?enrollmentId=${row.enrollmentId}`}
                        >
                          <Button variant="primary" size="sm">
                            <CreditCard className="w-4 h-4" />
                            {'ফি গ্রহণ'}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <FinancePaginationBar meta={meta} onPageChange={setPage} />
      </Card>
    </div>
  );
}
