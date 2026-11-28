'use client';

import React, { useState } from 'react';
import { BookOpen, Download, Printer } from 'lucide-react';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input } from '@/src/components/ui/primitives';
import { formatDateShort } from '@/src/lib/formatters';
import { exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { Select } from '@/src/components/ui/primitives';
import {
  useGetCashbookQuery,
  useGetFinanceContextQuery,
  useGetFinanceOverviewQuery,
  type FeePaymentMethod,
} from '../api/finance.api';
import {
  FinancePaginationBar,
  formatTaka,
  PAYMENT_METHOD_LABELS,
} from './finance-ui';

const PAGE_SIZE = 30;

export function CashbookPage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'INCOME' | 'EXPENSE'>('');
  const [methodFilter, setMethodFilter] = useState<'' | FeePaymentMethod>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetCashbookQuery({
    academicYearId: ctx?.activeAcademicYear?.id,
    from: from || undefined,
    to: to || undefined,
    type: typeFilter || undefined,
    method: methodFilter || undefined,
    search: search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const entries = data?.items ?? [];
  const meta = data?.meta;

  function handleExportCsv() {
    exportToCsv(
      entries.map((e) => ({
        তারিখ: formatDateShort(e.date, 'bn'),
        'ভাউচার/রসিদ': e.ref,
        ধরন: e.type === 'INCOME' ? 'জমা (আয়)' : 'খরচ (ব্যয়)',
        খাত: e.category,
        বিবরণ: e.description,
        মাধ্যম: PAYMENT_METHOD_LABELS[e.method],
        'টাকা (৳)': e.amount,
      })),
      'bhs-cashbook.csv'
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'দৈনিক ক্যাশবই ও খতিয়ান'}
        description={'সকল ফি আদায়, অন্যান্য আয়, ব্যয় ও বেতনের সমন্বিত তারিখভিত্তিক ক্যাশবই'}
        actions={
          <div className="flex flex-wrap gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={entries.length === 0}
            >
              <Download className="w-4 h-4" />
              {'CSV ডাউনলোড'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
              <Printer className="w-4 h-4" />
              {'প্রিন্ট'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={'মোট জমা (আয়)'}
          value={formatTaka(data?.totalIn ?? 0)}
          accent="success"
        />
        <StatCard
          label={'মোট খরচ (ব্যয় ও বেতন)'}
          value={formatTaka(data?.totalOut ?? 0)}
          accent="destructive"
        />
        <StatCard
          label={'হাতে নগদ / নিট স্থিতি'}
          value={formatTaka(data?.net ?? 0)}
          accent={(data?.net ?? 0) >= 0 ? 'primary' : 'destructive'}
          icon={<BookOpen className="w-5 h-5" />}
        />
      </div>

      <Card className="p-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">{'খুঁজুন'}</label>
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ভাউচার বা বিবরণ..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{'ধরন'}</label>
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as '' | 'INCOME' | 'EXPENSE');
                setPage(1);
              }}
            >
              <option value="">{'সকল'}</option>
              <option value="INCOME">{'জমা (আয়)'}</option>
              <option value="EXPENSE">{'খরচ (ব্যয়)'}</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{'মাধ্যম'}</label>
            <Select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value as '' | FeePaymentMethod);
                setPage(1);
              }}
            >
              <option value="">{'সকল মাধ্যম'}</option>
              {(Object.keys(PAYMENT_METHOD_LABELS) as FeePaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{'শুরুর তারিখ'}</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              placeholder="শুরুর তারিখ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{'শেষ তারিখ'}</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              placeholder="শেষ তারিখ"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFrom('');
              setTo('');
              setTypeFilter('');
              setMethodFilter('');
              setSearch('');
              setPage(1);
            }}
          >
            {'রিসেট'}
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        {isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : entries.length === 0 ? (
          <EmptyState title={'নির্বাচিত তারিখে কোনো লেনদেন নেই'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="py-2.5 pr-3">{'তারিখ'}</th>
                  <th className="py-2.5 pr-3">{'রসিদ/ভাউচার'}</th>
                  <th className="py-2.5 pr-3">{'ধরন'}</th>
                  <th className="py-2.5 pr-3">{'খাত ও বিবরণ'}</th>
                  <th className="py-2.5 pr-3">{'মাধ্যম'}</th>
                  <th className="py-2.5 text-right">{'টাকা'}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={`${entry.type}-${entry.id}`}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="py-2.5 pr-3 text-sm tabular-nums">
                      {formatDateShort(entry.date, 'bn')}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-sm font-semibold">
                      {entry.ref}
                    </td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge
                        value={entry.type}
                        customTone={entry.type === 'INCOME' ? 'success' : 'destructive'}
                        customLabel={entry.type === 'INCOME' ? 'জমা' : 'খরচ'}
                      />
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium">{entry.description}</p>
                      <p className="text-sm text-muted-foreground">{entry.category}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-sm">
                      {PAYMENT_METHOD_LABELS[entry.method]}
                    </td>
                    <td
                      className={`py-2.5 text-right font-semibold tabular-nums ${
                        entry.type === 'INCOME' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {`${entry.type === 'INCOME' ? '+' : '-'} ${formatTaka(entry.amount)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <FinancePaginationBar meta={meta} onPageChange={setPage} />
      </Card>
    </div>
  );
}

export function ReportsPage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const { data: overview, isLoading } = useGetFinanceOverviewQuery(
    ctx?.activeAcademicYear?.id
      ? { academicYearId: ctx.activeAcademicYear.id }
      : undefined
  );

  if (isLoading || !overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'আর্থিক প্রতিবেদন ও সারসংক্ষেপ'}
          description={'মাসিক ও বার্ষিক আয়-ব্যয় এবং বকেয়ার সমন্বিত প্রতিবেদন'}
        />
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'আর্থিক প্রতিবেদন ও সারসংক্ষেপ'}
        description={`শিক্ষাবর্ষ ${ctx?.activeAcademicYear?.name ?? ''} — মাসিক আয়-ব্যয় ও স্থিতি বিবরণী`}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => triggerPrint()}
            className="no-print"
          >
            <Printer className="w-4 h-4" />
            {'প্রতিবেদন প্রিন্ট করুন'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={'মোট বার্ষিক আয়'}
          value={formatTaka(overview.totalIncome)}
          accent="success"
        />
        <StatCard
          label={'মোট বার্ষিক ব্যয় ও বেতন'}
          value={formatTaka(overview.totalOutflow)}
          accent="destructive"
        />
        <StatCard
          label={'নিট তহবিল স্থিতি'}
          value={formatTaka(overview.netBalance)}
          accent={overview.netBalance >= 0 ? 'primary' : 'destructive'}
        />
        <StatCard
          label={'অনাদায়ী বকেয়া'}
          value={formatTaka(overview.totalDue)}
          accent="warning"
        />
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-4">
          {'বিগত ৬ মাসের মাসিক আয়-ব্যয় বিবরণী'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="py-2.5 pr-4">{'মাস'}</th>
                <th className="py-2.5 pr-4 text-right">{'মোট আয়'}</th>
                <th className="py-2.5 pr-4 text-right">{'মোট ব্যয়'}</th>
                <th className="py-2.5 text-right">{'নিট পার্থক্য'}</th>
              </tr>
            </thead>
            <tbody>
              {overview.monthlyTrend.map((m) => {
                const net = m.income - m.expense;
                return (
                  <tr key={m.month} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4 font-medium">{m.month}</td>
                    <td className="py-3 pr-4 text-right text-success font-semibold tabular-nums">
                      {formatTaka(m.income)}
                    </td>
                    <td className="py-3 pr-4 text-right text-destructive font-semibold tabular-nums">
                      {formatTaka(m.expense)}
                    </td>
                    <td
                      className={`py-3 text-right font-bold tabular-nums ${
                        net >= 0 ? 'text-primary' : 'text-destructive'
                      }`}
                    >
                      {formatTaka(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
