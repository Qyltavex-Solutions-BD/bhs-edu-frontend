'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Ban,
  Banknote,
  CheckCircle2,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  StatCard,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, FormField, Input, Modal, Select } from '@/src/components/ui/primitives';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import {
  useGetFinanceContextQuery,
  useGetTransactionsQuery,
  useVoidTransactionMutation,
  type FeePaymentTransactionItem,
} from '../api/finance.api';
import {
  formatTaka,
  MoneyReceiptModal,
  PAYMENT_METHOD_LABELS,
  RECEIPT_STATUS_LABELS,
} from './finance-ui';

export function TransactionsPage() {
  const { data: ctx } = useGetFinanceContextQuery();
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetTransactionsQuery({
    academicYearId: ctx?.activeAcademicYear?.id,
    search: search.trim() || undefined,
    paymentMethod: paymentMethod || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });

  const [voidTx, { isLoading: voiding }] = useVoidTransactionMutation();
  const [receiptTx, setReceiptTx] = useState<FeePaymentTransactionItem | null>(
    null
  );
  const [voidTarget, setVoidTarget] = useState<FeePaymentTransactionItem | null>(
    null
  );
  const [voidReason, setVoidReason] = useState('');

  const items = data?.items ?? [];
  const meta = data?.meta;

  const pageStats = useMemo(() => {
    const activeItems = items.filter((i) => i.status === 'ACTIVE');
    const voidItems = items.filter((i) => i.status === 'VOID');
    const totalCollected = activeItems.reduce((s, i) => s + i.totalPaid, 0);
    return {
      totalCount: meta?.total ?? items.length,
      activeCount: activeItems.length,
      voidCount: voidItems.length,
      totalCollected,
    };
  }, [items, meta?.total]);

  async function handleVoidSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!voidTarget) return;
    if (!voidReason.trim()) {
      toast.error('রসিদ বাতিলের কারণ উল্লেখ করুন।');
      return;
    }
    try {
      await voidTx({ id: voidTarget.id, reason: voidReason.trim() }).unwrap();
      toast.success(`রসিদ ${voidTarget.receiptNo} বাতিল (VOID) করা হয়েছে।`);
      setVoidTarget(null);
      setVoidReason('');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'রসিদ বাতিল করা যায়নি।');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'রসিদ ও লেনদেনের ইতিহাস'}
        description={'সকল আদায়কৃত ফি রসিদ খুঁজুন, পুনঃমুদ্রণ করুন বা ভুল হলে কারণসহ বাতিল করুন'}
        actions={
          <Link href="/accountant/collect-fee">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              {'নতুন ফি গ্রহণ'}
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={'মোট রসিদ'}
          value={formatNumber(pageStats.totalCount, 'bn')}
          icon={<Receipt className="w-5 h-5" />}
        />
        <StatCard
          label={'সক্রিয় রসিদ (এই পৃষ্ঠায়)'}
          value={formatNumber(pageStats.activeCount, 'bn')}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="success"
        />
        <StatCard
          label={'আদায়কৃত পরিমাণ (এই পৃষ্ঠায়)'}
          value={formatTaka(pageStats.totalCollected)}
          icon={<Banknote className="w-5 h-5" />}
          accent="primary"
        />
        <StatCard
          label={'বাতিলকৃত (VOID)'}
          value={formatNumber(pageStats.voidCount, 'bn')}
          icon={<XCircle className="w-5 h-5" />}
          accent="destructive"
        />
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <FormField label={'খুঁজুন'}>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="transactions-search"
                  name="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="রসিদ নং বা শিক্ষার্থীর নাম..."
                  className="pl-9"
                />
              </div>
            </FormField>
          </div>
          <FormField label={'পেমেন্ট মাধ্যম'}>
            <Select
              id="transactions-method"
              name="paymentMethod"
              aria-label="পেমেন্ট মাধ্যম"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{'সকল পেমেন্ট মাধ্যম'}</option>
              <option value="CASH">{'নগদ (ক্যাশ)'}</option>
              <option value="BKASH">{'বিকাশ (bKash)'}</option>
              <option value="NAGAD">{'নগদ (Nagad)'}</option>
              <option value="ROCKET">{'রকেট (Rocket)'}</option>
              <option value="BANK">{'ব্যাংক জমা'}</option>
            </Select>
          </FormField>
          <FormField label={'অবস্থা'}>
            <Select
              id="transactions-status"
              name="status"
              aria-label="অবস্থা"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{'সকল অবস্থা'}</option>
              <option value="ACTIVE">{'সক্রিয় রসিদ'}</option>
              <option value="VOID">{'বাতিলকৃত (VOID)'}</option>
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
              <span>{'লেনদেনের ইতিহাস লোড করা যায়নি।'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
              {'পুনরায় চেষ্টা করুন'}
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={'কোনো লেনদেন পাওয়া যায়নি'}
            description={'এখনও কোনো ফি রসিদ ইস্যু করা হয়নি অথবা অনুসন্ধানের শর্তে কোনো রসিদ মেলেনি।'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">{'রসিদ নং'}</th>
                    <th className="py-3 px-4">{'শিক্ষার্থী'}</th>
                    <th className="py-3 px-4">{'শ্রেণি ও রোল'}</th>
                    <th className="py-3 px-4">{'মাধ্যম'}</th>
                    <th className="py-3 px-4">{'তারিখ'}</th>
                    <th className="py-3 px-4 text-right">{'নিট জমা'}</th>
                    <th className="py-3 px-4">{'অবস্থা'}</th>
                    <th className="py-3 px-4 text-right">{'অ্যাকশন'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((tx) => {
                    const rawClass =
                      tx.enrollment?.schoolClass.nameBn ||
                      tx.enrollment?.schoolClass.name ||
                      '—';
                    const shortClass = rawClass.replace(/\s*শ্রেণি\s*/g, '').trim();
                    const rollText =
                      tx.enrollment?.roll != null
                        ? formatNumber(tx.enrollment.roll, 'bn')
                        : '—';
                    return (
                    <tr key={tx.id} className="hover:bg-muted/20">
                      <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap">
                        {tx.receiptNo}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {tx.enrollment?.student.nameBn || tx.enrollment?.student.nameEn || '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap tabular-nums">
                        {`${shortClass} - ${rollText}`}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {PAYMENT_METHOD_LABELS[tx.paymentMethod]}
                      </td>
                      <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                        {formatDateShort(tx.paidAt, 'bn')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold tabular-nums whitespace-nowrap">
                        {formatTaka(tx.totalPaid)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge
                          value={tx.status}
                          customTone={tx.status === 'ACTIVE' ? 'success' : 'destructive'}
                          customLabel={RECEIPT_STATUS_LABELS[tx.status]}
                        />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReceiptTx(tx)}
                          >
                            <Printer className="w-4 h-4" />
                            {'রসিদ'}
                          </Button>
                          {tx.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setVoidTarget(tx)}
                            >
                              <Ban className="w-4 h-4 text-destructive" />
                              {'বাতিল'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border text-sm">
                <span className="text-muted-foreground">
                  {`পৃষ্ঠা ${formatNumber(meta.page, 'bn')} / ${formatNumber(meta.totalPages, 'bn')} (মোট ${formatNumber(meta.total, 'bn')}টি)`}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasPreviousPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {'পূর্ববর্তী'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {'পরবর্তী'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <MoneyReceiptModal
        transaction={receiptTx}
        schoolProfile={ctx?.schoolProfile}
        onClose={() => setReceiptTx(null)}
      />

      <Modal
        open={Boolean(voidTarget)}
        onClose={() => {
          setVoidTarget(null);
          setVoidReason('');
        }}
        title={`রসিদ বাতিল করুন — ${voidTarget?.receiptNo ?? ''}`}
        size="sm"
      >
        <form onSubmit={handleVoidSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {'রসিদ বাতিল করলে সংশ্লিষ্ট বকেয়া চালানগুলোর পরিশোধিত হিসাব পুনরায় পূর্বের অবস্থায় ফিরে যাবে।'}
          </p>
          <FormField label={'বাতিলের কারণ'}>
            <Input
              id="void-reason"
              name="reason"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="যেমন: ভুল শিক্ষার্থীর নামে এন্ট্রি হয়েছে"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVoidTarget(null)}
            >
              {'ফিরে যান'}
            </Button>
            <Button type="submit" variant="primary" disabled={voiding}>
              <Receipt className="w-4 h-4" />
              {voiding ? 'বাতিল হচ্ছে...' : 'রসিদ বাতিল নিশ্চিত করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
