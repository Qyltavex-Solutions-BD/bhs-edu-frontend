'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  BookOpen,
  CreditCard,
  PlusCircle,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Select } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import {
  useGetFinanceContextQuery,
  useGetFinanceOverviewQuery,
  type FeePaymentTransactionItem,
} from '../api/finance.api';
import {
  formatTaka,
  MoneyReceiptModal,
  PAYMENT_METHOD_LABELS,
  RECEIPT_STATUS_LABELS,
} from './finance-ui';

export function AccountantDashboardPage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const activeYearId = selectedYearId || ctx?.activeAcademicYear?.id || undefined;

  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useGetFinanceOverviewQuery(
    activeYearId ? { academicYearId: activeYearId } : undefined
  );

  const [receiptModalTx, setReceiptModalTx] =
    useState<FeePaymentTransactionItem | null>(null);

  const chartData = useMemo(() => {
    return (overview?.monthlyTrend ?? []).map((item) => ({
      name: item.month,
      আয়: item.income,
      ব্যয়: item.expense,
    }));
  }, [overview?.monthlyTrend]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'হিসাবরক্ষণ ড্যাশবোর্ড'}
          description={'শিক্ষার্থীদের ফি আদায়, বকেয়া, অন্যান্য আয়, ব্যয় ও বেতনের সারসংক্ষেপ'}
        />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'হিসাবরক্ষণ ড্যাশবোর্ড'}
          description={'শিক্ষার্থীদের ফি আদায়, বকেয়া, অন্যান্য আয়, ব্যয় ও বেতনের সারসংক্ষেপ'}
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'হিসাবরক্ষণ ও অর্থ ড্যাশবোর্ড'}
        description={'বিদ্যালয়ের সকল আর্থিক লেনদেন, ফি আদায়, বকেয়া ও ব্যয়-বেতন ব্যবস্থাপনা'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {ctx && ctx.academicYears.length > 0 && (
              <Select
                value={activeYearId ?? ''}
                onChange={(e) => setSelectedYearId(e.target.value)}
                aria-label="শিক্ষাবর্ষ নির্বাচন করুন"
                className="w-40"
              >
                {ctx.academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {`শিক্ষাবর্ষ ${y.name}`}
                  </option>
                ))}
              </Select>
            )}
            <Link href="/accountant/collect-fee">
              <Button variant="primary" size="sm">
                <PlusCircle className="w-4 h-4" />
                {'নতুন ফি গ্রহণ'}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={'আজকের ফি আদায়'}
          value={formatTaka(overview.todayCollection)}
          meta={'আজকের সক্রিয় রসিদসমূহ'}
          accent="primary"
          icon={<Banknote className="w-5 h-5" />}
        />
        <StatCard
          label={'চলতি মাসের আদায়'}
          value={formatTaka(overview.monthCollection)}
          meta={`মোট রসিদ: ${formatNumber(overview.receiptCount, 'bn')}টি`}
          accent="success"
          icon={<ArrowDownCircle className="w-5 h-5" />}
        />
        <StatCard
          label={'মোট বকেয়া ফি'}
          value={formatTaka(overview.totalDue)}
          meta={'অপরিশোধিত ও আংশিক চালান'}
          accent="warning"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          label={'নিট তহবিল স্থিতি'}
          value={formatTaka(overview.netBalance)}
          meta={`মোট আয়: ${formatTaka(overview.totalIncome)} | ব্যয়: ${formatTaka(overview.totalOutflow)}`}
          accent={overview.netBalance >= 0 ? 'success' : 'destructive'}
          icon={<Wallet className="w-5 h-5" />}
        />
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/accountant/collect-fee">
          <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground truncate">{'ফি গ্রহণ'}</p>
              <p className="text-sm text-muted-foreground truncate">{'রসিদ ইস্যু করুন'}</p>
            </div>
          </Card>
        </Link>
        <Link href="/accountant/dues">
          <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground truncate">{'বকেয়া তালিকা'}</p>
              <p className="text-sm text-muted-foreground truncate">{'শ্রেণিভিত্তিক বকেয়া'}</p>
            </div>
          </Card>
        </Link>
        <Link href="/accountant/expenses">
          <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer flex items-center gap-3">
            <ArrowUpCircle className="w-5 h-5 text-destructive shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground truncate">{'ব্যয় ভাউচার'}</p>
              <p className="text-sm text-muted-foreground truncate">{'খরচ এন্ট্রি করুন'}</p>
            </div>
          </Card>
        </Link>
        <Link href="/accountant/cashbook">
          <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground truncate">{'দৈনিক ক্যাশবই'}</p>
              <p className="text-sm text-muted-foreground truncate">{'আয়-ব্যয় হিসাব'}</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Chart + Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {'বিগত ৬ মাসের আয় বনাম ব্যয় তুলনা'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {'ফি আদায় ও অন্যান্য আয় বনাম প্রাতিষ্ঠানিক ব্যয় ও বেতন'}
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis tick={{ fontSize: 13 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="আয়" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ব্যয়" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3">
              {'চলতি মাসের আর্থিক সারসংক্ষেপ'}
            </h2>
            <div className="space-y-3 text-base">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{'মাসের মোট আদায়'}</span>
                <span className="font-semibold text-success tabular-nums">
                  {formatTaka(overview.monthCollection)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{'মাসের মোট ব্যয় ও বেতন'}</span>
                <span className="font-semibold text-destructive tabular-nums">
                  {formatTaka(overview.monthOutflow)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{'শিক্ষাবর্ষের মোট আয়'}</span>
                <span className="font-semibold tabular-nums">
                  {formatTaka(overview.totalIncome)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">{'শিক্ষাবর্ষের মোট ব্যয়'}</span>
                <span className="font-semibold tabular-nums">
                  {formatTaka(overview.totalOutflow)}
                </span>
              </div>
            </div>
          </div>
          <Link href="/accountant/reports">
            <Button variant="outline" className="w-full">
              {'বিস্তারিত আর্থিক প্রতিবেদন দেখুন'}
            </Button>
          </Link>
        </Card>
      </div>

      {/* Recent Receipts */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            {'সাম্প্রতিক ফি আদায়ের রসিদসমূহ'}
          </h2>
          <Link href="/accountant/transactions">
            <Button variant="outline" size="sm">
              {'সকল লেনদেন দেখুন'}
            </Button>
          </Link>
        </div>

        {overview.recentTransactions.length === 0 ? (
          <EmptyState
            title={'এখনও কোনো ফি আদায়ের রসিদ নেই'}
            description={'প্রথম ফি গ্রহণ করলে এখানে সাম্প্রতিক রসিদগুলোর তালিকা দেখা যাবে।'}
            action={
              <Link href="/accountant/collect-fee">
                <Button variant="primary" size="sm">
                  {'ফি গ্রহণ শুরু করুন'}
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="py-2.5 pr-4">{'রসিদ নং'}</th>
                  <th className="py-2.5 pr-4">{'শিক্ষার্থী'}</th>
                  <th className="py-2.5 pr-4">{'শ্রেণি ও রোল'}</th>
                  <th className="py-2.5 pr-4">{'মাধ্যম'}</th>
                  <th className="py-2.5 pr-4">{'তারিখ'}</th>
                  <th className="py-2.5 pr-4 text-right">{'পরিমাণ'}</th>
                  <th className="py-2.5 pr-4">{'অবস্থা'}</th>
                  <th className="py-2.5 text-right">{'অ্যাকশন'}</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4 font-mono font-semibold text-foreground">
                      {tx.receiptNo}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">
                        {tx.enrollment?.student.nameBn || tx.enrollment?.student.nameEn || '—'}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {tx.enrollment?.student.studentId ?? ''}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">
                      {tx.enrollment?.schoolClass.nameBn ?? tx.enrollment?.schoolClass.name} ·{' '}
                      {'রোল'} {tx.enrollment?.roll ?? '—'}
                    </td>
                    <td className="py-3 pr-4 text-sm">
                      {PAYMENT_METHOD_LABELS[tx.paymentMethod]}
                    </td>
                    <td className="py-3 pr-4 text-sm tabular-nums">
                      {formatDateShort(tx.paidAt, 'bn')}
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                      {formatTaka(tx.totalPaid)}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge
                        value={tx.status}
                        customTone={tx.status === 'ACTIVE' ? 'success' : 'destructive'}
                        customLabel={RECEIPT_STATUS_LABELS[tx.status]}
                      />
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReceiptModalTx(tx)}
                      >
                        {'রসিদ'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <MoneyReceiptModal
        transaction={receiptModalTx}
        schoolProfile={ctx?.schoolProfile}
        onClose={() => setReceiptModalTx(null)}
      />
    </div>
  );
}
