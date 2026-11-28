'use client';

import React, { useState } from 'react';
import { Ban, Printer, Receipt, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Modal, Select } from '@/src/components/ui/primitives';
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

  const { data, isLoading } = useGetTransactionsQuery({
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
      toast.error(err?.message || 'রসিদ বাতিল করা যায়নি।');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'রসিদ ও লেনদেনের ইতিহাস'}
        description={'সকল আদায়কৃত ফি রসিদ খুঁজুন, পুনঃমুদ্রণ করুন বা ভুল হলে কারণসহ বাতিল করুন'}
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="রসিদ নং, শিক্ষার্থীর নাম বা আইডি..."
              className="pl-9"
            />
          </div>
          <Select
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
          <Select
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
        </div>
      </Card>

      <Card className="p-5">
        {isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title={'কোনো লেনদেন পাওয়া যায়নি'}
            description={'অনুসন্ধানের শর্ত পরিবর্তন করে আবার চেষ্টা করুন।'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="py-2.5 pr-4">{'রসিদ নং'}</th>
                    <th className="py-2.5 pr-4">{'শিক্ষার্থী'}</th>
                    <th className="py-2.5 pr-4">{'শ্রেণি'}</th>
                    <th className="py-2.5 pr-4">{'মাধ্যম'}</th>
                    <th className="py-2.5 pr-4">{'তারিখ'}</th>
                    <th className="py-2.5 pr-4 text-right">{'নিট জমা'}</th>
                    <th className="py-2.5 pr-4">{'অবস্থা'}</th>
                    <th className="py-2.5 text-right">{'অ্যাকশন'}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 font-mono font-semibold">
                        {tx.receiptNo}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">
                          {tx.enrollment?.student.nameBn || tx.enrollment?.student.nameEn || '—'}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {tx.enrollment?.student.studentId ?? ''}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-sm text-muted-foreground">
                        {tx.enrollment?.schoolClass.nameBn} · {'রোল'}{' '}
                        {tx.enrollment?.roll ?? '—'}
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
                  ))}
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
          <div>
            <label className="block text-sm font-medium mb-1">
              {'বাতিলের কারণ'}
            </label>
            <Input
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="যেমন: ভুল শিক্ষার্থীর নামে এন্ট্রি হয়েছে"
            />
          </div>
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
