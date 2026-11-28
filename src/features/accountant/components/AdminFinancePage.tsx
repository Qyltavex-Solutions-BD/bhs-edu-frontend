'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownCircle,
  Banknote,
  BookOpen,
  Download,
  Eye,
  Printer,
  Receipt,
  Search,
  ShieldCheck,
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
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import {
  useGetCashbookQuery,
  useGetDuesQuery,
  useGetFinanceContextQuery,
  useGetFinanceOverviewQuery,
  useGetTransactionsQuery,
  type FeePaymentMethod,
  type FeePaymentTransactionItem,
  type ReceiptStatus,
} from '../api/finance.api';
import {
  FinancePaginationBar,
  formatTaka,
  MoneyReceiptModal,
  PAYMENT_METHOD_LABELS,
  RECEIPT_STATUS_LABELS,
} from './finance-ui';

type OversightTab = 'overview' | 'transactions' | 'dues' | 'cashbook';
const PAGE_SIZE = 20;

export function AdminFinancePage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const [selectedYearId, setSelectedYearId] = useState('');
  const activeYearId = selectedYearId || ctx?.activeAcademicYear?.id || undefined;
  const [tab, setTab] = useState<OversightTab>('overview');
  const [receiptModalTx, setReceiptModalTx] =
    useState<FeePaymentTransactionItem | null>(null);

  // Overview
  const {
    data: overview,
    isLoading: loadingOverview,
    isError: overviewError,
    refetch: refetchOverview,
  } = useGetFinanceOverviewQuery(
    activeYearId ? { academicYearId: activeYearId } : undefined
  );

  // Transactions (Read-Only + Void Audit)
  const [txSearch, setTxSearch] = useState('');
  const [txMethod, setTxMethod] = useState<'' | FeePaymentMethod>('');
  const [txStatus, setTxStatus] = useState<'' | ReceiptStatus>('');
  const [txPage, setTxPage] = useState(1);
  const { data: txData, isLoading: loadingTx } = useGetTransactionsQuery(
    {
      academicYearId: activeYearId,
      search: txSearch.trim() || undefined,
      paymentMethod: txMethod || undefined,
      status: txStatus || undefined,
      page: txPage,
      limit: PAGE_SIZE,
    },
    { skip: tab !== 'transactions' }
  );

  // Dues
  const [duesClassId, setDuesClassId] = useState('');
  const [duesSearch, setDuesSearch] = useState('');
  const [duesPage, setDuesPage] = useState(1);
  const { data: duesData, isLoading: loadingDues } = useGetDuesQuery(
    {
      academicYearId: activeYearId,
      classId: duesClassId || undefined,
      search: duesSearch.trim() || undefined,
      page: duesPage,
      limit: PAGE_SIZE,
    },
    { skip: tab !== 'dues' }
  );

  // Cashbook
  const [cbFrom, setCbFrom] = useState('');
  const [cbTo, setCbTo] = useState('');
  const [cbType, setCbType] = useState<'' | 'INCOME' | 'EXPENSE'>('');
  const [cbMethod, setCbMethod] = useState<'' | FeePaymentMethod>('');
  const [cbSearch, setCbSearch] = useState('');
  const [cbPage, setCbPage] = useState(1);
  const { data: cbData, isLoading: loadingCb } = useGetCashbookQuery(
    {
      academicYearId: activeYearId,
      from: cbFrom || undefined,
      to: cbTo || undefined,
      type: cbType || undefined,
      method: cbMethod || undefined,
      search: cbSearch.trim() || undefined,
      page: cbPage,
      limit: 30,
    },
    { skip: tab !== 'cashbook' }
  );

  const chartData = useMemo(
    () =>
      (overview?.monthlyTrend ?? []).map((item) => ({
        name: item.month,
        আয়: item.income,
        ব্যয়: item.expense,
      })),
    [overview?.monthlyTrend]
  );

  if (loadingOverview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'অর্থ ও হিসাব নজরদারি'}
          description={'ফিন্যান্স ডিপার্টমেন্টের লাইভ আয়-ব্যয়, রসিদ, বাতিল (VOID) ও বকেয়া সারসংক্ষেপ'}
        />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (overviewError || !overview) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'অর্থ ও হিসাব নজরদারি'}
          description={'ফিন্যান্স ডিপার্টমেন্টের লাইভ আয়-ব্যয়, রসিদ, বাতিল (VOID) ও বকেয়া সারসংক্ষেপ'}
        />
        <ErrorState
          message={'আর্থিক তথ্য লোড করা যায়নি। ব্যাকএন্ড সার্ভারের সাথে সংযোগ যাচাই করে পুনরায় চেষ্টা করুন।'}
          onRetry={() => void refetchOverview()}
        />
      </div>
    );
  }

  const txItems = txData?.items ?? [];
  const duesItems = duesData?.items ?? [];
  const cbItems = cbData?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={'অর্থ ও হিসাব নজরদারি'}
        description={'ফিন্যান্স ডিপার্টমেন্টের সকল আদায়, রসিদ, বাতিল (VOID), বকেয়া ও ক্যাশবইয়ের পূর্ণাঙ্গ রিড-অনলি চিত্র'}
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
              {'শুধুমাত্র দেখার জন্য (Read-Only)'}
            </span>
            {ctx && ctx.academicYears.length > 0 && (
              <Select
                value={activeYearId ?? ''}
                onChange={(e) => {
                  setSelectedYearId(e.target.value);
                  setTxPage(1);
                  setDuesPage(1);
                  setCbPage(1);
                }}
                aria-label="শিক্ষাবর্ষ"
                className="w-40"
              >
                {ctx.academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {`শিক্ষাবর্ষ ${y.name}`}
                  </option>
                ))}
              </Select>
            )}
          </div>
        }
      />

      {/* 4 Top KPIs */}
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
          meta={`মোট সক্রিয় রসিদ: ${formatNumber(overview.receiptCount, 'bn')}টি`}
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

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3 no-print">
        {(
          [
            { key: 'overview', label: 'সংক্ষিপ্ত চিত্র ও চার্ট', icon: TrendingUp },
            { key: 'transactions', label: 'রসিদ ও বাতিল (VOID)', icon: Receipt },
            { key: 'dues', label: 'বকেয়া তালিকা', icon: AlertTriangle },
            { key: 'cashbook', label: 'দৈনিক ক্যাশবই', icon: BookOpen },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={tab === key ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTab(key)}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* TAB 1: Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-5 lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {'বিগত ৬ মাসের আয় বনাম ব্যয় তুলনা'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {'ফি আদায় ও অন্যান্য আয় বনাম প্রাতিষ্ঠানিক ব্যয় ও বেতন'}
                </p>
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

            <Card className="p-5 space-y-4">
              <h2 className="text-base font-semibold text-foreground">
                {'চলতি মাসের আর্থিক সারসংক্ষেপ'}
              </h2>
              <div className="divide-y divide-border text-sm">
                <div className="py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">{'মাসের মোট আদায়'}</span>
                  <span className="font-semibold tabular-nums">
                    {formatTaka(overview.monthCollection)}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">{'মাসের মোট ব্যয় ও বেতন'}</span>
                  <span className="font-semibold text-destructive tabular-nums">
                    {formatTaka(overview.monthOutflow)}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">{'শিক্ষাবর্ষের মোট আয়'}</span>
                  <span className="font-semibold text-success tabular-nums">
                    {formatTaka(overview.totalIncome)}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">{'শিক্ষাবর্ষের মোট ব্যয়'}</span>
                  <span className="font-semibold text-destructive tabular-nums">
                    {formatTaka(overview.totalOutflow)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">
                {'সাম্প্রতিক ফি আদায়ের রসিদসমূহ'}
              </h2>
              <Button variant="outline" size="sm" onClick={() => setTab('transactions')}>
                {'সকল রসিদ ও VOID দেখুন'}
              </Button>
            </div>
            {overview.recentTransactions.length === 0 ? (
              <EmptyState title={'এখনো কোনো ফি আদায়ের রসিদ তৈরি হয়নি'} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                      <th className="py-2.5 pr-3">{'রসিদ নং'}</th>
                      <th className="py-2.5 pr-3">{'শিক্ষার্থী'}</th>
                      <th className="py-2.5 pr-3">{'মাধ্যম'}</th>
                      <th className="py-2.5 pr-3">{'তারিখ'}</th>
                      <th className="py-2.5 pr-3 text-right">{'টাকা'}</th>
                      <th className="py-2.5 text-right">{'রসিদ'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {overview.recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/20">
                        <td className="py-2.5 pr-3 font-mono font-semibold">{tx.receiptNo}</td>
                        <td className="py-2.5 pr-3">
                          {tx.enrollment?.student.nameBn || tx.enrollment?.student.nameEn || '—'}
                        </td>
                        <td className="py-2.5 pr-3">{PAYMENT_METHOD_LABELS[tx.paymentMethod]}</td>
                        <td className="py-2.5 pr-3 tabular-nums">{formatDateShort(tx.paidAt, 'bn')}</td>
                        <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">
                          {formatTaka(tx.totalPaid)}
                        </td>
                        <td className="py-2.5 text-right">
                          <Button variant="outline" size="sm" onClick={() => setReceiptModalTx(tx)}>
                            <Eye className="w-3.5 h-3.5" />
                            {'দেখুন'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: Transactions & Void Audit */}
      {tab === 'transactions' && (
        <Card className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={txSearch}
                onChange={(e) => {
                  setTxSearch(e.target.value);
                  setTxPage(1);
                }}
                placeholder="রসিদ নং বা শিক্ষার্থীর নাম..."
                className="pl-9"
              />
            </div>
            <Select
              value={txMethod}
              onChange={(e) => {
                setTxMethod(e.target.value as '' | FeePaymentMethod);
                setTxPage(1);
              }}
            >
              <option value="">{'সকল পেমেন্ট মাধ্যম'}</option>
              {(Object.keys(PAYMENT_METHOD_LABELS) as FeePaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </Select>
            <Select
              value={txStatus}
              onChange={(e) => {
                setTxStatus(e.target.value as '' | ReceiptStatus);
                setTxPage(1);
              }}
            >
              <option value="">{'সকল স্ট্যাটাস (সক্রিয় ও বাতিল)'}</option>
              <option value="ACTIVE">{RECEIPT_STATUS_LABELS.ACTIVE}</option>
              <option value="VOID">{RECEIPT_STATUS_LABELS.VOID}</option>
            </Select>
          </div>

          {loadingTx ? (
            <LoadingSkeleton rows={5} />
          ) : txItems.length === 0 ? (
            <EmptyState title={'কোনো রসিদ পাওয়া যায়নি'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-2.5 pr-3">{'রসিদ নং'}</th>
                    <th className="py-2.5 pr-3">{'শিক্ষার্থী'}</th>
                    <th className="py-2.5 pr-3">{'আদায়কারী'}</th>
                    <th className="py-2.5 pr-3">{'মাধ্যম'}</th>
                    <th className="py-2.5 pr-3">{'স্ট্যাটাস'}</th>
                    <th className="py-2.5 pr-3 text-right">{'টাকা'}</th>
                    <th className="py-2.5 text-right">{'রসিদ'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {txItems.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/20">
                      <td className="py-2.5 pr-3 font-mono font-semibold">{tx.receiptNo}</td>
                      <td className="py-2.5 pr-3">
                        <div>{tx.enrollment?.student.nameBn || tx.enrollment?.student.nameEn || '—'}</div>
                        <div className="text-xs text-muted-foreground">{formatDateShort(tx.paidAt, 'bn')}</div>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{tx.collectedBy?.name ?? '—'}</td>
                      <td className="py-2.5 pr-3">{PAYMENT_METHOD_LABELS[tx.paymentMethod]}</td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge
                          value={tx.status}
                          customTone={tx.status === 'ACTIVE' ? 'success' : 'destructive'}
                          customLabel={RECEIPT_STATUS_LABELS[tx.status]}
                        />
                        {tx.status === 'VOID' && tx.voidReason && (
                          <p className="text-xs text-destructive mt-0.5">{tx.voidReason}</p>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">
                        {formatTaka(tx.totalPaid)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button variant="outline" size="sm" onClick={() => setReceiptModalTx(tx)}>
                          <Eye className="w-3.5 h-3.5" />
                          {'দেখুন'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <FinancePaginationBar meta={txData?.meta} onPageChange={setTxPage} />
        </Card>
      )}

      {/* TAB 3: Dues */}
      {tab === 'dues' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3 flex-1">
              <Input
                value={duesSearch}
                onChange={(e) => {
                  setDuesSearch(e.target.value);
                  setDuesPage(1);
                }}
                placeholder="শিক্ষার্থীর নাম বা রোল..."
                className="w-56"
              />
              <Select
                value={duesClassId}
                onChange={(e) => {
                  setDuesClassId(e.target.value);
                  setDuesPage(1);
                }}
                className="w-44"
              >
                <option value="">{'সকল শ্রেণি'}</option>
                {(ctx?.classes ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn || c.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={duesItems.length === 0}
              onClick={() =>
                exportToCsv(
                  duesItems.map((d) => ({
                    'শিক্ষার্থী আইডি': d.studentIdCode,
                    নাম: d.studentName,
                    শ্রেণি: d.className,
                    রোল: d.rollNumber,
                    'অভিভাবকের ফোন': d.guardianPhone,
                    'মোট বকেয়া': d.totalDue,
                  })),
                  'admin-dues-oversight.csv'
                )
              }
            >
              <Download className="w-4 h-4" />
              {'CSV ডাউনলোড'}
            </Button>
          </div>

          {loadingDues ? (
            <LoadingSkeleton rows={5} />
          ) : duesItems.length === 0 ? (
            <EmptyState title={'কোনো বকেয়া পাওয়া যায়নি'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-2.5 pr-3">{'শিক্ষার্থী'}</th>
                    <th className="py-2.5 pr-3">{'শ্রেণি ও রোল'}</th>
                    <th className="py-2.5 pr-3">{'অভিভাবকের ফোন'}</th>
                    <th className="py-2.5 pr-3 text-center">{'বকেয়া চালান'}</th>
                    <th className="py-2.5 text-right">{'মোট বকেয়া'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {duesItems.map((row) => (
                    <tr key={row.enrollmentId} className="hover:bg-muted/20">
                      <td className="py-2.5 pr-3 font-medium">{row.studentName}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">
                        {row.className} {row.sectionName ? `(${row.sectionName})` : ''} - {row.rollNumber}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">{row.guardianPhone || '—'}</td>
                      <td className="py-2.5 pr-3 text-center tabular-nums">
                        {formatNumber(row.invoiceCount, 'bn')}টি
                      </td>
                      <td className="py-2.5 text-right font-semibold text-warning tabular-nums">
                        {formatTaka(row.totalDue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <FinancePaginationBar meta={duesData?.meta} onPageChange={setDuesPage} />
        </Card>
      )}

      {/* TAB 4: Cashbook */}
      {tab === 'cashbook' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 no-print">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 flex-1">
              <Input
                value={cbSearch}
                onChange={(e) => {
                  setCbSearch(e.target.value);
                  setCbPage(1);
                }}
                placeholder="ভাউচার বা বিবরণ..."
              />
              <Select
                value={cbType}
                onChange={(e) => {
                  setCbType(e.target.value as '' | 'INCOME' | 'EXPENSE');
                  setCbPage(1);
                }}
              >
                <option value="">{'সকল ধরন'}</option>
                <option value="INCOME">{'জমা (আয়)'}</option>
                <option value="EXPENSE">{'খরচ (ব্যয়)'}</option>
              </Select>
              <Select
                value={cbMethod}
                onChange={(e) => {
                  setCbMethod(e.target.value as '' | FeePaymentMethod);
                  setCbPage(1);
                }}
              >
                <option value="">{'সকল মাধ্যম'}</option>
                {(Object.keys(PAYMENT_METHOD_LABELS) as FeePaymentMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </Select>
              <Input
                type="date"
                value={cbFrom}
                onChange={(e) => {
                  setCbFrom(e.target.value);
                  setCbPage(1);
                }}
                aria-label="শুরুর তারিখ"
              />
              <Input
                type="date"
                value={cbTo}
                onChange={(e) => {
                  setCbTo(e.target.value);
                  setCbPage(1);
                }}
                aria-label="শেষ তারিখ"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={cbItems.length === 0}
                onClick={() =>
                  exportToCsv(
                    cbItems.map((e) => ({
                      তারিখ: formatDateShort(e.date, 'bn'),
                      রেফারেন্স: e.ref,
                      ধরন: e.type === 'INCOME' ? 'জমা' : 'খরচ',
                      খাত: e.category,
                      বিবরণ: e.description,
                      টাকা: e.amount,
                    })),
                    'admin-cashbook-oversight.csv'
                  )
                }
              >
                <Download className="w-4 h-4" />
                {'CSV'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => triggerPrint()}>
                <Printer className="w-4 h-4" />
                {'প্রিন্ট'}
              </Button>
            </div>
          </div>

          {loadingCb ? (
            <LoadingSkeleton rows={5} />
          ) : cbItems.length === 0 ? (
            <EmptyState title={'কোনো ক্যাশবই এন্ট্রি পাওয়া যায়নি'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-2.5 pr-3">{'তারিখ'}</th>
                    <th className="py-2.5 pr-3">{'রসিদ/ভাউচার'}</th>
                    <th className="py-2.5 pr-3">{'ধরন'}</th>
                    <th className="py-2.5 pr-3">{'খাত ও বিবরণ'}</th>
                    <th className="py-2.5 pr-3">{'মাধ্যম'}</th>
                    <th className="py-2.5 text-right">{'টাকা'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {cbItems.map((entry) => (
                    <tr key={`${entry.type}-${entry.id}`} className="hover:bg-muted/20">
                      <td className="py-2.5 pr-3 tabular-nums">{formatDateShort(entry.date, 'bn')}</td>
                      <td className="py-2.5 pr-3 font-mono font-semibold">{entry.ref}</td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge
                          value={entry.type}
                          customTone={entry.type === 'INCOME' ? 'success' : 'destructive'}
                          customLabel={entry.type === 'INCOME' ? 'জমা' : 'খরচ'}
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <div>{entry.description}</div>
                        <div className="text-xs text-muted-foreground">{entry.category}</div>
                      </td>
                      <td className="py-2.5 pr-3">{PAYMENT_METHOD_LABELS[entry.method]}</td>
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
          <FinancePaginationBar meta={cbData?.meta} onPageChange={setCbPage} />
        </Card>
      )}

      <MoneyReceiptModal
        transaction={receiptModalTx}
        schoolProfile={ctx?.schoolProfile}
        onClose={() => setReceiptModalTx(null)}
      />
    </div>
  );
}
