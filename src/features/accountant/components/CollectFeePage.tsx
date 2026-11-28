'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { Button, Card, Input, Select } from '@/src/components/ui/primitives';
import { useGetEnrollmentsQuery } from '@/src/features/students/api/students.api';
import {
  useCollectFeeMutation,
  useGetFeeHeadsQuery,
  useGetFinanceContextQuery,
  useGetStudentLedgerQuery,
  type FeePaymentMethod,
  type FeePaymentTransactionItem,
} from '../api/finance.api';
import {
  formatTaka,
  INVOICE_STATUS_LABELS,
  MoneyReceiptModal,
  PAYMENT_METHOD_LABELS,
} from './finance-ui';

interface DraftLineItem {
  key: string;
  invoiceId?: string;
  feeHeadId: string;
  title: string;
  amount: number;
  discount: number;
  netPaid: number;
}

export function CollectFeePage({ initialEnrollmentId }: { initialEnrollmentId?: string }) {
  const { data: ctx } = useGetFinanceContextQuery();
  const activeYearId = ctx?.activeAcademicYear?.id;

  const { data: enrollments = [], isLoading: enrollLoading } =
    useGetEnrollmentsQuery(
      activeYearId ? { academicYearId: activeYearId } : undefined
    );
  const { data: feeHeads = [] } = useGetFeeHeadsQuery();

  const [classFilter, setClassFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(
    initialEnrollmentId ?? ''
  );

  const { data: ledger, isFetching: ledgerFetching } = useGetStudentLedgerQuery(
    selectedEnrollmentId,
    { skip: !selectedEnrollmentId }
  );

  const [collectFee, { isLoading: collecting }] = useCollectFeeMutation();

  const [selectedItems, setSelectedItems] = useState<Record<string, DraftLineItem>>({});
  const [adHocHeadId, setAdHocHeadId] = useState('');
  const [adHocTitle, setAdHocTitle] = useState('');
  const [adHocAmount, setAdHocAmount] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<FeePaymentMethod>('CASH');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [issuedReceipt, setIssuedReceipt] =
    useState<FeePaymentTransactionItem | null>(null);

  const filteredEnrollments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrollments.filter((en: any) => {
      if (classFilter && en.classId !== classFilter) return false;
      if (!q) return true;
      const name = `${en.student?.nameBn ?? ''} ${en.student?.nameEn ?? ''} ${en.student?.name ?? ''}`.toLowerCase();
      const code = String(en.student?.studentId ?? en.student?.studentIdCode ?? '').toLowerCase();
      const roll = String(en.roll ?? en.rollNumber ?? '').toLowerCase();
      return name.includes(q) || code.includes(q) || roll.includes(q);
    });
  }, [enrollments, classFilter, searchQuery]);

  const pendingInvoices = useMemo(
    () =>
      (ledger?.invoices ?? []).filter(
        (inv) => inv.status === 'UNPAID' || inv.status === 'PARTIAL'
      ),
    [ledger?.invoices]
  );

  const lineItemsList = Object.values(selectedItems);
  const totalGross = lineItemsList.reduce((sum, i) => sum + i.amount, 0);
  const totalDiscount = lineItemsList.reduce((sum, i) => sum + i.discount, 0);
  const totalPayable = lineItemsList.reduce((sum, i) => sum + i.netPaid, 0);

  function toggleInvoice(inv: (typeof pendingInvoices)[number]) {
    const key = `inv:${inv.id}`;
    setSelectedItems((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      const due = Math.max(0, inv.netAmount - inv.paidAmount);
      return {
        ...prev,
        [key]: {
          key,
          invoiceId: inv.id,
          feeHeadId: inv.feeHeadId,
          title: inv.title,
          amount: due,
          discount: 0,
          netPaid: due,
        },
      };
    });
  }

  function addAdHocItem() {
    if (!adHocHeadId || !adHocAmount || Number(adHocAmount) <= 0) {
      toast.error('ফি খাত এবং সঠিক টাকার পরিমাণ দিন।');
      return;
    }
    const head = feeHeads.find((h) => h.id === adHocHeadId);
    const amount = Number(adHocAmount);
    const key = `adhoc:${Date.now()}`;
    setSelectedItems((prev) => ({
      ...prev,
      [key]: {
        key,
        feeHeadId: adHocHeadId,
        title: adHocTitle.trim() || head?.name || 'অন্যান্য ফি',
        amount,
        discount: 0,
        netPaid: amount,
      },
    }));
    setAdHocTitle('');
    setAdHocAmount('');
  }

  function updateItemValues(key: string, field: 'discount' | 'netPaid', val: number) {
    setSelectedItems((prev) => {
      const current = prev[key];
      if (!current) return prev;
      const safeVal = Math.max(0, val);
      if (field === 'discount') {
        const clampedDiscount = Math.min(safeVal, current.amount);
        return {
          ...prev,
          [key]: {
            ...current,
            discount: clampedDiscount,
            netPaid: Math.max(0, current.amount - clampedDiscount),
          },
        };
      }
      return {
        ...prev,
        [key]: {
          ...current,
          netPaid: safeVal,
        },
      };
    });
  }

  async function handleCollectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEnrollmentId) {
      toast.error('প্রথমে একজন শিক্ষার্থী নির্বাচন করুন।');
      return;
    }
    if (lineItemsList.length === 0) {
      toast.error('কমপক্ষে একটি ফি আইটেম যোগ বা নির্বাচন করুন।');
      return;
    }
    if (totalPayable <= 0) {
      toast.error('পরিশোধযোগ্য পরিমাণ শূন্যের বেশি হতে হবে।');
      return;
    }

    try {
      const tx = await collectFee({
        academicYearId: activeYearId,
        studentEnrollmentId: selectedEnrollmentId,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        remarks: remarks.trim() || undefined,
        items: lineItemsList.map((i) => ({
          invoiceId: i.invoiceId,
          feeHeadId: i.feeHeadId,
          title: i.title,
          amount: i.amount,
          discount: i.discount,
          netPaid: i.netPaid,
        })),
      }).unwrap();

      toast.success(`রসিদ ${tx.receiptNo} সফলভাবে ইস্যু হয়েছে।`);
      setIssuedReceipt(tx);
      setSelectedItems({});
      setReferenceNo('');
      setRemarks('');
    } catch (err: any) {
      toast.error(err?.message || 'ফি গ্রহণ সম্পন্ন করা যায়নি।');
    }
  }

  if (enrollLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={'শিক্ষার্থী ফি গ্রহণ ও রসিদ ইস্যু'}
          description={'শিক্ষার্থী নির্বাচন করে বকেয়া চালান বা তাৎক্ষণিক ফি গ্রহণ ও রসিদ প্রিন্ট করুন'}
        />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={'শিক্ষার্থী ফি গ্রহণ ও রসিদ ইস্যু'}
        description={'ম্যানুয়ালি নগদ, বিকাশ, নগদ, রকেট বা ব্যাংক জমা গ্রহণ করে সাথে সাথে মানি রসিদ তৈরি করুন'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Student Selector */}
        <Card className="p-5 lg:col-span-4 space-y-4">
          <h2 className="text-base font-semibold text-foreground">{'১. শিক্ষার্থী নির্বাচন'}</h2>
          <div className="space-y-2.5">
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">{'সকল শ্রেণি'}</option>
              {(ctx?.classes ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn || c.name}
                </option>
              ))}
            </Select>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম, আইডি বা রোল দিয়ে খুঁজুন..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-border border border-border rounded-lg">
            {filteredEnrollments.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                {'কোনো শিক্ষার্থী পাওয়া যায়নি'}
              </p>
            ) : (
              filteredEnrollments.slice(0, 60).map((en: any) => {
                const isSelected = en.id === selectedEnrollmentId;
                return (
                  <button
                    key={en.id}
                    type="button"
                    onClick={() => {
                      setSelectedEnrollmentId(en.id);
                      setSelectedItems({});
                    }}
                    className={`w-full text-left px-3.5 py-2.5 transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <p className="text-base font-medium text-foreground">
                      {en.student?.nameBn || en.student?.nameEn || en.student?.name || '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {en.schoolClass?.nameBn ?? en.schoolClass?.name} · {'রোল'}{' '}
                      {en.roll ?? en.rollNumber ?? '—'} ·{' '}
                      <span className="font-mono">
                        {en.student?.studentId ?? en.student?.studentIdCode ?? ''}
                      </span>
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Right: Ledger & Payment Form */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedEnrollmentId ? (
            <Card className="p-6">
              <EmptyState
                title={'বাম তালিকা থেকে একজন শিক্ষার্থী নির্বাচন করুন'}
                description={'শিক্ষার্থী নির্বাচন করলে তার বকেয়া চালান ও ফি আদায়ের ফর্ম এখানে দেখা যাবে।'}
              />
            </Card>
          ) : ledgerFetching ? (
            <Card className="p-6">
              <LoadingSkeleton rows={5} />
            </Card>
          ) : (
            <>
              {/* Student Banner */}
              <Card className="p-5 bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {ledger?.enrollment.student.nameBn || ledger?.enrollment.student.nameEn || '—'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {'আইডি:'}{' '}
                      <span className="font-mono">
                        {ledger?.enrollment.student.studentId ?? '—'}
                      </span>{' '}
                      · {ledger?.enrollment.schoolClass.nameBn} · {'রোল:'}{' '}
                      {ledger?.enrollment.roll ?? '—'} · {'অভিভাবকের ফোন:'}{' '}
                      {ledger?.enrollment.student.guardianPhone ?? '—'}
                    </p>
                  </div>
                  {(ledger?.waivers.length ?? 0) > 0 && (
                    <StatusBadge
                      value="WAIVER"
                      customTone="info"
                      customLabel={`বৃত্তি/ছাড় সক্রিয়: ${ledger?.waivers.length}টি`}
                    />
                  )}
                </div>
              </Card>

              {/* Pending Invoices */}
              <Card className="p-5 space-y-3">
                <h3 className="text-base font-semibold text-foreground">
                  {'২. বকেয়া চালানসমূহ (সিলেক্ট করে যোগ করুন)'}
                </h3>
                {pendingInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {'এই শিক্ষার্থীর কোনো বকেয়া চালান নেই। নিচ থেকে সরাসরি তাৎক্ষণিক ফি যোগ করতে পারেন।'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingInvoices.map((inv) => {
                      const key = `inv:${inv.id}`;
                      const checked = Boolean(selectedItems[key]);
                      const due = Math.max(0, inv.netAmount - inv.paidAmount);
                      return (
                        <label
                          key={inv.id}
                          className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleInvoice(inv)}
                              className="w-4 h-4 accent-primary"
                            />
                            <div>
                              <p className="text-base font-medium text-foreground">
                                {inv.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {`মোট: ${formatTaka(inv.netAmount)} · পরিশোধিত: ${formatTaka(inv.paidAmount)} · `}
                                <span className="text-warning font-semibold">
                                  {`বকেয়া: ${formatTaka(due)}`}
                                </span>
                              </p>
                            </div>
                          </div>
                          <StatusBadge
                            value={inv.status}
                            customTone={inv.status === 'PARTIAL' ? 'warning' : 'destructive'}
                            customLabel={INVOICE_STATUS_LABELS[inv.status]}
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Ad-hoc Fee Item */}
              <Card className="p-5 space-y-3">
                <h3 className="text-base font-semibold text-foreground">
                  {'৩. তাৎক্ষণিক / অতিরিক্ত ফি যোগ করুন (ভর্তি, পরীক্ষা, টিসি, জরিমানা ইত্যাদি)'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-1">{'ফি খাত'}</label>
                    <Select
                      value={adHocHeadId}
                      onChange={(e) => setAdHocHeadId(e.target.value)}
                    >
                      <option value="">{'খাত নির্বাচন'}</option>
                      {feeHeads.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{'বিবরণ (ঐচ্ছিক)'}</label>
                    <Input
                      value={adHocTitle}
                      onChange={(e) => setAdHocTitle(e.target.value)}
                      placeholder="যেমন: এসএসসি ফরম ফিলাপ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{'টাকা (৳)'}</label>
                    <Input
                      type="number"
                      min={1}
                      value={adHocAmount}
                      onChange={(e) => setAdHocAmount(e.target.value)}
                      placeholder="যেমন: ১২০০"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={addAdHocItem}>
                    <Plus className="w-4 h-4" />
                    {'রসিদে যোগ করুন'}
                  </Button>
                </div>
              </Card>

              {/* Finalize Payment */}
              <Card className="p-5">
                <form onSubmit={handleCollectSubmit} className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground">
                    {'৪. রসিদের বিবরণ ও পেমেন্ট গ্রহণ'}
                  </h3>

                  {lineItemsList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {'এখনও কোনো ফি আইটেম যোগ করা হয়নি।'}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-base">
                        <thead>
                          <tr className="border-b border-border text-left text-sm text-muted-foreground">
                            <th className="py-2 pr-3">{'বিবরণ'}</th>
                            <th className="py-2 pr-3 text-right">{'নির্ধারিত'}</th>
                            <th className="py-2 pr-3 text-right w-28">{'ছাড় (৳)'}</th>
                            <th className="py-2 pr-3 text-right w-32">{'জমা (৳)'}</th>
                            <th className="py-2 text-right">{'বাদ'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItemsList.map((item) => (
                            <tr key={item.key} className="border-b border-border/60">
                              <td className="py-2 pr-3 font-medium">{item.title}</td>
                              <td className="py-2 pr-3 text-right tabular-nums">
                                {formatTaka(item.amount)}
                              </td>
                              <td className="py-2 pr-3">
                                <Input
                                  type="number"
                                  min={0}
                                  max={item.amount}
                                  value={item.discount}
                                  onChange={(e) =>
                                    updateItemValues(
                                      item.key,
                                      'discount',
                                      Number(e.target.value)
                                    )
                                  }
                                  placeholder="০"
                                  className="text-right"
                                />
                              </td>
                              <td className="py-2 pr-3">
                                <Input
                                  type="number"
                                  min={0}
                                  value={item.netPaid}
                                  onChange={(e) =>
                                    updateItemValues(
                                      item.key,
                                      'netPaid',
                                      Number(e.target.value)
                                    )
                                  }
                                  placeholder="০"
                                  className="text-right"
                                />
                              </td>
                              <td className="py-2 text-right">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setSelectedItems((prev) => {
                                      const next = { ...prev };
                                      delete next[item.key];
                                      return next;
                                    })
                                  }
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">{'পেমেন্ট মাধ্যম'}</label>
                      <Select
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as FeePaymentMethod)
                        }
                      >
                        {(Object.keys(PAYMENT_METHOD_LABELS) as FeePaymentMethod[]).map(
                          (m) => (
                            <option key={m} value={m}>
                              {PAYMENT_METHOD_LABELS[m]}
                            </option>
                          )
                        )}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {'ট্রানজেকশন / রেফারেন্স নং (ঐচ্ছিক)'}
                      </label>
                      <Input
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="যেমন: TrxID বা রসিদ রেফারেন্স"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{'মন্তব্য (ঐচ্ছিক)'}</label>
                      <Input
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="অতিরিক্ত কোনো নোট থাকলে লিখুন"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border">
                    <div className="text-base space-y-0.5">
                      <p className="text-sm text-muted-foreground">
                        {`মোট: ${formatTaka(totalGross)} · ছাড়: ${formatTaka(totalDiscount)}`}
                      </p>
                      <p className="text-xl font-bold text-primary tabular-nums">
                        {`সর্বমোট গ্রহণযোগ্য: ${formatTaka(totalPayable)}`}
                      </p>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={collecting || lineItemsList.length === 0}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {collecting ? 'সংরক্ষণ হচ্ছে...' : 'ফি গ্রহণ ও রসিদ ইস্যু করুন'}
                    </Button>
                  </div>
                </form>
              </Card>
            </>
          )}
        </div>
      </div>

      <MoneyReceiptModal
        transaction={issuedReceipt}
        schoolProfile={ctx?.schoolProfile}
        onClose={() => setIssuedReceipt(null)}
      />
    </div>
  );
}
